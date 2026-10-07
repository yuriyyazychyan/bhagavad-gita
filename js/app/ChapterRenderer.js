/* ════════════════════════════════════════════
ChapterRenderer.js
Рендеринг глав: стихи, специальные разделы,
текстовые книги (content.json).
════════════════════════════════════════════ */

class ChapterRenderer {
    constructor(library) {
        this.library        = library;
        this._restoreScroll = false;
        this.#initErrorHandler();
    }

    // ── Рендеринг главы ───────────────────────────────────────────────────
    render(n, skipScroll = false) {
        if (typeof clearHighlights === 'function') clearHighlights();

        const page = document.getElementById('page');
        page.style.maxHeight = '';
        page.style.overflow  = 'auto';

        // Спецраздел (строка)
        if (typeof n === 'string') {
            const parts = n.split('#');
            this.loadSpecial(parts[0], parts[1] || null);
            return;
        }

        const lib = this.library;

        // Книга-глава (content.json)
        if (lib.isChapterBook) {
            window.curCh = n;
            window.menuCh = n;
            window.Nav.menuCh = n;
            if (lib.content[String(n)]?.length) this.renderChapterContent(n);
            else this.renderComingSoon(n);
            return;
        }

        // Книга-стихи (verses.json)
        const verses  = lib.verses[n];
        const chapter = lib.getChapter(n);

        if (!verses?.length || !chapter) {
            page.innerHTML = `<div style="padding:24px;">${
                window.lang === 'ru' ? 'Данные главы недоступны' : 'Chapter data unavailable'
            }</div>`;
            return;
        }

        window.curCh  = n;
        window.menuCh = n;
        window.Nav.menuCh = n;   // TOC читает Nav.menuCh, а не window.menuCh

        const isRu  = window.lang === 'ru';
        const illus = lib.meta.illustration
            ? `<img src='${lib.meta.illustration}' class='ch-illustration'
                    style='width:240px;height:240px;display:block;margin:0px auto 24px;'>`
            : '';

        let html = `<div class="ch-opening">
            <div class="ch-word">${isRu ? 'Глава' : 'Chapter'} ${window.numWord ? numWord(n) : n}</div>
            ${illus}
            <div class="ch-eng-title">${isRu ? chapter.ru : chapter.en}</div>
        </div>`;

        if (!verses.length) {
            html += `<div class="empty">${
                isRu ? 'Тексты этой главы будут добавлены...' : 'Texts for this chapter coming soon...'
            }</div>`;
        } else {
            verses.forEach(v => { html += this.renderVerse(v, n); });
        }
        html += navButtonsHtml(n);

        page.innerHTML = html;

        const titleEl = document.getElementById('topTitle');
        if (titleEl) titleEl.innerHTML = isRu ? chapter.ru : chapter.en;

        renderToc();
        updateBm();
        document.getElementById('overlay')?.classList.remove('on');
        document.getElementById('bmpanel')?.classList.remove('on');
        localStorage.setItem(lib.LS('lang'), window.lang);
        localStorage.setItem(lib.LS('chapter'), n);
        updateIllustration();

        if (!skipScroll) {
            const savedScroll = parseInt(localStorage.getItem(lib.LS('scroll'))) || 0;
            if (window._restoreScroll && savedScroll > 0) {
                setTimeout(() => window.scrollTo({top: savedScroll, behavior: 'instant'}), 50);
            } else {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
            window._restoreScroll = false;
        }
    }

    // ── Рендеринг одного стиха ────────────────────────────────────────────
    renderVerse(v, chN) {
        const lib  = this.library;
        const isRu = window.lang === 'ru';
        const key  = `${chN}.${v.n}`;
        const isBm = window.BM?.has(key) || false;

        // Транслитерация с кликабельными словами
        let trLines = (v.tr || '').split('\n').map(line =>
            line.split(' ').map(tok => {
                const wd = v.words?.find(w => tok.startsWith(w.tr.replace(/[''']/g, '')));
                if (wd) return `<span class="w" onclick="showTip(event,'${esc(wd.skr)}','${esc(wd.tr)}','${esc(isRu ? wd.ru : wd.en)}')">${tok}</span>`;
                return tok;
            }).join(' ')
        ).join('<br>');

        const translitHtml = isRu ? iastToRu(trLines) : trLines;

        // Пурпорт
        const pur = isRu ? v.pur_ru : v.pur_en;
        const purHtml = (pur && pur.trim() !== '—' && pur.trim() !== '')
            ? `<div class="purport-tog" onclick="togPurport(this)"
                    style='font-family:"CA Moskow",serif;font-size:22px;letter-spacing:-0.02em;font-weight:500;
                           display:block;text-align:center;margin:16px 0 16px;color:var(--ink);
                           transform:scaleX(0.9);cursor:pointer;user-select:none;'>
                    ${isRu ? 'РАЗЪЯСНЕНИЕ' : 'PURPORT'}
               </div>
               <div class="purport-body">${formatPurport(pur)}</div>`
            : '';

        // Пульсирующая точка (подсказка)
        const firstVn     = lib.verses[chN]?.[0]?.n;
        const showPulse   = chN === window.curCh && v.n === firstVn && !localStorage.getItem(lib.LS('hint_shown'));
        const pulseHtml   = showPulse ? '<span class="pulse-dot"></span>' : '';

        return `
<div class="verse" id="v${chN}_${v.n}">
    <div style='text-align:center;margin:24px 0 24px;position:relative;'>
        <span style='font-family:"CA Moskow",serif;font-size:22px;letter-spacing:-0.02em;color:var(--ink);cursor:pointer;'
              onmouseenter="showVerseTooltip(this)"
              onmouseleave="hideVerseTooltip(this)"
              ontouchstart="toggleVerseTooltip(this)">
            ${isRu ? (v.nLabel ? 'ТЕКСТЫ' : 'ТЕКСТ') : (v.nLabel ? 'TEXTS' : 'TEXT')}&nbsp;&nbsp;${v.nLabel || v.n}${pulseHtml}
        </span>
        <div class="verse-tooltip" style='display:none;position:absolute;top:130%;left:50%;
             transform:translateX(-50%);background:var(--paper2);border:0.5px solid var(--rule);
             border-radius:8px;padding:10px 16px;white-space:nowrap;z-index:200;'>
            <div style='display:flex;align-items:center;gap:16px;'>
                <button class='vbtn ${isBm ? "bm" : ""}' onclick='toggleBm("${key}",event)'
                        style='display:flex;align-items:center;gap:6px;font-size:13px;'>
                    ${isBm
                        ? '<img src="img/love.png" style="width:13px;height:13px;vertical-align:middle;">'
                        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'}
                    ${isRu ? 'Добавить в любимые' : 'Add to favorites'}
                </button>
                <div style='width:0.5px;height:20px;background:var(--rule);'></div>
                <a class='audio-lnk' href='${v.audio || '#'}' target='_blank'
                   style='display:flex;align-items:center;gap:6px;font-size:13px;border:none;padding:0;margin:0;'>
                    ▶ ${isRu ? 'Прослушать класс' : 'Listen to class'}
                </a>
            </div>
        </div>
    </div>
    <div class="v-sanskrit"><div class="v-sanskrit-inner">${(v.skr || '').replace(/\n/g, '<br>')}</div></div>
    <div class="v-translit"><div style="display:inline-block;text-align:left;">${translitHtml}</div></div>
    <div class="v-wbw">${formatWbw(isRu ? v.wbw_ru : v.wbw_en)}</div>
    <div style='font-family:"CA Moskow",serif;font-size:22px;letter-spacing:-0.02em;font-weight:500;
                display:block;text-align:center;margin:16px 0 16px;color:var(--ink);transform:scaleX(0.9);'>
        TRANSLATION
    </div>
    <div class="v-translation">${isRu ? v.tr_ru : v.tr_en}</div>
    ${purHtml}
</div>`;
    }

    // ── Глава без текста (в content.json её ещё нет) ─────────────────────
    renderComingSoon(n) {
        const lib = this.library;
        const chapter = lib.getChapter(n);
        const isRu = window.lang === 'ru';
        const title = chapter ? (isRu ? (chapter.ru ?? chapter.en) : (chapter.en ?? chapter.ru)) : '';

        document.getElementById('page').innerHTML = `
        <div class="chapter-content">
        <div class="ch-title" id="ch${n}">${title}</div>
        <div class="empty">${isRu ? 'Текст этой главы будет добавлен...' : 'Text of this chapter coming soon...'}</div>
        ${navButtonsHtml(n)}
        </div>`;

        const titleEl = document.getElementById('topTitle');
        if (titleEl) titleEl.innerHTML = title;

        renderToc();
        updateBm();
        document.getElementById('overlay')?.classList.remove('on');
        localStorage.setItem(lib.LS('chapter'), String(n));
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    // ── Рендеринг главы из content.json ──────────────────────────────────
    renderChapterContent(n) {
        const lib     = this.library;
        const chapter = lib.getChapter(n);
        if (!chapter) return;

        const paragraphs = lib.content[String(n)] || [];
        const isRu       = window.lang === 'ru';
        const title       = isRu ? chapter.ru : chapter.en;

        let html = `<div class="chapter-content"><div class="ch-title" id="ch${n}">${title}</div>`;
        paragraphs.forEach(para => {
            const text = (isRu ? para.text_ru : para.text_en) || '';
            if (!text.trim()) return;
            html += formatPurport(text);
        });
        html += navButtonsHtml(n);
        html += '</div>';

        const page = document.getElementById('page');
        page.innerHTML = html;

        const titleEl = document.getElementById('topTitle');
        if (titleEl) titleEl.innerHTML = title;

        renderToc();
        updateBm();
        document.getElementById('overlay')?.classList.remove('on');
        document.getElementById('bmpanel')?.classList.remove('on');
        localStorage.setItem(lib.LS('lang'), window.lang);
        localStorage.setItem(lib.LS('chapter'), String(n));
        updateIllustration();
        window.scrollTo({top: 0, behavior: 'smooth'});
    }

    // ── Загрузка спецраздела из HTML файла ───────────────────────────────
    async loadSpecial(section, anchor = null) {
        const lib = this.library;
        window.curCh = section.toLowerCase();
        localStorage.setItem(lib.LS('chapter'), section.toLowerCase());

        try {
            const res = await fetch(`${lib.bookPath}/special/${section.toLowerCase()}.html`);
            if (!res.ok) throw new Error(`Не удалось загрузить раздел: ${section}`);

            const text    = await res.text();
            const parser  = new DOMParser();
            const doc     = parser.parseFromString(text, 'text/html');
            let html      = doc.body.innerHTML;

            // Форматирование санскрита (кроме исключений)
            const noFmt = lib.noFormat;
            if (!noFmt.includes(section.toLowerCase())) {
                html = formatPurport(html);
            }

            const page = document.getElementById('page');
            page.innerHTML = html + navButtonsHtml(section);

            // Заголовок
            const chapterData = lib.chapters.find(c => c.n === section)
                || lib.chapters.flatMap(c => c.children || []).find(c => c.n === section);
            const titleEl = document.getElementById('topTitle');
            if (titleEl) titleEl.innerHTML =
                chapterData ? chapterData[window.lang === 'ru' ? 'ru' : 'en'] : section;

            updateIllustration();

            // Скролл
            const savedScroll = parseInt(localStorage.getItem(lib.LS('scroll'))) || 0;
            if (anchor) {
                setTimeout(() => {
                    const el = document.getElementById(anchor);
                    if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
                }, 100);
            } else if (window._restoreScroll && savedScroll > 0) {
                setTimeout(() => window.scrollTo({top: savedScroll, behavior: 'instant'}), 50);
            } else {
                window.scrollTo({top: 0, behavior: 'smooth'});
            }
            window._restoreScroll = false;

        } catch(err) {
            console.error('Ошибка при загрузке контента:', err);
            document.getElementById('page').innerHTML =
                `<div style="padding:24px;">${
                    window.lang === 'ru' ? 'Ошибка загрузки контента' : 'Error loading content'
                }</div>`;
        }
    }

    // ── Tooltip стиха ─────────────────────────────────────────────────────
    showVerseTooltip(el) {
        el.nextElementSibling.style.display = 'block';
    }

    hideVerseTooltip(el) {
        const tooltip = el.nextElementSibling;
        tooltip.addEventListener('mouseenter', () => clearTimeout(tooltip._hideTimer));
        tooltip.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        tooltip._hideTimer = setTimeout(() => { tooltip.style.display = 'none'; }, 600);
    }

    toggleVerseTooltip(el) {
        const t = el.nextElementSibling;
        t.style.display = t.style.display === 'none' ? 'block' : 'none';
    }

    togPurport(el) {
        el.classList.toggle('closed');
        el.nextElementSibling.classList.toggle('closed');
    }

    // ── Глобальный обработчик ошибок ─────────────────────────────────────
    #initErrorHandler() {
        window.addEventListener('error', (event) => {
            if (!event.error) return;
            const msg = event.error.message || '';
            if (/clipboard|share|AbortError|NotAllowedError|quoteSelBtn/i.test(msg)) {
                console.warn('Ignored non-critical error:', msg);
                return;
            }
            console.error('Произошла ошибка:', msg);
        });
    }
}

// ── Глобальный экземпляр ─────────────────────────────────────────────────────
window.Renderer = new ChapterRenderer(window.Library);

// Глобальные алиасы для обратной совместимости
function renderChapter(n, skipScroll)   { window.Renderer.render(n, skipScroll); }
function renderVerse(v, chN)            { return window.Renderer.renderVerse(v, chN); }
function renderChapterContent(n)        { window.Renderer.renderChapterContent(n); }
function loadSpecialContent(s, anchor)  { window.Renderer.loadSpecial(s, anchor); }
function togPurport(el)                 { window.Renderer.togPurport(el); }
function showVerseTooltip(el)           { window.Renderer.showVerseTooltip(el); }
function hideVerseTooltip(el)           { window.Renderer.hideVerseTooltip(el); }
function toggleVerseTooltip(el)         { window.Renderer.toggleVerseTooltip(el); }
