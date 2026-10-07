/* ════════════════════════════════════════════
   BookLibrary.js
   Загрузка данных книги: meta, catalog, chapters,
   verses, content, glossary.
   ════════════════════════════════════════════ */

class BookLibrary {
  constructor() {
    // Определяем книгу из URL параметра
    this.bookId = new URLSearchParams(window.location.search).get('book') || 'bhagavad-gita';
    this.bookPath = `./books/${this.bookId}`;

    // Данные книги
    this.meta = {};
    this.allBooks = [];
    this.chapters = [];
    this.verses = {};
    this.content = {};
    this.glossary = {};
  }

  // ── Префикс localStorage ──────────────────────────────────────────────
  LS(key) {
    return `${this.bookId}_${key}`;
  }

  // ── Основной метод загрузки ───────────────────────────────────────────
  async load() {
    try {
      await this.#loadMeta();          // meta нужен первым: от meta.type зависит загрузка данных
      await this.#loadCatalog();
      await this.#loadChapters();
      await this.#loadBookData();
      await this.#loadGlossary();
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      throw error;
    }
  }

  // ── Приватные методы загрузки ─────────────────────────────────────────
  async #fetchJson(url) {
    try {
      const res = await fetch(url);
      return res.ok ? await res.json() : null;
    } catch (e) {
      console.warn('Не удалось загрузить', url, e);
      return null;
    }
  }

  async #loadMeta() {
    const meta = await this.#fetchJson(`${this.bookPath}/meta.json`);
    if (meta) {
      this.meta = meta;
      document.title = this.meta.title || 'Prabhupada Library';
    }
  }

  async #loadCatalog() {
    const catalog = await this.#fetchJson('./books/catalog.json');
    if (!Array.isArray(catalog)) return;
    this.allBooks = [];
    for (const entry of catalog) {
      if (entry.status !== 'published') continue;
      const m = await this.#fetchJson(`./books/${entry.id}/meta.json`);
      if (m) this.allBooks.push(m);
    }
  }

  async #loadChapters() {
    const data = await this.#fetchJson(`${this.bookPath}/data/chapters.json`);
    if (!data) throw new Error('Не удалось загрузить chapters.json');
    this.chapters = data;
  }

  /**
   * Тип книги (meta.type) однозначно определяет, что лежит в файле:
   *   verses   → объект { "1": [ {n, skr, tr, ...} ] }  → this.verses
   *   chapters → объект { "1": [ {n, text_en, ...} ] }  → this.content
   * Для verses пробуем оба имени файла: content.json (текущее) и verses.json (старое).
   */
  async #loadBookData() {
    const base = `${this.bookPath}/data`;

    if (this.type === 'chapters') {
      this.content = (await this.#fetchJson(`${base}/content.json`)) || {};
      return;
    }

    const data =
      (await this.#fetchJson(`${base}/content.json`)) ||
      (await this.#fetchJson(`${base}/verses.json`));

    if (!data) {
      console.error(`Не найден ни content.json, ни verses.json в ${base}`);
      this.verses = {};
      return;
    }
    this.verses = data;
  }

  async #loadGlossary() {
    // Глоссарий общий для всех книг
    const data = await this.#fetchJson('./data/glossary.json');
    if (data) this.glossary = data;
  }

  // ── Геттеры и утилиты ─────────────────────────────────────────────────

  get type() {
    return this.meta.type || 'verses';
  }

  get isChapterBook() {
    return this.type === 'chapters';
  }

  get shortTitle() {
    return this.meta.shortTitle || 'Bg';
  }

  get shortTitleRu() {
    return this.meta.shortTitleRu || 'Бг';
  }

  get noFormat() {
    return this.meta.noFormat || ['references', 'sanskrit'];
  }

  /**
   * Найти стих в главе — поддерживает диапазоны nLabel
   * Например: resolveVerse(1, 17) найдёт стих с nLabel "16–18"
   */
  resolveVerse(ch, verseNum) {
    const chVerses = this.verses[ch] || this.verses[String(ch)] || [];
    if (!chVerses.length) return null;

    // 1. Точное совпадение
    let v = chVerses.find(x => x.n === verseNum || x.n === String(verseNum));
    if (v) return v;

    // 2. Поиск в диапазоне nLabel ("16–18", "8-9")
    v = chVerses.find(x => {
      if (!x.nLabel) return false;
      const label = String(x.nLabel).replace(/[–—]/g, '-');
      const parts = label.split('-');
      if (parts.length !== 2) return false;
      const start = parseInt(parts[0]);
      const end = parseInt(parts[1]);
      const target = parseInt(verseNum);
      return !isNaN(start) && !isNaN(end) && target >= start && target <= end;
    });
    if (v) return v;

    // 3. Ближайший предыдущий стих
    const sorted = [...chVerses].sort((a, b) => parseInt(a.n) - parseInt(b.n));
    let nearest = null;
    for (const x of sorted) {
      if (parseInt(x.n) <= parseInt(verseNum)) nearest = x;
      else break;
    }
    return nearest;
  }

  /** Главы без спецразделов (только числовые) */
  get numericChapters() {
    return this.chapters.filter(c => typeof c.n === 'number');
  }

  /** Спецразделы (строковые n) */
  get specialChapters() {
    return this.chapters.filter(c => typeof c.n === 'string');
  }

  /**
   * Плоский список "листовых" разделов в порядке чтения.
   * Родитель с children (Appendixes) в список не входит — вместо него его дети,
   * потому что у самого родителя нет special/*.html.
   */
  flatChapters() {
    const all = [];
    for (const c of this.chapters) {
      if (c.children?.length) all.push(...c.children);
      else all.push(c);
    }
    return all;
  }

  /** Привести n к сравнимому виду: строки — lowercase без #якоря */
  static normN(n) {
    return typeof n === 'string' ? n.split('#')[0].toLowerCase() : n;
  }

  /** Найти главу/раздел по n (включая родителей и детей) */
  getChapter(n) {
    const key = BookLibrary.normN(n);
    return this.chapters.find(c => BookLibrary.normN(c.n) === key)
        || this.chapters.flatMap(c => c.children || []).find(c => BookLibrary.normN(c.n) === key);
  }

  /** Первая глава, с которой можно начать чтение */
  get firstChapterN() {
    return (this.numericChapters[0] ?? this.flatChapters()[0])?.n ?? 1;
  }

  /** Существует ли такой раздел в chapters.json */
  hasChapter(n) {
    return !!this.getChapter(n);
  }

  /**
   * Соседние разделы для кнопок prev/next.
   * Всегда возвращает ОБЪЕКТЫ глав (или null), никогда числа.
   */
  getAdjacentChapters(currentN) {
    const key = BookLibrary.normN(currentN);
    const all = this.flatChapters();
    const idx = all.findIndex(c => BookLibrary.normN(c.n) === key);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? all[idx - 1] : null,
      next: idx < all.length - 1 ? all[idx + 1] : null
    };
  }
}

// ── Экспорт глобального экземпляра ───────────────────────────────────────────
// Остальные модули используют window.Library
window.Library = new BookLibrary();
