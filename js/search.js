/* ════════════════════════════════════════════
SEARCH
════════════════════════════════════════════ */
let searchVisible = false;

function toggleSearch() {
    searchVisible = !searchVisible;
    const panel = document.getElementById('searchPanel');
    if (searchVisible) {
        panel.style.display = 'flex';
        document.getElementById('searchInput').focus();
        showSearchHistory();
    } else {
        panel.style.display = 'none';
        document.getElementById('searchResults').innerHTML = '';
        document.getElementById('searchInput').value = '';
    }
}

// Функция удаления диакритики для поиска
function stripDiacritics(text) {
    return text
        .replace(/[āÀ]/g, 'a').replace(/[ī]/g, 'i').replace(/[ū]/g, 'u')
        .replace(/[ṛṝ]/g, 'r').replace(/[ḷ]/g, 'l')
        .replace(/[ṭ]/g, 't').replace(/[ḍ]/g, 'd')
        .replace(/[ṇ]/g, 'n').replace(/[ṅ]/g, 'n').replace(/[ñ]/g, 'n')
        .replace(/[ś]/g, 's').replace(/[ṣ]/g, 's')
        .replace(/[ḥ]/g, 'h').replace(/[ṁṃ]/g, 'm')
        .replace(/[Ā]/g, 'A').replace(/[Ī]/g, 'I').replace(/[Ū]/g, 'U')
        .replace(/[Ṛ]/g, 'R').replace(/[Ṭ]/g, 'T').replace(/[Ḍ]/g, 'D')
        .replace(/[Ṇ]/g, 'N').replace(/[Ś]/g, 'S').replace(/[Ṣ]/g, 'S')
        .replace(/[Ḥ]/g, 'H').replace(/[Ṁ]/g, 'M');
}

function doSearch() {
    const raw = document.getElementById('searchInput').value.trim();
    if (raw.length < 2) {
        showSearchHistory();
        return;
    }

    // Нормализуем запрос — убираем диакритику для сравнения
    const query = stripDiacritics(raw).toLowerCase();
    const wordBoundaryRe = new RegExp(
        '(?<![a-zA-Z])' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
    );

    const results = [];
    const isRu = lang === 'ru';

    CHAPTERS.forEach(chapter => {
        const chNum = chapter.n;
        if (typeof chNum !== 'number') return;
        const verses = VERSES[chNum];
        if (!verses) return;

        verses.forEach(verse => {
            const pur = (isRu ? verse.pur_ru : verse.pur_en) || '';
            const tr  = (isRu ? verse.tr_ru  : verse.tr_en)  || '';
            const skr = verse.tr || '';

            // Ищем в нормализованном тексте
            const searchText = stripDiacritics(pur + ' ' + tr + ' ' + skr).toLowerCase();
            if (!wordBoundaryRe.test(searchText)) return;

            // Сниппет берём из оригинального текста
            const origText = (pur + ' ' + tr + ' ' + skr).toLowerCase();
            const normIdx = searchText.search(wordBoundaryRe);

            const start = Math.max(0, normIdx - 60);
            const end = Math.min(origText.length, normIdx + raw.length + 60);
            let snippet = origText.slice(start, end).trim();
            if (start > 0) snippet = '...' + snippet;
            if (end < origText.length) snippet += '...';

            // Подсвечиваем в сниппете — ищем по нормализованному
            const snippetNorm = stripDiacritics(snippet);
            const snippetRe = new RegExp(
                '(?<![a-zA-Z])' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'gi'
            );
            let highlighted = '';
            let lastIdx = 0;
            let m;
            snippetRe.lastIndex = 0;
            while ((m = snippetRe.exec(snippetNorm)) !== null) {
                highlighted += snippet.slice(lastIdx, m.index);
                highlighted += `<mark>${snippet.slice(m.index, m.index + m[0].length)}</mark>`;
                lastIdx = m.index + m[0].length;
            }
            highlighted += snippet.slice(lastIdx);

            results.push({
                             ch: chNum,
                             verse: verse.n,
                             ref: `${chNum}.${verse.n}`,
                             snippet: highlighted,
                         });
        });
    });

    if (results.length === 0) {
        document.getElementById('searchResults').innerHTML =
            '<div class="search-hint">No results found</div>';
        return;
    }

    const html = results.slice(0, 50).map(r => `
        <div class="search-result" onclick="goToSearchResult(${r.ch}, ${r.verse}, '${raw.replace(/'/g,"\\'")}')">
            <div class="search-ref">${r.ref}</div>
            <div class="search-snippet">${r.snippet}</div>
        </div>
    `).join('');

    document.getElementById('searchResults').innerHTML =
        `<div class="search-count">${results.length} result${results.length !== 1 ? 's' : ''}</div>` + html;
}

function goToSearchResult(ch, verse, rawQuery) {
    saveSearchQuery(rawQuery);  // Save history only when user navigates
    toggleSearch();
    // Use renderChapter instead of goToVerse to avoid error handler conflicts
    const chNum = parseInt(ch);
    renderChapter(chNum, true);
    setTimeout(() => {
        const el = document.getElementById('v' + ch + '_' + verse);
        if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
        highlightSearchTerm(rawQuery);
        showClearHighlightBtn();
    }, 400);
}

let _highlightQuery = '';

function highlightSearchTerm(query) {
    if (!query || query.length < 2) return;
    const page = document.getElementById('page');
    if (!page) return;
    clearHighlights();

    const normalizedQuery = stripDiacritics(query).toLowerCase();
    const re = new RegExp(
        '(?<![a-zA-Z])' + normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'gi'
    );
    walkTextNodes(page, re);

    const first = page.querySelector('mark.search-highlight');
    if (first) first.scrollIntoView({behavior: 'smooth', block: 'center'});
}

function clearHighlights() {
    document.querySelectorAll('mark.search-highlight').forEach(mark => {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
    });
    const btn = document.getElementById('clearHighlightBtn');
    if (btn) btn.remove();
}

function walkTextNodes(node, re) {
    if (node.nodeType === 1 && node.tagName === 'P') {
        const text = node.textContent;
        const normText = stripDiacritics(text);
        re.lastIndex = 0;
        if (!re.test(normText)) return;

        const matches = [];
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(normText)) !== null) {
            matches.push({start: m.index, end: m.index + m[0].length});
        }
        if (matches.length === 0) return;
        highlightInNode(node, matches, {offset: 0});
        return;
    }

    if (node.nodeType === 3) {
        const text = node.textContent;
        const normText = stripDiacritics(text);
        re.lastIndex = 0;
        if (!re.test(normText)) return;
        re.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;
        let match;
        re.lastIndex = 0;
        while ((match = re.exec(normText)) !== null) {
            if (match.index > lastIdx)
                frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = text.slice(match.index, match.index + match[0].length);
            frag.appendChild(mark);
            lastIdx = match.index + match[0].length;
        }
        if (lastIdx < text.length)
            frag.appendChild(document.createTextNode(text.slice(lastIdx)));
        node.parentNode.replaceChild(frag, node);
        return;
    }

    if (node.nodeType === 1 && !['SCRIPT','STYLE'].includes(node.tagName)) {
        Array.from(node.childNodes).forEach(child => walkTextNodes(child, re));
    }
}

function highlightInNode(node, matches, state) {
    if (node.nodeType === 3) {
        const text = node.textContent;
        const nodeStart = state.offset;
        const nodeEnd = state.offset + text.length;
        state.offset += text.length;

        // Найди совпадения которые пересекают этот узел
        const relevant = matches.filter(m => m.start < nodeEnd && m.end > nodeStart);
        if (relevant.length === 0) return;

        const frag = document.createDocumentFragment();
        let lastIdx = 0;

        relevant.forEach(m => {
            const localStart = Math.max(0, m.start - nodeStart);
            const localEnd = Math.min(text.length, m.end - nodeStart);
            if (localStart > lastIdx)
                frag.appendChild(document.createTextNode(text.slice(lastIdx, localStart)));
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = text.slice(localStart, localEnd);
            frag.appendChild(mark);
            lastIdx = localEnd;
        });

        if (lastIdx < text.length)
            frag.appendChild(document.createTextNode(text.slice(lastIdx)));

        node.parentNode.replaceChild(frag, node);
    } else if (node.nodeType === 1 && !['SCRIPT','STYLE'].includes(node.tagName)) {
        Array.from(node.childNodes).forEach(child => highlightInNode(child, matches, state));
    }
}
/* ════════════════════════════════════════════
SEARCH HISTORY + HIGHLIGHT CLEAR BUTTON
════════════════════════════════════════════ */

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY = 20;

function getSearchHistory() {
    try {
        return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
    } catch { return []; }
}

function saveSearchQuery(query) {
    if (!query || query.length < 2) return;
    let history = getSearchHistory();
    // Remove duplicate if exists
    history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    // Add to beginning
    history.unshift(query);
    // Keep only MAX_HISTORY items
    history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

function showSearchHistory() {
    const query = document.getElementById('searchInput').value.trim();
    if (query.length >= 2) return; // Don't show history if typing

    const history = getSearchHistory();
    const resultsEl = document.getElementById('searchResults');

    if (history.length === 0) {
        resultsEl.innerHTML = '<div class="search-hint">Start typing to search...</div>';
        return;
    }

    const html = `
        <div class="search-history-header">
            <span>Recent searches</span>
            <button onclick="clearSearchHistory()" class="search-clear-all">Clear all</button>
        </div>
        ${history.map(q => `
            <div class="search-history-item">
                <span class="search-history-icon">🕐</span>
                <span class="search-history-text" onclick="applyHistoryQuery('${q.replace(/'/g, "\\'")}')">${q}</span>
                <button class="search-history-remove" onclick="removeHistoryQuery('${q.replace(/'/g, "\\'")}')" title="Remove">✕</button>
            </div>
        `).join('')}
    `;
    resultsEl.innerHTML = html;
}

function applyHistoryQuery(query) {
    document.getElementById('searchInput').value = query;
    doSearch();
}

function removeHistoryQuery(query) {
    let history = getSearchHistory();
    history = history.filter(q => q !== query);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    showSearchHistory();
}

function clearSearchHistory() {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    showSearchHistory();
}

function showClearHighlightBtn() {
    if (!document.querySelector('mark.search-highlight')) return;
    const existing = document.getElementById('clearHighlightBtn');
    if (existing) existing.remove();
    const btn = document.createElement('button');
    btn.id = 'clearHighlightBtn';
    btn.title = 'Clear highlights';
    btn.innerHTML = '✕ highlights';
    btn.style.cssText = [
        'position:fixed','bottom:132px','right:24px',
        'background:var(--gold,#f0d080)','color:var(--ink)',
        'border:none','border-radius:16px','padding:6px 12px',
        'font-size:13px','font-family:\'IM Fell English\',Georgia,serif',
        'cursor:pointer','z-index:90','box-shadow:0 2px 8px rgba(0,0,0,0.15)',
    ].join(';');
    btn.onclick = () => clearHighlights();
    document.body.appendChild(btn);
}