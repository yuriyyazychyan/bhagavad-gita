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

    // ════════════════════════════════════════════════════════════════════
    //  КНИГИ С ГЛАВАМИ (meta.type = "chapters")
    //
    //  Вид шапки главы выбирается в books/<id>/meta.json:
    //      "chapterOpening": "word"      — «CHAPTER ONE» + иллюстрация + название (как БГ)
    //      "chapterOpening": "numeral"   — крупная цифра + название (как скан Elevation)
    //  Если поле не задано или значение неизвестно — используется "word".
    //  Новый вариант: метод #openingXxx + строка в switch в #openingHtml
    //  + CSS-блок .ch-opening--xxx в css/chapter.css.
    //
    //  Тип абзаца берётся из content.json, если задано поле "type":
    //      "verse"       — санскритская цитата ("\n" внутри текста = перенос строки)
    //      "translation" — перевод стиха (жирным)
    //      "text"        — обычный абзац
    //  Если поля нет — тип определяется автоматически.
    // ════════════════════════════════════════════════════════════════════
    // ── Шапка главы: выбор варианта по meta.chapterOpening ───────────────
    #openingHtml(n, title) {
        const lib = this.library;

        // Хук для CSS: body[data-book="<id>"] — можно переопределять оформление
        // конкретной книги, не трогая остальные.
        document.body.dataset.book = lib.bookId;

        switch (lib.meta.chapterOpening) {
            case 'numeral': return this.#openingNumeral(n, title);
            case 'word':
            default:        return this.#openingWord(n, title);
        }
    }

    // Вариант "word": «ГЛАВА ПЕРВАЯ» + иллюстрация + название (как в БГ)
    #openingWord(n, title) {
        const lib = this.library;
        const isRu = window.lang === 'ru';
        const word = (window.numWord && numWord(n)) || n;   // для глав > 18 — просто число
        const illus = lib.meta.illustration
            ? `<img src='${lib.meta.illustration}' class='ch-illustration'
                            style='width:240px;height:240px;display:block;margin:0px auto 24px;'
                            onerror="this.style.display='none'">`
            : '';

        return `<div class="ch-opening ch-opening--word">
            <div class="ch-word">${isRu ? 'Глава' : 'Chapter'} ${word}</div>
            ${illus}
            <div class="ch-eng-title ch-title" id="ch${n}">${title}</div>
        </div>`;
    }

    // Вариант "numeral": крупная цифра + название (как в скане Elevation)
    #openingNumeral(n, title) {
        return `<div class="ch-opening ch-opening--numeral">
            <div class="ch-num">${n}</div>
            <div class="ch-name ch-title" id="ch${n}">${title}</div>
        </div>`;
    }

    // ── Типографские кавычки: "…" → “…” ───────────────────────────────────
    //    Шрифт IM Fell рисует прямую " как ”, поэтому открывающую меняем явно.
    //    Одинарные ' не трогаем — по ним сверяются straightNames («Kṛṣṇa's»).
    #smartQuotes(text) {
        if (text.includes('<')) return text;    // в тексте есть HTML — не трогаем
        return text
            .replace(/(^|[\s(\[—–-])"/g, '$1“')
            .replace(/"/g, '”');
    }

    // ── Перевод в кавычках: “…” (Bg. 4.1) [остальной текст] ───────────────
    //    Возвращает { quote, ref, rest } или null
    #splitTranslation(text) {
        const withRef = text.match(/^\s*(["“][\s\S]*?["”])\s*(\([^()]*\d[^()]*\))\s*([\s\S]*)$/);
        if (withRef) return { quote: withRef[1], ref: withRef[2], rest: withRef[3].trim() };

        // Абзац целиком в кавычках (без ссылки)
        const whole = text.match(/^\s*(["“][^"“”]*["”])\s*$/);
        return whole ? { quote: whole[1], ref: '', rest: '' } : null;
    }

    // ── Текст без HTML-тегов и сущностей (&nbsp;, &amp; …) ────────────────
    //    Для определения типа абзаца. Без этого «;» внутри «&nbsp;», которым
    //    отбиваются отступы строк стиха, принималось за признак английской
    //    фразы, и стих рассыпался на отдельные абзацы.
    #plain(text) {
        return text
            .replace(/<[^>]*>/g, ' ')
            .replace(/&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/gi, ' ');
    }

    // ── Санскритская цитата (та же логика, что в Formatter) ───────────────
    #isSanskrit(text) {
        const t = this.#plain(text).trim();
        if (t.length < 5 || /\s—\s/.test(t)) return false;
        const words = t.split(/\s+/);
        if (words.length < 2) return false;
        const skr = words.filter(w => Fmt.diacritics.test(w)).length;

        // Признаки английского текста: «Слово», «;», точка в конце, служебные слова.
        // Служебные слова ищем как отдельные слова (не внутри санскритского «nāthe»).
        const hasEnglish =
                  /[A-Z][a-z]/.test(t)
            || /;/.test(t)
            || /[.!?:]["“”]?$/.test(t)
            || /(?<![\p{L}'’-])(?:the|is|are|and|of|to|in|that|this|we|he|his|who|with|for|not|by|be|was|were|has|have|you|your|our)(?![\p{L}'’-])/iu.test(t);

        return (skr >= 1 && !hasEnglish) || skr / words.length > 0.5;
    }

    #detectKind(text) {
        if (this.#splitTranslation(text)) return 'translation';
        if (this.#isSanskrit(text)) return 'verse';
        return 'text';
    }

    #translationHtml(quote, ref) {
        return `<div class="ch-translation">${quote}${ref ? ` <span class="ch-ref">${ref}</span>` : ''}</div>`;
    }

    // ── Абзацы главы → HTML ───────────────────────────────────────────────
    #paragraphsHtml(paragraphs, isRu) {
        let html = '';
        let verseLines = [];   // подряд идущие санскритские строки

        const flushVerses = () => {
            if (!verseLines.length) return;
            html += verseLines.length === 1
                ? `<p class="ch-verse">${verseLines[0]}</p>`
                : `<div class="v-translit">${verseLines.join('<br>')}</div>`;
            verseLines = [];
        };

        for (const para of paragraphs) {
            const raw = ((isRu ? para.text_ru : para.text_en) || '').trim();
            if (!raw) continue;
            const text = this.#smartQuotes(raw);

            const kind = para.type || this.#detectKind(text);

            if (kind === 'verse') {
                verseLines.push(...text.split('\n').map(s => s.trim()).filter(Boolean));
                continue;
            }

            flushVerses();

            if (kind === 'translation') {
                const t = this.#splitTranslation(text);
                html += t ? this.#translationHtml(t.quote, t.ref) : this.#translationHtml(text, '');
                if (t?.rest) html += formatPurport(t.rest);
            } else {
                html += formatPurport(text);
            }
        }

        flushVerses();
        return html;
    }

    // ── Рендеринг главы из content.json ──────────────────────────────────
    renderChapterContent(n) {
        const lib = this.library;
        const chapter = lib.getChapter(n);
        if (!chapter) return;

        const isRu = window.lang === 'ru';
        const title = isRu ? (chapter.ru ?? chapter.en) : (chapter.en ?? chapter.ru);
        const paragraphs = lib.content[String(n)] || [];

        const page = document.getElementById('page');
        page.innerHTML = `<div class="chapter-content">
            ${this.#openingHtml(n, title)}
            ${this.#paragraphsHtml(paragraphs, isRu)}
            ${navButtonsHtml(n)}
        </div>`;

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

    // ── Глава без текста (в content.json её ещё нет) ─────────────────────
    renderComingSoon(n) {
        const lib = this.library;
        const chapter = lib.getChapter(n);
        const isRu = window.lang === 'ru';
        const title = chapter ? (isRu ? (chapter.ru ?? chapter.en) : (chapter.en ?? chapter.ru)) : '';

        document.getElementById('page').innerHTML = `<div class="chapter-content">
            ${this.#openingHtml(n, title)}
            <div class="empty">${isRu ? 'Текст этой главы будет добавлен...' : 'Text of this chapter coming soon...'}</div>
            ${navButtonsHtml(n)}
        </div>`;

        const titleEl = document.getElementById('topTitle');
        if (titleEl) titleEl.innerHTML = title;

        renderToc();
        updateBm();
        document.getElementById('overlay')?.classList.remove('on');
        document.getElementById('bmpanel')?.classList.remove('on');
        localStorage.setItem(lib.LS('chapter'), String(n));
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
