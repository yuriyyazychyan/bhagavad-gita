/* ════════════════════════════════════════════
UI.js
Интерфейс: язык, тема, прогресс-бар,
сайдбар, подсказки, прочие утилиты.
════════════════════════════════════════════ */

class UI {
    constructor(library) {
        this.library = library;

        this.#initSidebar();
        this.#initTheme();
        this.#initProgressBar();
        this.#initScrollSave();
    }

    // ── Язык ─────────────────────────────────────────────────────────────
    setLang(l) {
        window.lang = l;
        document.getElementById('lRu')?.classList.toggle('on', l === 'ru');
        document.getElementById('lEn')?.classList.toggle('on', l === 'en');

        // Обновить sbHead с названием текущей книги
        window.Nav?.updateSbHead();

        const bmHead = document.getElementById('bmHead');
        if (bmHead) bmHead.textContent = l === 'ru' ? 'Любимые тексты' : 'Favourites texts';

        window.Nav?.renderToc();
        if (typeof renderChapter === 'function') renderChapter(window.curCh, true);

        localStorage.setItem(this.library.LS('lang'), l);
    }

    // ── Тема ─────────────────────────────────────────────────────────────
    setThemeIcon(dark) {
        const btn = document.getElementById('themeBtn');
        if (!btn) return;
        if (dark) {
            btn.innerHTML = '<img src="img/sun.png" style="width:20px;height:20px;vertical-align:middle;">';
            btn.style.filter = 'none';
        } else {
            btn.innerHTML = '<img src="img/full-moon.png" style="width:20px;height:20px;vertical-align:middle;">';
            btn.style.filter = 'drop-shadow(0 0 5px rgba(140,180,255,0.9))';
        }
    }

    toggleTheme() {
        const dark = document.body.dataset.theme === 'dark';
        document.body.dataset.theme = dark ? 'light' : 'dark';
        this.setThemeIcon(dark);
        localStorage.setItem(this.library.LS('theme'), dark ? 'light' : 'dark');
        this.updateIllustration();
    }

    // ── Иллюстрация (зависит от темы) ────────────────────────────────────
    updateIllustration() {
        // Можно расширить: показывать разные картинки для тёмной/светлой темы
    }

    // ── Закрыть все панели ────────────────────────────────────────────────
    closeAll() {
        document.getElementById('overlay')?.classList.remove('on');
        document.getElementById('bmpanel')?.classList.remove('on');
        if (window.innerWidth < 768) {
            localStorage.setItem(this.library.LS('sidebar'), 'hidden');
            document.getElementById('sidebar')?.classList.add('hidden');
            document.getElementById('main')?.classList.add('full');
        }
    }

    // ── Кнопка меню (гамбургер) ───────────────────────────────────────────
    toggleMenu() {
        const sidebar = document.getElementById('sidebar');
        const main    = document.getElementById('main');
        const overlay = document.getElementById('overlay');
        if (!sidebar) return;

        const isHidden = sidebar.classList.contains('hidden');
        if (isHidden) {
            sidebar.classList.remove('hidden');
            main?.classList.remove('full');
            overlay?.classList.add('on');
            localStorage.setItem(this.library.LS('sidebar'), 'open');
        } else {
            sidebar.classList.add('hidden');
            main?.classList.add('full');
            overlay?.classList.remove('on');
            localStorage.setItem(this.library.LS('sidebar'), 'hidden');
        }
    }

    // ── Подсказка (показывается один раз) ────────────────────────────────
    showHintIfNeeded() {
        const key = this.library.LS('hint_shown_') + window.lang;
        if (localStorage.getItem(key)) return;
        setTimeout(() => {
            alert(window.lang === 'ru'
                ? 'Подсказка (показывается один раз): наведи на номер текста, чтобы добавить его в любимые или прослушать лекцию по этому тексту'
                : 'Tip (shown once): hover over a text number to add it to favorites or listen to a lecture on this text');
            localStorage.setItem(key, '1');
            document.querySelector('.pulse-dot')?.remove();
        }, 2000);
    }

    // ── Числа словами (для заголовков глав) ──────────────────────────────
    numWord(n) {
        const ru = ['','Первая','Вторая','Третья','Четвёртая','Пятая','Шестая',
                    'Седьмая','Восьмая','Девятая','Десятая','Одиннадцатая',
                    'Двенадцатая','Тринадцатая','Четырнадцатая','Пятнадцатая',
                    'Шестнадцатая','Семнадцатая','Восемнадцатая'];
        const en = ['','One','Two','Three','Four','Five','Six','Seven','Eight',
                    'Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen',
                    'Sixteen','Seventeen','Eighteen'];
        return window.lang === 'ru' ? (ru[n] || '') : (en[n] || '');
    }

    // ── Экранировать кавычки ──────────────────────────────────────────────
    esc(s) {
        return String(s).replace(/'/g, "\\'");
    }

    // ── Приватные методы инициализации ───────────────────────────────────
    #initSidebar() {
        const lib     = this.library;
        const sbState = localStorage.getItem(lib.LS('sidebar'));
        const sidebar = document.getElementById('sidebar');
        const main    = document.getElementById('main');

        if (sbState === 'hidden') {
            sidebar?.classList.add('hidden');
            main?.classList.add('full');
        } else if (sbState !== 'open' && window.innerWidth < 768) {
            sidebar?.classList.add('hidden');
            main?.classList.add('full');
        } else if (sbState === 'open') {
            sidebar?.classList.remove('hidden');
            main?.classList.remove('full');
        }

        // Кнопка гамбургер
        document.getElementById('menuBtn')?.addEventListener('click', () => this.toggleMenu());
    }

    #initTheme() {
        const savedTheme = localStorage.getItem(this.library.LS('theme')) || 'light';
        document.body.dataset.theme = savedTheme;
        this.setThemeIcon(savedTheme === 'dark');

        document.getElementById('themeBtn')?.addEventListener('click', () => this.toggleTheme());
    }

    #initProgressBar() {
        window.addEventListener('scroll', () => {
            const pg = document.getElementById('page');
            if (!pg) return;
            const pct = Math.min(100,
                (-pg.getBoundingClientRect().top / (pg.offsetHeight - window.innerHeight)) * 100
            );
            const fill = document.getElementById('progFill');
            if (fill) fill.style.width = Math.max(0, pct) + '%';

            document.getElementById('scrollTopBtn')?.classList.toggle('visible', window.scrollY > 300);
            document.getElementById('scrollBottomBtn')?.classList.toggle('visible',
                window.scrollY < document.body.scrollHeight - window.innerHeight - 100
            );
        });
    }

    #initScrollSave() {
        window.addEventListener('scroll', () => {
            localStorage.setItem(this.library.LS('scroll'), window.scrollY);
        });
    }
}

// ── Глобальный экземпляр ─────────────────────────────────────────────────────
window.UI = new UI(window.Library);

// Глобальные алиасы для обратной совместимости
function setLang(l)           { window.UI.setLang(l); }
function setThemeIcon(dark)   { window.UI.setThemeIcon(dark); }
function toggleTheme()        { window.UI.toggleTheme(); }
function updateIllustration() { window.UI.updateIllustration(); }
function closeAll()           { window.UI.closeAll(); }
function showHintIfNeeded()   { window.UI.showHintIfNeeded(); }
function numWord(n)           { return window.UI.numWord(n); }
function esc(s)               { return window.UI.esc(s); }
