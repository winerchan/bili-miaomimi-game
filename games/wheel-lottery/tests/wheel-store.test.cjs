// 运行：node --test games/wheel-lottery/tests/wheel-store.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const root = join(__dirname, '..');
const code = readFileSync(join(root, 'js/wheel-store.js'), 'utf8');
const classic = JSON.parse(readFileSync(join(root, 'config/prizes.json')));
const clone = x => JSON.parse(JSON.stringify(x));
function named(name) { const c = clone(classic); c.settings.title = name; return c; }
function env(seed = {}, failures = []) {
    const data = new Map(Object.entries(seed));
    let failWrites = false;
    const localStorage = {
        getItem: k => data.get(k) ?? null,
        setItem: (k, v) => { if (failWrites) throw Error('QuotaExceededError'); data.set(k, v); }
    };
    const context = vm.createContext({ localStorage, crypto: webcrypto, AbortController, setTimeout, clearTimeout,
        fetch: async url => ({ ok: !failures.includes(url), json: async () => JSON.parse(readFileSync(join(root, url))) })
    });
    vm.runInContext(code, context);
    return { Store: context.WheelStore, data, setFailWrites: value => { failWrites = value; } };
}

test('默认加载两个云端转盘，新挑战的内容与概率保持准确', async () => {
    const { Store } = env(); const store = await new Store().load();
    assert.deepEqual(Array.from(store.list(), x => x.config.settings.title), ['星喵幸运转盘', '不怕死挑战']);
    const c = store.list()[1].config;
    assert.equal(c.prizes.length, 12);
    assert.equal(c.prizes.reduce((s, p) => s + p.probability, 0), 100);
    assert.equal(c.prizes.at(-1).description, '说出最羞耻的一件事');
});

test('新建、复制和改名都拒绝云端及其他本地转盘重名，首尾空格不绕过检查', async () => {
    const { Store } = env(); const store = await new Store().load();
    assert.throws(() => store.save('', named('  不怕死挑战  ')), /已存在/);
    const a = store.save('', named('本地 A'));
    const b = store.save('', named('本地 B'));
    assert.throws(() => store.save('', named('本地 A')), /已存在/);
    assert.throws(() => store.save(b, named('本地 A')), /已存在/);
    assert.throws(() => store.save(a, named('星喵幸运转盘')), /已存在/);
    store.save(a, named('  改名 A  '));
    assert.equal(store.list().find(x => x.id === a).config.settings.title, '改名 A');
    assert.throws(() => store.save('cloud:classic', named('任意名')), /只读/);
    assert.throws(() => store.remove('cloud:classic'), /只能删除本地/);
});

test('旧配置自动改为不冲突的本地名称，迁移幂等且保留原始备份', async () => {
    const raw = JSON.stringify(classic);
    const { Store, data } = env({ 'wheel-lottery-config': raw });
    const first = await new Store().load();
    assert.equal(first.state.locals.length, 1);
    assert.equal(first.state.locals[0].config.settings.title, '星喵幸运转盘（本地）');
    assert.deepEqual(clone(first.state.locals[0].config.prizes), classic.prizes);
    const second = await new Store().load();
    assert.equal(second.state.locals.length, 1);
    second.remove(second.state.locals[0].id);
    assert.equal((await new Store().load()).state.locals.length, 0);
    assert.equal(data.get('wheel-lottery-config'), raw);
});

test('云端后来占用本地名称时云端优先，本地可在后台改名找回', async () => {
    const { Store, data } = env(); const store = await new Store().load();
    const state = clone(store.state);
    state.locals.push({ id: 'local:conflict', config: named('不怕死挑战') });
    state.order = ['local:conflict', 'cloud:challenge', 'cloud:classic'];
    data.set(Store.KEY, JSON.stringify(state));
    const loaded = await new Store().load();
    assert.equal(loaded.list().length, 2);
    assert.equal(loaded.list()[0].source, 'cloud');
    assert.equal(loaded.list(true).find(x => x.id === 'local:conflict').hidden, true);
    loaded.save('local:conflict', named('本地挑战'));
    assert.equal(loaded.list().length, 3);
});

test('排序持久化，改名保持位置，删除不影响其他转盘', async () => {
    const { Store } = env(); const store = await new Store().load();
    const id = store.save('', named('自定义'));
    store.move(id, -1); store.move(id, -1);
    store.save(id, named('改名后'));
    const loaded = await new Store().load();
    assert.equal(loaded.list()[0].id, id);
    assert.equal(loaded.state.selected, id);
    loaded.remove(id);
    assert.equal(loaded.list().length, 2);
    assert.equal(loaded.state.order.includes(id), false);
});

test('跨标签页保存重新读取数据，拒绝过期名称及已被删除的转盘', async () => {
    const { Store } = env(); const a = await new Store().load(); const b = await new Store().load();
    const id = a.save('', named('标签页 A'));
    b.save('', named('标签页 B'));
    assert.equal(b.state.locals.length, 2);
    assert.throws(() => a.save('', named('标签页 B')), /已存在/);
    b.remove(id);
    assert.throws(() => a.save(id, named('修改 A')), /已被删除/);
});

test('保存失败不更改内存和已有数据', async () => {
    const { Store, data, setFailWrites } = env(); const store = await new Store().load();
    const before = data.get(Store.KEY);
    setFailWrites(true);
    assert.throws(() => store.save('', named('不能保存')), /保存失败/);
    assert.equal(store.state.locals.length, 0);
    assert.equal(data.get(Store.KEY), before);
});

test('云端部分失败仍可使用已加载的转盘，但禁止无法完整检查重名的写入', async () => {
    const { Store } = env({}, ['config/challenge.json']); const store = await new Store().load();
    assert.equal(store.cloudReady, false);
    assert.equal(store.list().length, 1);
    assert.throws(() => store.save('', named('新的')), /完整加载/);
});

test('本地数据损坏时保留原数据，不因保存新转盘覆盖旧数据', async () => {
    const { Store, data } = env({ 'wheel-lottery-library-v2': '{broken' });
    const store = await new Store().load();
    assert.equal(store.list().length, 2);
    assert.throws(() => store.save('', named('新的')));
    assert.equal(data.get(Store.KEY), '{broken');
});

test('非法概率、重复奖项和无效转动范围不能保存', async () => {
    const { Store } = env(); const store = await new Store().load();
    const bad = named('坏配置');
    bad.prizes[0].probability = -1;
    assert.throws(() => store.save('', bad), /概率/);
    const duplicate = named('重复编号'); duplicate.prizes[1].id = duplicate.prizes[0].id;
    assert.throws(() => store.save('', duplicate), /编号/);
    const duration = named('时长错误'); duration.settings.spinDuration = 0;
    assert.throws(() => store.save('', duration), /转动时长/);
});
