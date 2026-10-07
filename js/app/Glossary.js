/* ════════════════════════════════════════════
Glossary.js
Всплывающие подсказки для санскритских терминов
и пословного разбора (WBW).
════════════════════════════════════════════ */

class Glossary {
    constructor(library) {
        this.library  = library;
        this._timer   = null;
        this._delay   = 1200; // мс до появления тултипа

        this.#initListeners();
    }

    // ── Показать тултип для WBW ───────────────────────────────────────────
    showTip(e, skr, tr, def) {
        const tip = document.getElementById('tip');
        if (!tip) return;

        document.getElementById('tipSkr').textContent = skr;
        document.getElementById('tipTr').textContent  = tr;
        document.getElementById('tipDef').textContent = def;

        tip.classList.add('on');
        this.#positionTip(tip, e);

        setTimeout(() => document.addEventListener('click', () => this.hideTip(), {once: true}), 10);
    }

    // ── Показать тултип для глоссария ─────────────────────────────────────
    showGlossaryTip(e, term) {
        const key   = term.toLowerCase().trim();
        const entry = this.library.glossary[key];
        if (!entry) return;

        const isRu = window.lang === 'ru';
        const def  = (isRu && entry.ru) ? entry.ru : entry.en;
        if (!def) return;

        const tip = document.getElementById('tip');
        if (!tip) return;

        document.getElementById('tipSkr').textContent = isRu ? 'Глоссарий' : 'Glossary';
        document.getElementById('tipTr').textContent  = entry.term || term;
        document.getElementById('tipDef').textContent = def;

        tip.classList.add('on');
        this.#positionTip(tip, e);

        setTimeout(() => document.addEventListener('click', () => this.hideTip(), {once: true}), 10);
    }

    // ── Скрыть тултип ────────────────────────────────────────────────────
    hideTip() {
        const tip = document.getElementById('tip');
        if (tip) tip.classList.remove('on');
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    // ── Приватные методы ──────────────────────────────────────────────────
    #positionTip(tip, e) {
        const x = Math.min(e.clientX + 12, window.innerWidth  - 280);
        const y = Math.min(e.clientY + 12, window.innerHeight - 110);
        tip.style.left = x + 'px';
        tip.style.top  = y + 'px';
    }

    #initListeners() {
        // Наведение на span[data-term] → показываем глоссарий
        document.addEventListener('mouseover', (e) => {
            const span = e.target.closest('span[data-term]');
            if (!span) return;
            const term = span.getAttribute('data-term');
            if (!this.library.glossary[term]) return;
            this._timer = setTimeout(() => this.showGlossaryTip(e, term), this._delay);
        });

        document.addEventListener('mouseout', (e) => {
            const span = e.target.closest('span[data-term]');
            if (!span) return;
            this.hideTip();
        });
    }
}

// ── Глобальный экземпляр ─────────────────────────────────────────────────────
window.Glossary = new Glossary(window.Library);

// Глобальные алиасы для обратной совместимости
function showTip(e, skr, tr, def) { window.Glossary.showTip(e, skr, tr, def); }
function hideTip()                  { window.Glossary.hideTip(); }
function showGlossaryTip(e, term)  { window.Glossary.showGlossaryTip(e, term); }
