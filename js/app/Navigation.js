/* ════════════════════════════════════════════
Navigation.js
Навигация по книге: TOC, переключение глав,
переход к стихам, кнопки prev/next.
════════════════════════════════════════════ */

class Navigation {
    constructor(library) {
        this.library      = library;
        this.bookOpen     = true;
        this.appendixOpen = null;
        this.menuCh       = null;
    }

    // ── Кнопки prev/next внизу главы ─────────────────────────────────────
    navButtonsHtml(current) {
        const { prev, next } = this.library.getAdjacentChapters(current);
        const isRu = window.lang === 'ru';
        const chapterLabel = isRu ? 'Глава' : 'Chapter';

        const stripTags = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        const label = (ch, dir) => {
            // Защита от undefined: если нет нужного языка — берём другой
            const name = stripTags(isRu ? (ch.ru ?? ch.en) : (ch.en ?? ch.ru));
            const isNum = typeof ch.n === 'number';
            const arg = isNum ? ch.n : `'${String(ch.n).replace(/'/g, "\\'")}'`;
            const text = isNum
            ? (dir === 'prev' ? `← ${chapterLabel} ${ch.n}. ${name}` : `${chapterLabel} ${ch.n}. ${name} →`)
            : (dir === 'prev' ? `← ${name}` : `${name} →`);
            return `<div style="cursor:pointer;font-family:'CA Moskow',serif;font-size:16px;color:var(--ink2);"
            onclick="renderChapter(${arg})">${text}</div>`;
        };

        const prevHtml = prev ? label(prev, 'prev') : '<div></div>';
        const nextHtml = next ? label(next, 'next') : '<div></div>';
        return `<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid var(--rule);">
        ${prevHtml}${nextHtml}
        </div>`;
    }

    // ── Отрисовать TOC ────────────────────────────────────────────────────
    renderToc() {
        const lib  = this.library;
        const isRu = window.lang === 'ru';
        const isChapterBook = lib.isChapterBook;

        if (!lib.chapters?.length) return;

        let tocHtml = '';

        lib.chapters.forEach(chapter => {
            const isSpecial  = typeof chapter.n === 'string';
            const isActive   = chapter.n === window.curCh;
            const hasVerses  = !isChapterBook && lib.verses[chapter.n]?.length > 0;

            if (isSpecial) {
                const hasChildren    = chapter.children?.length > 0;
                const isAppendixOpen = this.appendixOpen === chapter.n;

                if (hasChildren) {
                    tocHtml += `
                    <div class="ch-row ${isAppendixOpen ? 'on' : ''}" onclick="Nav.toggleAppendix('${chapter.n}')">
                        <span class="ch-label">${isRu ? chapter.ru : chapter.en}</span>
                        <span class="ch-vcount"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.v}</span></span>
                    </div>`;

                    if (isAppendixOpen) {
                        tocHtml += `<div class="toc-verses">`;
                        chapter.children.forEach(child => {
                            const isChildActive = child.n === window.curCh;
                            tocHtml += `
                            <div class="toc-verse ${isChildActive ? 'on' : ''}" onclick="renderChapter('${child.n}')">
                                <span class="toc-dash">-</span>${isRu ? child.ru : child.en}
                            </div>`;
                        });
                        tocHtml += `</div>`;
                    }
                } else {
                    tocHtml += `
                    <div class="ch-row ${isActive ? 'on' : ''}" onclick="renderChapter('${chapter.n}')">
                        <span class="ch-label">${isRu ? chapter.ru : chapter.en}</span>
                    </div>`;
                }
            } else {
                if (isChapterBook) {
                    // Книга-глава: простой клик
                    tocHtml += `
                    <div class="ch-row ${isActive ? 'on' : ''}" onclick="renderChapter(${chapter.n})">
                        <span class="ch-n"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.n}</span>.</span>
                        <span class="ch-label">${isRu ? chapter.ru : chapter.en}</span>
                    </div>`;
                } else {
                    // Книга-стихи: раскрываемый список стихов
                    tocHtml += `
                    <div class="ch-row ${isActive ? 'on' : ''}" onclick="Nav.toggleChapter(${chapter.n})">
                        <span class="ch-n"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.n}</span>.</span>
                        <span class="ch-label">${isRu ? chapter.ru : chapter.en}</span>
                        <span class="ch-vcount"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.v}</span></span>
                    </div>`;

                    if (hasVerses && chapter.n === this.menuCh && !this.appendixOpen) {
                        const verses = lib.verses[chapter.n];
                        tocHtml += `<div class="toc-verses">`;
                        tocHtml += verses.map(v => {
                            const key  = `${chapter.n}.${v.n}`;
                            const isBm = window.BM?.has(key);
                            return `
                            <div class="toc-verse" onclick="Nav.goToVerse(${chapter.n}, ${v.n})">
                                <span class="toc-bm">${isBm
                                    ? '<img src="img/love.png" style="width:12px;height:12px;vertical-align:middle;">'
                                    : '&nbsp;&nbsp;&nbsp;'}</span>
                                ${isRu ? (v.nLabel ? 'Тексты' : 'Текст') : (v.nLabel ? 'Texts' : 'Text')} ${v.nLabel || v.n}
                            </div>`;
                        }).join('');
                        tocHtml += `</div>`;
                    }
                }
            }
        });

        // Список книг (когда TOC свёрнут)
        const bookList = document.getElementById('sbBookList');
        document.getElementById('tocList').innerHTML = tocHtml;
    }

    // ── Переключить раскрытие главы в TOC ────────────────────────────────
    toggleChapter(n) {
        this.appendixOpen = null;
        if (n === this.menuCh) {
            this.menuCh = null;
        } else {
            this.menuCh = n;
            renderChapter(n);
        }
        this.renderToc();
    }

    // ── Переключить раскрытие приложения (Appendixes) ────────────────────
    toggleAppendix(n) {
        this.appendixOpen = this.appendixOpen === n ? null : n;
        this.renderToc();
        if (this.appendixOpen) {
            setTimeout(() => {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.scrollTo({top: sidebar.scrollHeight, behavior: 'smooth'});
            }, 50);
        }
    }

    // ── Переключить показ TOC / список книг ──────────────────────────────
    toggleBook() {
        this.bookOpen = !this.bookOpen;
        document.getElementById('tocList').style.display = this.bookOpen ? 'block' : 'none';
        const arrow = document.getElementById('bookArrow');
        if (arrow) arrow.style.transform = this.bookOpen ? '' : 'rotate(180deg)';

        let bookList = document.getElementById('sbBookList');
        if (!this.bookOpen) {
            if (!bookList) {
                bookList = document.createElement('div');
                bookList.id = 'sbBookList';
                document.getElementById('sidebar').appendChild(bookList);
            }
            const lib = this.library;
            bookList.innerHTML = lib.allBooks.map(m => `
                <a class="sb-book-item ${m.id === lib.bookId ? 'sb-book-active' : ''}"
                   href="reader.html?book=${m.id}">
                    <span class="sb-book-title">${m.title}</span>
                    <span class="sb-book-year">${m.year || ''}</span>
                </a>
            `).join('');
            bookList.style.display = 'block';
        } else {
            if (bookList) bookList.style.display = 'none';
        }
    }

    // ── Перейти к стиху ───────────────────────────────────────────────────
    goToVerse(ch, vn) {
        // Resolve диапазон если нужно
        const resolved = this.library.resolveVerse(ch, vn);
        if (resolved && resolved.n !== vn) vn = resolved.n;

        const needRender = !document.getElementById(`v${ch}_${vn}`);
        if (needRender) {
            renderChapter(ch, true);
            setTimeout(() => {
                if (window.innerWidth < 768) closeAll();
                setTimeout(() => this.#scrollToVerse(ch, vn), 350);
            }, 100);
        } else {
            if (window.innerWidth < 768) closeAll();
            setTimeout(() => this.#scrollToVerse(ch, vn), 100);
        }
    }

    // ── Приватный скролл к стиху ──────────────────────────────────────────
    #scrollToVerse(ch, vn) {
        const verses  = this.library.verses[ch] || [];
        const firstVn = verses[0]?.n;
        if (vn === firstVn) {
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
            const el = document.getElementById(`v${ch}_${vn}`);
            if (el) {
                const top = el.getBoundingClientRect().top + window.scrollY - 56;
                window.scrollTo({top, behavior: 'smooth'});
            }
        }
    }

    // ── Обновить sbHead из BOOK_META ──────────────────────────────────────
    updateSbHead() {
        const meta  = this.library.meta;
        const title = meta.title || 'Prabhupada Library';
        const year  = meta.year  || '';
        const el    = document.getElementById('sbHead');
        if (!el) return;
        el.innerHTML = `<span onclick="Nav.toggleBook()" style="cursor:pointer;">
            <img src="img/icon_book.png" style="width:20px;height:20px;margin-bottom:2px;vertical-align:middle;margin-right:8px;">
            ${title}
            <span style="font-family:'CA Moskow',serif;font-size:14px;">${year}</span>
            <span id="bookArrow" style="font-size:11px;display:inline-block;transition:transform 0.25s ease;margin-left:4px;vertical-align:middle;">↑</span>
        </span>`;
    }
}

// ── Глобальный экземпляр ─────────────────────────────────────────────────────
window.Nav = new Navigation(window.Library);

// Глобальные алиасы для обратной совместимости
function renderToc()            { window.Nav.renderToc(); }
function toggleChapter(n)       { window.Nav.toggleChapter(n); }
function toggleAppendix(n)      { window.Nav.toggleAppendix(n); }
function toggleBook()           { window.Nav.toggleBook(); }
function goToVerse(ch, vn)      { window.Nav.goToVerse(ch, vn); }
function scrollToVerse(ch, vn)  { window.Nav.goToVerse(ch, vn); }
function navButtonsHtml(n)      { return window.Nav.navButtonsHtml(n); }
function getAdjacentChapters(n) { return window.Library.getAdjacentChapters(n); }