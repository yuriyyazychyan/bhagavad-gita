/* ════════════════════════════════════════════
   reader.js — точка входа
   Инициализация приложения. Все модули подключены
   через <script> в reader.html до этого файла:

     BookLibrary.js     — данные книги
     Formatter.js       — форматирование текста
     Glossary.js        — тултипы глоссария
     Bookmarks.js       — закладки и цитаты
     Navigation.js      — TOC и навигация
     UI.js              — интерфейс (тема, язык, скролл)
     ChapterRenderer.js — рендеринг глав
     search.js          — поиск
     carousel.js        — карусель иллюстраций
   ════════════════════════════════════════════ */

/* ── Глобальное состояние ──────────────────────────────────────────────────
   ВАЖНО: НЕ объявлять через let/const/var!
   Top-level `let` в обычном <script> НЕ создаёт свойство window, поэтому
   window.curCh / window.lang в UI.js, Navigation.js и ChapterRenderer.js
   были бы undefined. Присваивание без объявления создаёт window.X, и
   «голые» curCh / lang в старом коде видят то же самое значение. */
window.lang = 'en';
window.curCh = null;
window.menuCh = null;

// Backward-compat globals — модули используют Library напрямую,
// но старый код (search.js и т.п.) может обращаться к этим переменным
let CHAPTERS = [];
let VERSES = {};
let CONTENT = {};
let GLOSSARY = {};
let BOOK_META = {};
let ALL_BOOKS = [];

// Псевдонимы для обратной совместимости
const LS = (key) => Library.LS(key);
const BOOK_PATH = Library.bookPath;
const bookId = Library.bookId;

/* ── Определение стартового раздела ──────────────────────────────────────── */
function parseChapterParam(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  return isNaN(raw) ? String(raw).toLowerCase() : parseInt(raw);
}

function resolveStartChapter() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = parseChapterParam(params.get('ch'));
  const fromLs  = parseChapterParam(localStorage.getItem(Library.LS('chapter')));

  // Приоритет: URL → последний открытый → первая глава книги.
  // Раздел, которого нет в chapters.json (например, остался от другой версии
  // данных), отбрасываем — иначе будет «Chapter data unavailable».
  for (const candidate of [fromUrl, fromLs]) {
    if (candidate !== null && Library.hasChapter(candidate)) return candidate;
  }
  return Library.firstChapterN;
}

/* ── Инициализация приложения ────────────────────────────────────────────── */
async function loadData() {
  try {
    await Library.load();

    // Синхронизируем глобальные переменные для обратной совместимости
    CHAPTERS   = Library.chapters;
    VERSES     = Library.verses;
    CONTENT    = Library.content;
    GLOSSARY   = Library.glossary;
    BOOK_META  = Library.meta;
    ALL_BOOKS  = Library.allBooks;

    initApp();
  } catch (err) {
    console.error('Ошибка загрузки данных:', err);
    const page = document.getElementById('page');
    if (page) {
      page.innerHTML =
        `<div style="padding:24px;">Не удалось загрузить книгу «${Library.bookId}»: ${err.message}</div>`;
    }
  }
}

function initApp() {
  // Стартовый раздел
  window.curCh = resolveStartChapter();
  window.menuCh = typeof window.curCh === 'number' ? window.curCh : null;

  // Кнопка "Домой" в топбаре
  const topbar = document.querySelector('.topbar');
  if (topbar && !document.getElementById('homeBtn')) {
    const homeBtn = document.createElement('a');
    homeBtn.id = 'homeBtn';
    homeBtn.href = './index.html';
    homeBtn.title = 'Library';
    homeBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:32px;height:32px;text-decoration:none;font-size:18px;color:var(--ink2);margin-right:4px;';
    homeBtn.innerHTML = '⌂';
    topbar.insertBefore(homeBtn, topbar.firstChild);
  }

  // Если стартовый раздел — подпункт Appendixes, разворачиваем его
  Library.chapters.forEach(c => {
    if (c.children?.some(child => child.n === window.curCh)) {
      Nav.appendixOpen = c.n;
    }
  });

  // Синхронизируем menuCh в Navigation
  Nav.menuCh = window.menuCh;

  // Deep link: ?ch=5&verse=9 или ?bm=4.7
  const urlParams = new URLSearchParams(window.location.search);
  const urlCh     = urlParams.get('ch');
  const urlVerse  = urlParams.get('verse');
  const urlBm     = urlParams.get('bm');
  const urlAnchor = urlParams.get('anchor');
  const urlQuote  = urlParams.get('quote');

  // Показать кнопку текстовой закладки для книг без стихов
  const textBmBtn = document.getElementById('textBmBtn');
  if (textBmBtn) {
    textBmBtn.style.display = Library.isChapterBook ? 'flex' : 'none';
  }

  window._restoreScroll = true;

  // Язык (setLang сам вызывает renderChapter(window.curCh))
  setLang('en'); // Удалить при включении мультиязычности
  // setLang(localStorage.getItem(Library.LS('lang')) || 'ru');

  // Перейти к нужному месту из URL
  if (urlVerse && urlCh && !isNaN(urlCh)) {
    setTimeout(() => {
      goToVerse(parseInt(urlCh), parseInt(urlVerse));
    }, 500);
  } else if (urlBm) {
    setTimeout(() => {
      BM.goTo(urlBm, urlAnchor || '');
      if (urlQuote && typeof highlightSearchTerm === 'function') {
        setTimeout(() => {
          highlightSearchTerm(urlQuote);
          if (typeof showClearHighlightBtn === 'function') showClearHighlightBtn();
        }, 700);
      }
    }, 500);
  }

  Nav.renderToc();
  BM.render();
}

/* ── Запуск ──────────────────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  loadData();
});
