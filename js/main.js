// Theme
const savedTheme = localStorage.getItem('lib_theme') || 'light';
document.body.dataset.theme = savedTheme;
const themeBtn = document.getElementById('themeBtn');
themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

function toggleTheme() {
    const isDark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = isDark ? 'light' : 'dark';
    localStorage.setItem('lib_theme', document.body.dataset.theme);
    themeBtn.textContent = isDark ? '🌙' : '☀️';
}

// Books list — add new books here
const BOOKS = [
    'bhagavad-gita',
    'elevation-to-krishna-consciousness',
// 'nectar-of-devotion',
// 'srimad-bhagavatam',
];

async function loadBooks() {
    const grid = document.getElementById('bookGrid');
    const loading = document.getElementById('loading');

    const books = [];
    for (const bookId of BOOKS) {
        try {
            const res = await fetch(`./books/${bookId}/meta.json`);
            if (res.ok) {
                const meta = await res.json();
                books.push(meta);
            }
        } catch(e) {
            console.warn(`Could not load ${bookId}/meta.json`);
        }
    }

    loading.style.display = 'none';
    grid.style.display = 'grid';

    books.forEach(book => {
        const card = document.createElement('a');
        card.className = 'book-card';
        card.href = book.status === 'published'
        ? `reader.html?book=${book.id}`
        : '#';

        const coverHtml = book.cover
        ? `<div class="book-cover"><img src="${book.cover}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=\\'book-cover-placeholder\\'>${book.title}</div>'"/></div>`
        : `<div class="book-cover-placeholder">${book.title}</div>`;

        const statusHtml = book.status === 'draft'
        ? `<span class="book-status-draft">In progress</span>`
        : '';

        card.innerHTML = `
        ${coverHtml}
        <div class="book-info">
        <div class="book-title">${book.title}</div>
        <div class="book-author">${book.author}</div>
        ${statusHtml}
        <div class="book-year">${book.year}</div>
        </div>
        `;

        grid.appendChild(card);
    });
}

loadBooks();
