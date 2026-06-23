/* ════════════════════════════════════════════
DATA — добавляй главы сюда по мере наполнения
════════════════════════════════════════════ */
let CHAPTERS = {};
let VERSES = {};

// Объединяем загрузку обоих файлов в одну функцию
async function loadData() {
    try {
        // Загружаем CHAPTERS
        const chaptersResponse = await fetch('./data/chapters.json');
        if (!chaptersResponse.ok) {
            throw new Error('Не удалось загрузить CHAPTERS');
        }
        CHAPTERS = await chaptersResponse.json();

        // Загружаем VERSES
        const versesResponse = await fetch('./data/verses.json');
        if (!versesResponse.ok) {
            throw new Error('Не удалось загрузить VERSES');
        }
        VERSES = await versesResponse.json();

        // Инициализируем приложение только после успешной загрузки обоих файлов
        initApp();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Инициализация приложения
function initApp() {
    setLang(localStorage.getItem('bg_lang') || 'ru');
    renderChapter(parseInt(localStorage.getItem('bg_chapter')) || 1);
    renderToc();
    updateBm();
}

// Загружаем данные при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
    loadData();
});

/* ════════════════════════════════════════════
STATE
════════════════════════════════════════════ */
let lang = 'ru';
let curCh = 2;
let bookmarks = JSON.parse(localStorage.getItem('bg_bm') || '[]');

/* ════════════════════════════════════════════
LANG
════════════════════════════════════════════ */
function setLang(l) {
    lang = l;
    document.getElementById('lRu').classList.toggle('on', l === 'ru');
    document.getElementById('lEn').classList.toggle('on', l === 'en');
    document.getElementById('sbHead').innerHTML = '<span onclick="toggleBook()" style="cursor:pointer;"><img src="img/icon_book.png" style="width:20px;height:20px;margin-bottom:2px;vertical-align:middle;margin-right:8px;">Bhagavad-gītā As It Is <span style="font-family:\'CA Moskow\',serif;font-size:14px;">1972</span> <span id="bookArrow" style="font-size:11px;display:inline-block;transition:transform 0.25s ease;margin-left:4px;vertical-align:middle;">↑</span></span>';
    document.getElementById('bmHead').textContent = l === 'ru' ? 'Любимые тексты' : 'Favourites texts';
    renderToc();
    renderChapter(curCh, true);
}

// Остальные функции остаются без изменений

/* ════════════════════════════════════════════
THEME
════════════════════════════════════════════ */
function setThemeIcon(dark) {
    const btn = document.getElementById('themeBtn');
    if (dark) {
        btn.innerHTML = '<img src="img/sun.png" style="width:20px;height:20px;vertical-align:middle;">';
        btn.style.filter = 'none';
    } else {
        btn.innerHTML = '<img src="img/full-moon.png" style="width:20px;height:20px;vertical-align:middle;">';
        btn.style.filter = 'drop-shadow(0 0 5px rgba(140,180,255,0.9))';
    }
}

function toggleTheme() {
    const dark = document.body.dataset.theme === 'dark';
    document.body.dataset.theme = dark ? 'light' : 'dark';
    setThemeIcon(dark);
    localStorage.setItem('bg_theme', dark ? 'light' : 'dark');
    updateIllustration();
}

function updateIllustration() {
}

/* ════════════════════════════════════════════
TOC
════════════════════════════════════════════ */
let bookOpen = true;

function toggleBook() {
    bookOpen = !bookOpen;
    document.getElementById('tocList').style.display = bookOpen ? 'block' : 'none';
    const arrow = document.getElementById('bookArrow');
    if (arrow) arrow.style.transform = bookOpen ? '' : 'rotate(180deg)';
}

function renderToc() {
    if (!CHAPTERS || !VERSES) {
        return; // Защита от отсутствия данных
    }

    let tocHtml = '';

    CHAPTERS.forEach(chapter => {
        const isSpecial = typeof chapter.n === 'string'; // Проверяем, специальный ли это раздел
        const isActive = chapter.n === curCh;
        const hasVerses = VERSES[chapter.n] && VERSES[chapter.n].length > 0;

        if (isSpecial) {
            // Для специальных разделов без номеров и раскрытия
            tocHtml += `
            <div class="ch-row" onclick="renderChapter('${chapter.n}')">
                <span class="ch-label">${lang === 'ru' ? chapter.ru : chapter.en}</span>
            </div>
            `;
        } else {
            // Для обычных глав с возможностью раскрытия
            tocHtml += `
            <div class="ch-row ${isActive ? 'on' : ''}" onclick="toggleChapter(${chapter.n})">
                <span class="ch-n"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.n}</span>.</span>
                <span class="ch-label">${lang === 'ru' ? chapter.ru : chapter.en}</span>
                <span class="ch-vcount"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.v}</span></span>
            </div>
            `;

            // Добавляем список стихов только если есть стихи и глава активна
            if (hasVerses && isActive) {
                const verses = VERSES[chapter.n];
                tocHtml += `
                <div class="toc-verses">
                    ${verses.map(v => {
                    const key = `${chapter.n}.${v.n}`;
                    const isBm = bookmarks.some(b => b.key === key);
                    return `
                            <div class="toc-verse" onclick="goToVerse(${chapter.n}, ${v.n})">
                                <span class="toc-bm">${isBm ? '<img src="img/love.png" style="width:12px;height:12px;vertical-align:middle;">' : '&nbsp;&nbsp;&nbsp;'}</span>
                                ${lang === 'ru' ? (v.nLabel ? 'Тексты' : 'Текст') : (v.nLabel ? 'Texts' : 'Text')} ${v.nLabel || v.n}
                            </div>
                        `;
                }).join('')}
                </div>
                `;
            }
        }
    });

    document.getElementById('tocList').innerHTML = tocHtml;
}

// function renderToc() {
//     if (!VERSES || !CHAPTERS) {
//         window.alert("renderToc !CHAPTERS !VERSES");
//         return; // Защита от отсутствия данных
//     }
//
//     document.getElementById('tocList').innerHTML = CHAPTERS.map(c => {
//         const isActive = c.n === curCh;
//         const verses = VERSES[c.n] || [];
//         const verseList = isActive && verses.length ? `
//   <div class="toc-verses">
//     ${verses.map(v => {
//             const key = `${c.n}.${v.n}`;
//             const isBm = bookmarks.some(b => b.key === key);
//             return `
//         <div class="toc-verse" onclick="goToVerse(${c.n}, ${v.n})">
//           <span class="toc-bm">${isBm ? '<img src="img/love.png" style="width:12px;height:12px;vertical-align:middle;">' : '&nbsp;&nbsp;&nbsp;'}</span>
//           ${lang === 'ru' ? (v.nLabel ? 'Тексты' : 'Текст') : (v.nLabel ? 'Texts' : 'Text')} ${v.nLabel || v.n}
//         </div>
//       `;
//         }).join('')}
//   </div>
// ` : '';
//         return `
//       <div class="ch-row ${isActive ? 'on' : ''}" onclick="toggleChapter(${c.n})">
//         <span class="ch-n"><span style="font-family:'CA Moskow',serif;font-size:14px;">${c.n}</span>.</span>
//         <span class="ch-label">${lang === 'ru' ? c.ru : c.en}</span>
//         <span class="ch-vcount"><span style="font-family:'CA Moskow',serif;font-size:14px;">${c.v}</span></span>
//       </div>
//       ${verseList}
//     `;
//     }).join('');
// }

function toggleChapter(n) {
    // Проверяем, является ли раздел специальным
    const isSpecial = typeof CHAPTERS.find(c => c.n === n)?.n === 'string';

    if (isSpecial) {
        // Для специальных разделов просто переходим к тексту
        renderChapter(n);
        return;
    }

    if (n === curCh) {
        const existing = document.querySelector('.toc-verses');
        if (existing) {
            existing.remove();
            localStorage.setItem('bg_toc_open', '');
        } else {
            renderToc();
            localStorage.setItem('bg_toc_open', n);
        }
    } else {
        curCh = n;
        renderToc();
        localStorage.setItem('bg_toc_open', n);
    }
}


// function toggleChapter(n) {
//     if (n === curCh) {
//         const existing = document.querySelector('.toc-verses');
//         if (existing) {
//             existing.remove();
//             localStorage.setItem('bg_toc_open', '');
//         } else {
//             renderToc();
//             localStorage.setItem('bg_toc_open', n);
//         }
//     } else {
//         curCh = n;
//         renderToc();
//         localStorage.setItem('bg_toc_open', n);
//     }
// }

function goToVerse(ch, vn) {
    const needRender = document.getElementById(`v${ch}_${vn}`) === null;
    if (needRender) {
        renderChapter(ch, true);
        setTimeout(() => {
            if (window.innerWidth < 768) closeAll();
            setTimeout(() => vn === (VERSES[ch]?.[0]?.n) ? window.scrollTo({
                top: 0,
                behavior: 'smooth'
            }) : scrollToVerse(ch, vn), 350);
        }, 100);
    } else {
        if (window.innerWidth < 768) closeAll();
        setTimeout(() => vn === (VERSES[ch]?.[0]?.n) ? window.scrollTo({
            top: 0,
            behavior: 'smooth'
        }) : scrollToVerse(ch, vn), 350);
    }
}

function scrollToVerse(ch, vn) {
    const el = document.getElementById(`v${ch}_${vn}`);
    if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({top, behavior: 'smooth'});
    }
}

/* ════════════════════════════════════════════
CHAPTER
════════════════════════════════════════════ */
function renderChapter(n, skipScroll = false) {
    // Убираем принудительное ограничение высоты
    document.getElementById('page').style.maxHeight = '';
    document.getElementById('page').style.overflow = 'auto';

    if (typeof n === 'string') { // Если это специальный раздел
        loadSpecialContent(n);
        return;
    }
    if (!VERSES[n] || !VERSES[n].length || !CHAPTERS.find(c => c.n === n)) {
        document.getElementById('page').innerHTML = '<div style="padding:24px;">Данные главы недоступны</div>';
        return;
    }
    curCh = n;
    const ch = CHAPTERS.find(c => c.n === n);
    const verses = VERSES[n] || [];
    const isRu = lang === 'ru';

    let html = `
  <div class="ch-opening">
      <div class="ch-word">${isRu ? 'Глава' : 'Chapter'} ${numWord(n)}</div>
      <img src='img/krishna_arjuna.png' class='ch-illustration' style='width:240px;height:240px;display:block;margin:0px auto 24px;'>
      <div class="ch-eng-title">${isRu ? ch.ru : ch.en}</div>
  </div>
  `;

    if (!verses.length) {
        html += `<div class="empty">${isRu ? 'Тексты этой главы будут добавлены...' : 'Texts for this chapter coming soon...'}</div>`;
    } else {
        verses.forEach((v, i) => {
            html += renderVerse(v, n);
        });
    }
    html += `
<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid var(--rule);">
  ${n > 1 ? `<div style="cursor:pointer;font-family:'CA Moskow',serif;font-size:16px;color:var(--ink2);" onclick="renderChapter(${n - 1})">← ${lang === 'ru' ? 'ГЛАВА' : 'CHAPTER'} ${n - 1}</div>` : '<div></div>'}
  ${n < 18 ? `<div style="cursor:pointer;font-family:'CA Moskow',serif;font-size:16px;color:var(--ink2);" onclick="renderChapter(${n + 1})">${lang === 'ru' ? 'ГЛАВА' : 'CHAPTER'} ${n + 1} →</div>` : '<div></div>'}
</div>`;
    document.getElementById('page').innerHTML = html;
    document.getElementById('topTitle').innerHTML = `${isRu ? ch.ru : ch.en}`;
    renderToc();
    updateBm();
    document.getElementById('overlay').classList.remove('on');
    document.getElementById('bmpanel').classList.remove('on');
    localStorage.setItem('bg_lang', lang);
    localStorage.setItem('bg_chapter', n);
    if (!skipScroll) window.scrollTo({top: 0, behavior: 'smooth'});
    updateIllustration();
}

function iastToRu(text) {
    if (!text) return text;
    const map = [
        // Двухсимвольные сначала
        ['kh', 'кх'], ['gh', 'гх'], ['ch', 'чх'], ['jh', 'джх'],
        ['ṭh', 'т̣х'], ['ḍh', 'д̣х'], ['th', 'тх'], ['dh', 'дх'],
        ['ph', 'пх'], ['bh', 'бх'],
        ['ai', 'аи'], ['au', 'ау'],
        // Односимвольные
        ['ā', 'а̄'], ['Ā', 'А̄'],
        ['ī', 'ӣ'], ['Ī', 'Ӣ'],
        ['ū', 'ӯ'], ['Ū', 'Ӯ'],
        ['ṛ', 'р̣'], ['ṝ', 'р̣̄'],
        ['ḷ', 'л̣'],
        ['ṅ', 'н̇'],
        ['ñ', 'н̃'],
        ['ṭ', 'т̣'], ['Ṭ', 'Т̣'],
        ['ḍ', 'д̣'], ['Ḍ', 'Д̣'],
        ['ṇ', 'н̣'], ['Ṇ', 'Н̣'],
        ['ś', 'ш́'], ['Ś', 'Ш́'],
        ['ṣ', 'ш̣'], ['Ṣ', 'Ш̣'],
        ['ṃ', 'м̣'], ['Ṃ', 'М̣'],
        ['ṁ', 'м̇'], ['Ṁ', 'М̇'],
        ['ḥ', 'х̣'], ['Ḥ', 'Х̣'],
        ['a', 'а'], ['A', 'А'],
        ['i', 'и'], ['I', 'И'],
        ['u', 'у'], ['U', 'У'],
        ['e', 'е'], ['E', 'Е'],
        ['o', 'о'], ['O', 'О'],
        ['k', 'к'], ['K', 'К'],
        ['g', 'г'], ['G', 'Г'],
        ['c', 'ч'], ['C', 'Ч'],
        ['j', 'дж'], ['J', 'Дж'],
        ['t', 'т'], ['T', 'Т'],
        ['d', 'д'], ['D', 'Д'],
        ['n', 'н'], ['N', 'Н'],
        ['p', 'п'], ['P', 'П'],
        ['b', 'б'], ['B', 'Б'],
        ['m', 'м'], ['M', 'М'],
        ['y', 'й'], ['Y', 'Й'],
        ['r', 'р'], ['R', 'Р'],
        ['l', 'л'], ['L', 'Л'],
        ['v', 'в'], ['V', 'В'],
        ['s', 'с'], ['S', 'С'],
        ['h', 'х'], ['H', 'Х'],
    ];

    let result = text;
    // Сохраняем HTML теги и nbsp
    const tags = [];
    result = result.replace(/(<[^>]+>|&[a-z]+;)/g, (m) => {
        tags.push(m);
        return `\x00${tags.length - 1}\x00`;
    });

    for (const [from, to] of map) {
        result = result.split(from).join(to);
    }

    // Восстанавливаем теги
    result = result.replace(/\x00(\d+)\x00/g, (_, i) => tags[i]);

    return result;
}

function formatWbw(text) {
    if (!text || text === '—') return text;
    return text.split(';').map(part => {
        const idx = part.indexOf('—');
        if (idx === -1) return part;
        const sanskrit = part.substring(0, idx);
        const english = part.substring(idx + 1);
        return `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;">${sanskrit}</span><span style="font-family:'IM Fell English',Georgia,serif;font-style:normal;">—${english}</span>`;
    }).join('; ');
}

function formatPurport(text) {
    if (!text || text.trim() === '—' || text.trim() === '') return '';
    const endPhrase = /Thus end the Bhaktivedanta Purports[^.]+\./;
    text = text.replace(endPhrase, (match) => `\n[[END]]${match}[[/END]]`);

    const straightNames = new Set([
        'Kṛṣṇa', 'Kṛṣṇa\'s', 'Krishna', 'Arjuna', 'Sañjaya', 'Dhṛtarāṣṭra', 'Pāṇḍu', 'Madhusūdana', 'Parāśara', 'Vyāsadeva', 'Bhagavan', 'Paramatma', 'non-Āryans', 'Pṛthā', 'Sāndīpani', 'Vaiṣṇava', 'Dhṛtarāṣṭra\'s', 'Guḍākeśa', 'Hṛṣīkeśa', 'Māyāvādī', 'Rāmānuja', 'Māyāvādīs', 'Bhārata',
        'Kurukṣetra', 'Vyāsa', 'Yudhiṣṭhira', 'Bhīma', 'Draupadī', 'Dhṛtarāṣṭra\'s', 'Dhṛṣṭadyumna', 'Droṇācārya\'s', 'Vikarṇa', 'Aśvatthāmā', 'Bhūriśravā', 'Bāhlīkas', 'Kuntī', 'Kṛpācārya',
        'Droṇa', 'Droṇācārya', 'Duryodhana', 'Bhīṣma', 'Karṇa', 'Kṛṣṇa-Caitanya', 'Prabhupāda', 'Mādhavendra', 'Purī','Jñānasindhu', 'ānasindhu',
        'Śrī', 'Śrīmad', 'Brahmā', 'Viṣṇu', 'Śiva', 'Nārāyaṇa', 'Nārada', 'Padmanābha', 'Mādhava', 'Akṣobhya', 'Jayatīrtha', 'Jñānasindhu', 'Dayānidhi', 'Vidyānidhi', 'Rājendra', 'Puruṣottama', 'Brahmaṇyatīrtha', 'Vyāsatīrtha',
        'Pāṇḍavas', 'Kauravas', 'Arjuna\'s', 'Lakṣmīpati', 'Mādhavendra Purī', 'Īśvara', 'Purī', 'Nityānanda', 'Rūpa', 'Svarūpa', 'Sanātana', 'Raghunātha', 'Jīva', 'Kṛṣṇadāsa', 'Viśvanātha', 'Jagannātha', 'Gaurakiśora', 'Bhaktisiddhānta', 'Sarasvatī',
    ]);

    const diacritics = /[āīūṭḍṇśṣḥṃṁḷñĀĪŪṬḌṆŚṢḤṂṀḶÑ]/;

    function isSanskritQuote(para) {
        const trimmed = para.trim();
        if (trimmed.length < 5) return false;
        const words = trimmed.split(/\s+/);
        if (words.length < 2) return false;
        const sanskritCount = words.filter(w => diacritics.test(w)).length;
        const hasEnglishSentence = /[A-Z][a-z]/.test(trimmed) || /[,;]/.test(trimmed);
        return sanskritCount >= 1 && !hasEnglishSentence;
    }

    function formatPara(para) {
        return para.replace(/[\w\u0100-\u024F\u1E00-\u1EFF][\w\u0100-\u024F\u1E00-\u1EFF\-']*/g, (word) => {
            const clean = word.replace(/[',\.]/g, '');
            if (straightNames.has(clean)) return word;
            if (diacritics.test(word)) {
                return `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;">${word}</span>`;
            }
            return word;
        });
    }

    return text.split('\n').filter(p => p.trim()).map(para => {
        if (isSanskritQuote(para)) {
            return `<p style="text-align:center;text-indent:0;margin:16px 0;line-height:24px;font-family:'Times New Roman',Times,serif;font-style:italic;">${para.trim()}</p>`;
        }
        return `<p>${formatPara(para)}</p>`;
    }).join('').replace(/\[\[END\]\](.*?)\[\[\/END\]\]/gs, '<p style="margin-top:1em;font-family:\'Times New Roman\',Times,serif;font-style:italic;font-weight:500;">$1</p>');
}

/* ════════════════════════════════════════════
VERSE
════════════════════════════════════════════ */
function renderVerse(v, chN) {
    const isRu = lang === 'ru';
    const key = `${chN}.${v.n}`;
    const isBm = bookmarks.some(b => b.key === key);

    // build transliteration with clickable words
    let trLines = v.tr.split('\n').map(line => {
        return line.split(' ').map(tok => {
            const wd = v.words?.find(w => tok.startsWith(w.tr.replace(/[''']/g, '')));
            if (wd) return `<span class="w" onclick="showTip(event,'${esc(wd.skr)}','${esc(wd.tr)}','${esc(isRu ? wd.ru : wd.en)}')">${tok}</span>`;
            return tok;
        }).join(' ');
    }).join('<br>');

    return `
<div class="verse" id="v${chN}_${v.n}">
 <div style='text-align:center;margin:24px 0 24px;position:relative;'>
  <span
    style='font-family:"CA Moskow",serif;font-size:22px;letter-spacing:-0.02em;color:var(--ink);cursor:pointer;'
    onmouseenter="showVerseTooltip(this)"
    onmouseleave="hideVerseTooltip(this)"
    ontouchstart="toggleVerseTooltip(this)"
  >${isRu ? (v.nLabel ? 'ТЕКСТЫ' : 'ТЕКСТ') : (v.nLabel ? 'TEXTS' : 'TEXT')}&nbsp;&nbsp;${v.nLabel || v.n}${chN === curCh && v.n === (VERSES[curCh]?.[0]?.n) && !localStorage.getItem('bg_hint_shown') ? '<span class="pulse-dot"></span>' : ''}</span>
<div class="verse-tooltip" style='display:none;position:absolute;top:130%;left:50%;transform:translateX(-50%);background:var(--paper2);border:0.5px solid var(--rule);border-radius:8px;padding:10px 16px;white-space:nowrap;z-index:200;'>
    <div style='display:flex;align-items:center;gap:16px;'>
      <button class='vbtn ${isBm ? "bm" : ""}' onclick='toggleBm("${key}",event)' style='display:flex;align-items:center;gap:6px;font-size:13px;'>
        ${isBm ? '<img src="img/love.png" style="width:13px;height:13px;vertical-align:middle;">' : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>'}
        ${isRu ? 'Добавить в любимые' : 'Add to favorites'}
      </button>
      <div style='width:0.5px;height:20px;background:var(--rule);'></div>
      <a class='audio-lnk' href='${v.audio}' target='_blank' style='display:flex;align-items:center;gap:6px;font-size:13px;border:none;padding:0;margin:0;'>
        ▶ ${isRu ? 'Прослушать лекцию' : 'Listen to lecture'}
      </a>
    </div>
  </div>
</div>
  <div class="v-sanskrit"><div class="v-sanskrit-inner">${v.skr.replace(/\n/g, '<br>')}</div></div>
  <div class="v-translit"><div style="display:inline-block;text-align:left;">${isRu ? iastToRu(trLines) : trLines}</div></div>
  <div class="v-wbw">${formatWbw(isRu ? v.wbw_ru : v.wbw_en)}</div>
  <div style='font-family:"CA Moskow",serif;font-size:22px;letter-spacing:-0.02em;font-weight:500;display:block;text-align:center;margin:16px 0 16px;color:var(--ink);transform:scaleX(0.9);'>TRANSLATION</div>
  <div class="v-translation">${isRu ? v.tr_ru : v.tr_en}</div>
  ${(() => {
        const pur = isRu ? v.pur_ru : v.pur_en;
        if (!pur || pur.trim() === '—' || pur.trim() === '') return '';
        return `
  <div class="purport-tog" onclick="togPurport(this)" style='font-family:"CA Moskow",serif;font-size:22px;letter-spacing:-0.02em;font-weight:500;display:block;text-align:center;margin:16px 0 16px;color:var(--ink);transform:scaleX(0.9);cursor:pointer;user-select:none;'>
    ${isRu ? 'РАЗЪЯСНЕНИЕ' : 'PURPORT'}
  </div>
  <div class="purport-body">
    ${formatPurport(pur)}
  </div>`;
    })()}
  </div>
</div>`;
}

function showVerseTooltip(el) {
    el.nextElementSibling.style.display = 'block';
}

function hideVerseTooltip(el) {
    const tooltip = el.nextElementSibling;
    tooltip.addEventListener('mouseenter', () => clearTimeout(tooltip._hideTimer));
    tooltip.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
    tooltip._hideTimer = setTimeout(() => {
        tooltip.style.display = 'none';
    }, 600);
}

function toggleVerseTooltip(el) {
    const t = el.nextElementSibling;
    t.style.display = t.style.display === 'none' ? 'block' : 'none';
}

function togPurport(el) {
    el.classList.toggle('closed');
    el.nextElementSibling.classList.toggle('closed');
}

/* ════════════════════════════════════════════
SPECIAL
════════════════════════════════════════════ */

async function loadSpecialContent(section) {
    try {
        const response = await fetch(`./special/${section.toLowerCase()}.html`);

        if (!response.ok) {
            throw new Error(`Не удалось загрузить контент раздела ${section}`);
        }

        let content = await response.text();

        // Парсим HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');

        // Получаем содержимое
        let contentHtml = doc.body.innerHTML;

        // Применяем существующее форматирование
        contentHtml = formatPurport(contentHtml);

        document.getElementById('page').innerHTML = contentHtml;
        document.getElementById('topTitle').innerHTML =
            CHAPTERS.find(c => c.n === section)[lang === 'ru' ? 'ru' : 'en'];

        // Обновляем иллюстрации
        updateIllustration();

    } catch (error) {
        console.error('Ошибка при загрузке специального контента:', error);
        document.getElementById('page').innerHTML = '<div>Ошибка загрузки контента</div>';
    }
}

// Добавляем обработку ошибок загрузки
window.addEventListener('error', (event) => {
    if (event.error) {
        console.error('Произошла ошибка:', event.error.message);
        document.getElementById('page').innerHTML = '<div>Произошла ошибка при загрузке контента</div>';
    }
});

/* ════════════════════════════════════════════
TOOLTIP
════════════════════════════════════════════ */
function showTip(e, skr, tr, def) {
    const t = document.getElementById('tip');
    document.getElementById('tipSkr').textContent = skr;
    document.getElementById('tipTr').textContent = tr;
    document.getElementById('tipDef').textContent = def;
    t.classList.add('on');
    const x = Math.min(e.clientX + 12, window.innerWidth - 280);
    const y = Math.min(e.clientY + 12, window.innerHeight - 110);
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    setTimeout(() => document.addEventListener('click', hideTip, {once: true}), 10);
}

function hideTip() {
    document.getElementById('tip').classList.remove('on');
}

/* ════════════════════════════════════════════
BOOKMARKS
════════════════════════════════════════════ */
function toggleBm(key, e) {
    e.stopPropagation();
    const idx = bookmarks.findIndex(b => b.key === key);
    if (idx >= 0) {
        bookmarks.splice(idx, 1);
    } else {
        const [ch, vn] = key.split('.');
        const v = (VERSES[+ch] || []).find(x => x.n === +vn);
        const txt = v ? (lang === 'ru' ? v.tr_ru : v.tr_en).slice(0, 90) + '…' : '';
        bookmarks.push({key, txt});
    }
    localStorage.setItem('bg_bm', JSON.stringify(bookmarks));
    renderChapter(curCh, true);
}

function updateBm() {
    document.getElementById('bmCnt').innerHTML = `<span style="font-family:'CA Moskow',serif;font-size:14px;">${bookmarks.length}</span>`;
    const list = document.getElementById('bmList');
    if (!bookmarks.length) {
        list.innerHTML = `<div class="bm-empty">${lang === 'ru' ? 'Наведи на номер любого текста и нажми ♡ чтобы добавить его сюда' : 'Hover over any text number and tap ♡ to add it here'}</div>`;
        return;
    }
    list.innerHTML = bookmarks.map(b => `
    <div class="bm-item" onclick="goToBm('${b.key}')">
      <div class="bm-ref">${lang === 'ru' ? 'Бг' : 'Bg'} <span style="font-family:'CA Moskow',serif;font-size:14px;">${b.key}</span></div>
      <div class="bm-txt">${b.txt}</div>
    </div>
  `).join('');
}

function goToBm(key) {
    const [ch] = key.split('.');
    renderChapter(+ch);
    document.getElementById('bmpanel').classList.remove('on');
    setTimeout(() => {
        const el = document.getElementById('v' + key.replace('.', '_'));
        if (el) el.scrollIntoView({behavior: 'smooth', block: 'start'});
    }, 200);
}

/* ════════════════════════════════════════════
UI CONTROLS
════════════════════════════════════════════ */
document.getElementById('menuBtn').addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    const mn = document.getElementById('main');
    const ov = document.getElementById('overlay');
    const scrollY = window.scrollY;
    const hidden = sb.classList.toggle('hidden');
    localStorage.setItem('bg_sidebar', hidden ? 'hidden' : 'open');
    mn.classList.toggle('full', hidden);
    if (!hidden && window.innerWidth < 768) ov.classList.add('on');
    else ov.classList.remove('on');
    setTimeout(() => window.scrollTo(0, scrollY), 250);
});
document.getElementById('bmBtn').addEventListener('click', () => {
    document.getElementById('bmpanel').classList.toggle('on');
    updateBm();
});

document.getElementById('themeBtn').addEventListener('click', () => toggleTheme());

function closeAll() {
    document.getElementById('overlay').classList.remove('on');
    document.getElementById('bmpanel').classList.remove('on');
    if (window.innerWidth < 768) {
        localStorage.setItem('bg_sidebar', 'hidden');
        document.getElementById('sidebar').classList.add('hidden');
        document.getElementById('main').classList.add('full');
    }
}

/* ════════════════════════════════════════════
PROGRESS BAR
════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
    const pg = document.getElementById('page');
    if (!pg) return;
    const pct = Math.min(100, (-pg.getBoundingClientRect().top / (pg.offsetHeight - window.innerHeight)) * 100);
    document.getElementById('progFill').style.width = Math.max(0, pct) + '%';
    document.getElementById('scrollTopBtn').classList.toggle('visible', window.scrollY > 300);
});

/* ════════════════════════════════════════════
HELPERS
════════════════════════════════════════════ */
function esc(s) {
    return String(s).replace(/'/g, "\\'");
}

function numWord(n) {
    const ru = ['', 'Первая', 'Вторая', 'Третья', 'Четвёртая', 'Пятая', 'Шестая', 'Седьмая', 'Восьмая', 'Девятая', 'Десятая', 'Одиннадцатая', 'Двенадцатая', 'Тринадцатая', 'Четырнадцатая', 'Пятнадцатая', 'Шестнадцатая', 'Семнадцатая', 'Восемнадцатая'];
    const en = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen'];
    return lang === 'ru' ? ru[n] : en[n];
}

function showHintIfNeeded() {
    const key = 'bg_hint_shown_' + lang;
    if (localStorage.getItem(key)) return;
    setTimeout(() => {
        alert(lang === 'ru'
            ? 'Подсказка (показывается один раз): наведи на номер текста, чтобы добавить его в любимые или прослушать лекцию по этому тексту'
            : 'Tip (shown once): hover over a text number to add it to favorites or listen to a lecture on this text');
        localStorage.setItem(key, '1');
        const d = document.querySelector('.pulse-dot');
        if (d) d.remove();
    }, 2000);
}

/* ════════════════════════════════════════════
INIT
════════════════════════════════════════════ */
showHintIfNeeded();
const sbState = localStorage.getItem('bg_sidebar');
if (sbState === 'hidden') {
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('main').classList.add('full');
} else if (sbState !== 'open' && window.innerWidth < 768) {
    document.getElementById('sidebar').classList.add('hidden');
    document.getElementById('main').classList.add('full');
} else if (sbState === 'open') {
    document.getElementById('sidebar').classList.remove('hidden');
    document.getElementById('main').classList.remove('full');
}
const savedTheme = localStorage.getItem('bg_theme') || 'light';
document.body.dataset.theme = savedTheme;
setThemeIcon(savedTheme === 'dark');
const savedLang = localStorage.getItem('bg_lang') || 'ru';
const savedChapter = parseInt(localStorage.getItem('bg_chapter')) || 7;
updateBm();