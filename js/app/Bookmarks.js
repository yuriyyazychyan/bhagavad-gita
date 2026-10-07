/* ════════════════════════════════════════════
Bookmarks.js
Управление закладками и цитатами:
добавление, удаление, отображение, шаринг.
════════════════════════════════════════════ */

class Bookmarks {
    constructor(library) {
        this.library   = library;
        this.items     = JSON.parse(localStorage.getItem(library.LS('bm')) || '[]');

        this.#initQuoteButton();
    }

    // ── Сохранить в localStorage ──────────────────────────────────────────
    #save() {
        localStorage.setItem(this.library.LS('bm'), JSON.stringify(this.items));
    }

    // ── Переключить закладку стиха ────────────────────────────────────────
    toggle(key, e) {
        e.stopPropagation();
        const idx = this.items.findIndex(b => b.key === key);
        if (idx >= 0) {
            this.items.splice(idx, 1);
        } else {
            const [ch, vn] = key.split('.');
            const verses   = this.library.verses[+ch] || [];
            const v        = verses.find(x => x.n === +vn);
            const isRu     = window.lang === 'ru';
            const tr       = v ? ((isRu ? v.tr_ru : v.tr_en) || '') : '';
            const translit = v ? (v.tr || '') : '';
            const txt      = tr.slice(0, 90) + (tr.length > 90 ? '…' : '');
            const fullText = [translit, tr].filter(Boolean).join('\n\n');
            this.items.push({
                key,
                type:     'verse',
                txt,
                fullText,
                book:     this.library.bookId,
            });
        }
        this.#save();
        // Перерендерить текущую главу чтобы обновить иконку ♡
        if (typeof renderChapter === 'function') renderChapter(window.curCh, true);
    }

    // ── Добавить закладку текста (для книг без стихов) ────────────────────
    addText(anchorId, previewText) {
        const key = String(window.curCh);
        if (this.items.some(b => b.key === key && b.type === 'text' && b.anchor === anchorId)) return;
        this.items.push({
            key,
            type:   'text',
            txt:    (previewText || '').slice(0, 90),
            anchor: anchorId || null,
            book:   this.library.bookId,
        });
        this.#save();
        this.render();
        this.toast(window.lang === 'ru' ? 'Закладка добавлена!' : 'Bookmark added!');
    }

    // ── Добавить цитату из выделенного текста ────────────────────────────
    addQuote() {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            this.toast(window.lang === 'ru' ? 'Выделите текст для цитаты' : 'Select text to quote');
            return;
        }
        const quote = selection.toString().trim().slice(0, 200);
        if (!quote) return;

        let key    = String(window.curCh);
        let anchor = null;

        const range     = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const verseEl   = (container.nodeType === 1 ? container : container.parentElement)
            ?.closest('[id^="v"]');

        if (verseEl) {
            const m = verseEl.id.match(/v(\d+)_(\d+)/);
            if (m) key = `${m[1]}.${m[2]}`;
            anchor = verseEl.id;
        }

        this.items.push({
            key,
            type:   'quote',
            txt:    quote.slice(0, 80) + (quote.length > 80 ? '...' : ''),
            quote,
            anchor,
            book:   this.library.bookId,
        });

        this.#save();
        selection.removeAllRanges();
        this.render();
        this.toast(window.lang === 'ru' ? 'Цитата сохранена!' : 'Quote saved!');
    }

    // ── Удалить закладку ──────────────────────────────────────────────────
    delete(idx) {
        this.items.splice(idx, 1);
        this.#save();
        this.render();
    }

    // ── Перейти к закладке ────────────────────────────────────────────────
    goTo(key, anchor) {
        document.getElementById('bmpanel').classList.remove('on');
        const bm    = this.items.find(b => b.key === key);
        const chNum = parseInt(key.split('.')[0]);

        if (!isNaN(chNum) && key.includes('.')) {
            renderChapter(chNum);
        } else {
            renderChapter(isNaN(+key) ? key : +key);
        }

        setTimeout(() => {
            const targetId = anchor || (key.includes('.') ? 'v' + key.replace('.', '_') : null);
            const el = targetId ? document.getElementById(targetId) : null;
            if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});

            // Подсветить цитату если это quote-закладка
            if (bm?.quote && typeof highlightSearchTerm === 'function') {
                setTimeout(() => {
                    highlightSearchTerm(bm.quote.slice(0, 30));
                    if (typeof showClearHighlightBtn === 'function') showClearHighlightBtn();
                }, 200);
            }
        }, 300);
    }

    // ── Проверить наличие закладки ────────────────────────────────────────
    has(key) {
        return this.items.some(b => b.key === key);
    }

    // ── Построить URL для шаринга ─────────────────────────────────────────
    #buildShareUrl(b) {
        const base   = window.location.origin + window.location.pathname;
        const params = new URLSearchParams({book: this.library.bookId});
        if (b.key?.includes('.')) {
            const [ch, verse] = b.key.split('.');
            params.set('ch', ch);
            params.set('verse', verse);
        } else {
            params.set('bm', b.key);
        }
        if (b.anchor) params.set('anchor', b.anchor);
        if (b.quote)  params.set('quote', b.quote.slice(0, 100));
        return base + '?' + params.toString();
    }

    // ── Поделиться закладкой ──────────────────────────────────────────────
    share(idx) {
        const b   = this.items[idx];
        const url = this.#buildShareUrl(b);

        let shareText = '';
        if (b.type === 'quote' && b.quote) {
            shareText = b.quote + '\n\n' + url;
        } else if (b.fullText) {
            shareText = b.fullText + '\n\n' + url;
        } else {
            shareText = url;
        }

        if (navigator.share) {
            navigator.share({
                title: this.library.meta.title || 'Prabhupada Library',
                text:  shareText,
                url,
            }).catch(err => {
                if (err.name !== 'AbortError') this.#copyToClipboard(shareText);
            });
        } else {
            this.#copyToClipboard(shareText);
        }
    }

    #copyToClipboard(text) {
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text)
                .then(() => this.toast(window.lang === 'ru' ? 'Скопировано!' : 'Copied!'))
                .catch(() => this.#fallbackCopy(text));
        } else {
            this.#fallbackCopy(text);
        }
    }

    #fallbackCopy(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            document.execCommand('copy');
            this.toast(window.lang === 'ru' ? 'Скопировано!' : 'Copied!');
        } catch(e) {
            this.toast(window.lang === 'ru' ? 'Не удалось скопировать' : 'Copy failed');
        }
        document.body.removeChild(ta);
    }

    // ── Отрисовать панель закладок ────────────────────────────────────────
    render() {
        const isRu = window.lang === 'ru';
        const bmCnt = document.getElementById('bmCnt');
        if (bmCnt) bmCnt.innerHTML =
            `<span style="font-family:'CA Moskow',serif;font-size:14px;">${this.items.length}</span>`;

        const list = document.getElementById('bmList');
        if (!list) return;

        if (!this.items.length) {
            list.innerHTML = `<div class="bm-empty">${
                isRu
                    ? 'Наведи на номер любого текста и нажми ♡ чтобы добавить его сюда'
                    : 'Hover over any text number and tap ♡ to add it here'
            }</div>`;
            return;
        }

        const shortTitle = isRu
            ? (this.library.meta.shortTitleRu || 'Бг')
            : (this.library.meta.shortTitle   || 'Bg');

        list.innerHTML = this.items.map((b, idx) => {
            const refLabel  = (b.type === 'text' || b.type === 'quote')
                ? String(b.key)
                : `${shortTitle} ${b.key}`;
            const quoteHtml = b.quote
                ? `<div class="bm-quote">${b.quote}</div>` : '';

            return `<div class="bm-item">
                <div class="bm-item-header">
                    <span class="bm-ref" onclick="BM.goTo('${b.key}','${b.anchor || ''}')">
                        <span style="font-family:'CA Moskow',serif;font-size:14px;">${refLabel}</span>
                    </span>
                    <div class="bm-actions">
                        <button class="bm-action-btn" onclick="BM.share(${idx})" title="${isRu ? 'Поделиться' : 'Share'}">⎙</button>
                        <button class="bm-action-btn bm-delete" onclick="BM.delete(${idx})" title="${isRu ? 'Удалить' : 'Delete'}">✕</button>
                    </div>
                </div>
                <div class="bm-txt" onclick="BM.goTo('${b.key}','${b.anchor || ''}')">${b.txt}</div>
                ${quoteHtml}
            </div>`;
        }).join('');
    }

    // ── Toast уведомление ─────────────────────────────────────────────────
    toast(msg) {
        let el = document.getElementById('bmToast');
        if (!el) {
            el = document.createElement('div');
            el.id = 'bmToast';
            el.style.cssText = [
                'position:fixed','bottom:100px','left:50%',
                'transform:translateX(-50%)',
                'background:var(--ink)','color:var(--paper)',
                'padding:8px 16px','border-radius:20px',
                'font-size:13px',
                'font-family:"IM Fell English",Georgia,serif',
                'z-index:999','transition:opacity 0.3s',
                'pointer-events:none',
            ].join(';');
            document.body.appendChild(el);
        }
        el.textContent    = msg;
        el.style.opacity  = '1';
        setTimeout(() => { el.style.opacity = '0'; }, 2000);
    }

    // ── Плавающая кнопка цитаты при выделении текста ─────────────────────
    #initQuoteButton() {
        document.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            let btn = document.getElementById('quoteSelBtn');

            if (!selection || selection.isCollapsed || !selection.toString().trim()) {
                if (btn) btn.remove();
                return;
            }

            const range = selection.getRangeAt(0);
            const page  = document.getElementById('page');
            if (!page?.contains(range.commonAncestorContainer)) {
                if (btn) btn.remove();
                return;
            }

            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'quoteSelBtn';
                btn.style.cssText = [
                    'position:absolute','z-index:500',
                    'background:var(--ink)','color:var(--paper)',
                    'border:none','border-radius:16px',
                    'padding:5px 12px','font-size:13px',
                    'font-family:"IM Fell English",Georgia,serif',
                    'cursor:pointer',
                    'box-shadow:0 2px 8px rgba(0,0,0,0.2)',
                    'white-space:nowrap',
                ].join(';');
                btn.onclick = () => { this.addQuote(); btn.remove(); };
                document.body.appendChild(btn);
            }

            btn.innerHTML = window.lang === 'ru' ? '❝ Сохранить цитату' : '❝ Save quote';
            const rect = range.getBoundingClientRect();
            btn.style.left = Math.max(8, rect.left + rect.width / 2 - 70) + 'px';
            btn.style.top  = (rect.top + window.scrollY - 44) + 'px';
        });

        document.addEventListener('mousedown', (e) => {
            const btn = document.getElementById('quoteSelBtn');
            if (btn && e.target !== btn) btn.remove();
        });
    }
}

// ── Глобальный экземпляр ─────────────────────────────────────────────────────
window.BM = new Bookmarks(window.Library);

// Глобальные алиасы для обратной совместимости
function toggleBm(key, e)            { window.BM.toggle(key, e); }
function updateBm()                   { window.BM.render(); }
function goToBm(key, anchor)          { window.BM.goTo(key, anchor); }
function deleteBm(idx)                { window.BM.delete(idx); }
function shareBm(idx)                 { window.BM.share(idx); }
function addQuoteBm()                 { window.BM.addQuote(); }
function addTextBm(anchor, preview)   { window.BM.addText(anchor, preview); }
function showToast(msg)               { window.BM.toast(msg); }
function buildShareUrl(b)             { return window.BM['_Bookmarks__buildShareUrl'](b); }
