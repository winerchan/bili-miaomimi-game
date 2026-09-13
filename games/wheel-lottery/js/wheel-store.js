/* 前后台共用配置规则；云端只读，本地数据只写入当前浏览器。 */
(function (root) {
    'use strict';
    const KEY = 'wheel-lottery-library-v2';
    const LEGACY_KEY = 'wheel-lottery-config';
    const copy = value => JSON.parse(JSON.stringify(value));
    const nameOf = config => String(config?.settings?.title || '').trim();
    const builtins = [
        { id: 'classic', name: '星喵幸运转盘', file: 'prizes.json' },
        { id: 'challenge', name: '不怕死挑战', file: 'challenge.json' }
    ];

    function validate(config) {
        if (!nameOf(config)) throw new Error('请输入转盘名称');
        if (!config.settings || !config.rarityConfig || !Array.isArray(config.prizes) || config.prizes.length < 2) {
            throw new Error('配置需要基本设置、稀有度和至少两个奖项');
        }
        for (const rarity of ['超稀有', '稀有', '普通']) {
            const rc = config.rarityConfig[rarity];
            if (!rc || !['color', 'bgColor', 'glowColor'].every(k => typeof rc[k] === 'string') || !Array.isArray(rc.particleColors)) {
                throw new Error('稀有度配置不完整');
            }
        }
        const ids = new Set();
        let sum = 0;
        for (const prize of config.prizes) {
            if (!Number.isFinite(prize.id) || ids.has(prize.id) || typeof prize.name !== 'string' || !['超稀有', '稀有', '普通'].includes(prize.rarity)
                || !Number.isFinite(prize.probability) || prize.probability < 0 || prize.probability > 100) {
                throw new Error('奖项编号、名称、稀有度或概率无效');
            }
            ids.add(prize.id);
            sum += prize.probability;
        }
        if (Math.abs(sum - 100) > 0.001) throw new Error('奖项总概率必须为 100%');
        const s = config.settings;
        if (!Number.isFinite(s.spinDuration) || s.spinDuration <= 0 || !Number.isInteger(s.minSpins)
            || !Number.isInteger(s.maxSpins) || s.minSpins < 1 || s.maxSpins < s.minSpins) {
            throw new Error('转动时长须大于 0，圈数须为正整数且最多圈数不能小于最少圈数');
        }
        return config;
    }

    class WheelStore {
        constructor() {
            this.cloud = [];
            this.reserved = new Set(builtins.map(x => x.name));
            this.cloudReady = false;
            this.messages = [];
            this.state = { version: 2, locals: [], order: [], selected: '', legacyMigrated: false };
        }

        read() {
            const raw = localStorage.getItem(KEY);
            if (!raw) return { version: 2, locals: [], order: [], selected: '', legacyMigrated: false };
            const value = JSON.parse(raw);
            if (value.version !== 2 || !Array.isArray(value.locals) || !Array.isArray(value.order)) {
                throw new Error('本地转盘数据格式异常，原数据已保留');
            }
            const ids = new Set();
            for (const entry of value.locals) {
                if (typeof entry.id !== 'string' || !entry.id.startsWith('local:') || ids.has(entry.id)) throw new Error('本地转盘编号异常');
                validate(entry.config);
                ids.add(entry.id);
            }
            return value;
        }

        write(state) {
            // 先持久化，成功后才改变内存，避免存储失败时显示“已保存”。
            try { localStorage.setItem(KEY, JSON.stringify(state)); }
            catch (error) { throw new Error('保存失败：浏览器存储不可用或空间不足'); }
            this.state = state;
        }

        async fetchJson(url) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            try {
                const response = await fetch(url, { cache: 'no-cache', signal: controller.signal });
                if (!response.ok) throw new Error('配置加载失败');
                return await response.json();
            } finally { clearTimeout(timer); }
        }

        async load(fallback) {
            let manifest = builtins;
            let manifestReady = false;
            try {
                const data = await this.fetchJson('config/wheels.json');
                if (!Array.isArray(data.wheels) || !data.wheels.length) throw new Error('清单为空');
                const ids = new Set();
                for (const x of data.wheels) {
                    if (typeof x.id !== 'string' || !x.id || ids.has(x.id) || typeof x.name !== 'string' || !x.name.trim()
                        || typeof x.file !== 'string' || !/^[\w-]+\.json$/.test(x.file)) throw new Error('清单格式错误');
                    ids.add(x.id);
                }
                manifest = data.wheels;
                manifestReady = true;
            } catch (error) { this.messages.push('云端清单加载失败，请刷新重试'); }
            this.reserved = new Set(manifest.map(x => x.name.trim()));
            const results = await Promise.allSettled(manifest.map(async entry => {
                const config = validate(await this.fetchJson('config/' + entry.file));
                if (nameOf(config) !== entry.name.trim()) throw new Error('清单名称与配置不一致');
                return { id: 'cloud:' + entry.id, source: 'cloud', config };
            }));
            this.cloud = results.filter(x => x.status === 'fulfilled').map(x => x.value);
            this.cloudReady = manifestReady && results.every(x => x.status === 'fulfilled');
            if (!this.cloudReady) this.messages.push('云端配置未完整加载，暂时不能新建、复制或保存本地转盘，以免名称冲突');
            if (!this.cloud.length && fallback) this.cloud = [{ id: 'cloud:classic', source: 'cloud', config: fallback() }];
            try {
                this.state = this.read();
                if (this.cloudReady && !this.state.legacyMigrated) this.migrate();
            } catch (error) { this.messages.push(error.message || '本地存储不可用，原数据已保留'); }
            return this;
        }

        migrate() {
            const state = this.read();
            const raw = localStorage.getItem(LEGACY_KEY);
            if (raw) {
                const config = validate(JSON.parse(raw));
                const original = nameOf(config);
                config.settings.title = this.uniqueName(original, state);
                const id = this.newId();
                state.locals.push({ id, config });
                state.selected = id;
                this.messages.push(config.settings.title === original ? '已迁移原有本地转盘' : '原有本地转盘已保留为“' + config.settings.title + '”');
            }
            state.legacyMigrated = true;
            this.write(state);
            // 保留旧键作为备份，用迁移标志避免重复导入。
        }

        newId() { return 'local:' + crypto.randomUUID(); }

        uniqueName(base, state = this.state) {
            let name = base.trim() || '新转盘';
            let i = 1;
            while (this.reserved.has(name) || state.locals.some(x => nameOf(x.config) === name)) {
                name = base.trim() + '（本地' + (i === 1 ? '' : ' ' + i) + '）';
                i++;
            }
            return name;
        }

        checkName(name, excludeId = '') {
            name = String(name || '').trim();
            if (!name) throw new Error('请输入转盘名称');
            if (!this.cloudReady) throw new Error('请等待云端配置完整加载后重试');
            const state = this.read();
            if (this.reserved.has(name) || state.locals.some(x => x.id !== excludeId && nameOf(x.config) === name)) {
                throw new Error('“' + name + '”已存在，请使用不同的名称');
            }
            return name;
        }

        list(includeHidden = false) {
            // 先确定云端优先的可见集合，再应用排序，排序不会改变优先级。
            const seen = new Set();
            const entries = [];
            for (const entry of [...this.cloud, ...this.state.locals.map(x => ({ ...x, source: 'local' }))]) {
                const name = nameOf(entry.config);
                const hidden = seen.has(name) || (entry.source === 'local' && this.reserved.has(name));
                if (!hidden || includeHidden) entries.push({ ...entry, hidden });
                seen.add(name);
            }
            const order = new Map(this.state.order.map((id, i) => [id, i]));
            return entries.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
        }

        save(id, config) {
            if (id && !id.startsWith('local:')) throw new Error('云端转盘只读，请先复制并改名');
            const value = copy(validate(config));
            value.settings.title = this.checkName(nameOf(value), id);
            const state = this.read();
            if (id && !state.locals.some(x => x.id === id)) throw new Error('该本地转盘已被删除，请重新打开');
            id = id || this.newId();
            const entry = { id, config: value };
            const index = state.locals.findIndex(x => x.id === id);
            if (index < 0) state.locals.push(entry); else state.locals[index] = entry;
            state.selected = id;
            this.write(state);
            return id;
        }

        remove(id) {
            if (!id.startsWith('local:')) throw new Error('只能删除本地转盘');
            const state = this.read();
            state.locals = state.locals.filter(x => x.id !== id);
            state.order = state.order.filter(x => x !== id);
            if (state.selected === id) state.selected = '';
            this.write(state);
        }

        select(id) {
            const state = this.read();
            state.selected = id;
            this.write(state);
        }

        move(id, delta) {
            this.state = this.read();
            const ids = this.list().map(x => x.id);
            const index = ids.indexOf(id);
            if (index < 0 || index + delta < 0 || index + delta >= ids.length) return;
            [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
            this.write({ ...this.state, order: ids });
        }
    }

    WheelStore.KEY = KEY;
    WheelStore.validate = validate;
    WheelStore.copy = copy;
    WheelStore.nameOf = nameOf;
    root.escapeWheelText = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
    root.WheelStore = WheelStore;
})(globalThis);
