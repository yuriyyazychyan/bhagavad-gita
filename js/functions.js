/* ════════════════════════════════════════════
DATA — добавляй главы сюда по мере наполнения
════════════════════════════════════════════ */
let CHAPTERS = {};
let VERSES = {};
let GLOSSARY = {};

async function loadData() {
    try {
        const chaptersResponse = await fetch('./data/chapters.json');
        if (!chaptersResponse.ok) throw new Error('Не удалось загрузить CHAPTERS');
        CHAPTERS = await chaptersResponse.json();

        const versesResponse = await fetch('./data/verses.json');
        if (!versesResponse.ok) throw new Error('Не удалось загрузить VERSES');
        VERSES = await versesResponse.json();

        const glossaryResponse = await fetch('./data/glossary.json');
        if (!glossaryResponse.ok) throw new Error('Не удалось загрузить Glossary');
        GLOSSARY = await glossaryResponse.json();

        initApp();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
    }
}

// Инициализация приложения
function initApp() {
    // Если последний открытый раздел — подпункт Appendixes, разворачиваем его
    const savedCh = localStorage.getItem('bg_chapter');
    CHAPTERS.forEach(c => {
        if (c.children && c.children.some(child => child.n === savedCh)) {
            appendixOpen = c.n;
        }
    });
    window._restoreScroll = true;
    setLang(localStorage.getItem('bg_lang') || 'ru');
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
const _savedCh = localStorage.getItem('bg_chapter');
let curCh = _savedCh ? (isNaN(_savedCh) ? _savedCh : parseInt(_savedCh)) : 1;
let menuCh = typeof curCh === 'number' ? curCh : null;
let appendixOpen = null;

function getAdjacentChapters(current) {
    // Разворачиваем children в плоский список
    const all = [];
    CHAPTERS.forEach(c => {
        if (c.children) {
            c.children.forEach(child => all.push(child));
        } else {
            all.push(c);
        }
    });
    const idx = all.findIndex(c => c.n === current);
    return {
        prev: idx > 0 ? all[idx - 1] : null,
        next: idx < all.length - 1 ? all[idx + 1] : null
    };
}

function navButtonsHtml(current) {
    const { prev, next } = getAdjacentChapters(current);

    function label(ch, direction) {
        const name = (lang === 'ru' ? ch.ru : ch.en).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const isNum = typeof ch.n === 'number';
        const chapterLabel = lang === 'ru' ? 'Глава' : 'Chapter';
        const text = isNum
            ? (direction === 'prev'
                ? `← ${chapterLabel} ${ch.n}. ${name}`
                : `${chapterLabel} ${ch.n}. ${name} →`)
            : (direction === 'prev'
                ? `← ${name}`
                : `${name} →`);
        const onclick = isNum ? ch.n : `'${ch.n}'`;
        return `<div style="cursor:pointer;font-family:'CA Moskow',serif;font-size:16px;color:var(--ink2);" onclick="renderChapter(${onclick})">${text}</div>`;
    }

    const prevHtml = prev ? label(prev, 'prev') : '<div></div>';
    const nextHtml = next ? label(next, 'next') : '<div></div>';
    return `<div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid var(--rule);">${prevHtml}${nextHtml}</div>`;
}

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
            const hasChildren = chapter.children && chapter.children.length > 0;
            const isAppendixOpen = appendixOpen === chapter.n;

            if (hasChildren) {
                // Раздел с подпунктами — как глава со стихами
                tocHtml += `
        <div class="ch-row ${isAppendixOpen ? 'on' : ''}" onclick="toggleAppendix('${chapter.n}')">
            <span class="ch-label">${lang === 'ru' ? chapter.ru : chapter.en}</span>
            <span class="ch-vcount"><span style="font-family:'CA Moskow',serif;font-size:14px;">${chapter.v}</span></span>
        </div>`;

                if (isAppendixOpen) {
                    tocHtml += `<div class="toc-verses">`;
                    chapter.children.forEach(child => {
                        const isChildActive = child.n === curCh;
                        tocHtml += `
                <div class="toc-verse ${isChildActive ? 'on' : ''}" onclick="renderChapter('${child.n}')">
                    &nbsp;&nbsp;&nbsp;${lang === 'ru' ? child.ru : child.en}
                </div>`;
                    });
                    tocHtml += `</div>`;
                }
            } else {
                // Обычный спец раздел без подпунктов
                tocHtml += `
        <div class="ch-row ${isActive ? 'on' : ''}" onclick="renderChapter('${chapter.n}')">
            <span class="ch-label">${lang === 'ru' ? chapter.ru : chapter.en}</span>
        </div>`;
            }
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
            if (hasVerses && chapter.n === menuCh && !appendixOpen) {
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

function toggleChapter(n) {
    appendixOpen = null;
    if (n === menuCh) {
        menuCh = null;
    } else {
        menuCh = n;
        renderChapter(n);
    }
    renderToc();
}

function toggleAppendix(n) {
    appendixOpen = appendixOpen === n ? null : n;
    renderToc();
}

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
    let prevNumCh = null;
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
    menuCh = n;
    tocActiveCh = n;
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
    html += navButtonsHtml(n);

    document.getElementById('page').innerHTML = html;
    document.getElementById('topTitle').innerHTML = `${isRu ? ch.ru : ch.en}`;
    renderToc();
    updateBm();
    document.getElementById('overlay').classList.remove('on');
    document.getElementById('bmpanel').classList.remove('on');
    localStorage.setItem('bg_lang', lang);
    localStorage.setItem('bg_chapter', n);

    updateIllustration();

    if (!skipScroll) {
        const savedScroll = parseInt(localStorage.getItem('bg_scroll')) || 0;
        if (window._restoreScroll && savedScroll > 0) {
            setTimeout(() => window.scrollTo({top: savedScroll, behavior: 'instant'}), 50);
        } else if (!window._restoreScroll) {
            window.scrollTo({top: 0, behavior: 'smooth'});
        }
        window._restoreScroll = false;
    }
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
    text = text.replace(endPhrase, (match) =>
        `\n<p style="text-align:left;font-style:italic;margin-top:24px;">${match}</p>`
    );

    const diacritics = /[āīūṛṝṭḍṇśṣḥṃṁḷñĀĪŪṚṜṬḌṆŚṢḤṂṀḶÑ]/;

    function isSanskritQuote(para) {
        const trimmed = para.trim();
        if (trimmed.length < 5) return false;
        // Строки глоссария содержат тире — это определения, не цитаты
        if (/\s—\s/.test(trimmed)) return false;
        const words = trimmed.split(/\s+/);
        if (words.length < 2) return false;
        const sanskritCount = words.filter(w => diacritics.test(w)).length;
        const hasEnglishSentence = /[A-Z][a-z]/.test(trimmed) || /;/.test(trimmed);
        const mostlySanskrit = sanskritCount / words.length > 0.5;
        return (sanskritCount >= 1 && !hasEnglishSentence) || mostlySanskrit;
    }

    //Санскритские слова для принудительного обозначения курсивом
    const sanskritWords = new Set([ 'bhakti', 'bhakta', 'buddhi', 'buddhi-yoga', 'buddhi-yogam', 'bhakti-yoga', 'bhakti-yogam', 'yoga', 'karma-yoga', 'karma', 'svayam', 'Brahmā', 'pavitram', 'divyam', 'ajam', 'vibhum', 'sarvam', 'etad', 'manye', 'sat', 'cit', 'vigraha', 'nityo', 'tava', 'vedas', 'kena', 'jagat', 'surabhi', 'Brahmājyoti', 'mahat-tattva', 'asura', 'avyakta', 'nirukti', 'vai', 'sma', 'ca', 'om', 'acintya', 'acyuta', 'adhidaivatam', 'advaita', 'ajam', 'akarma', 'arca-vigraha', 'asat', 'yama', 'niyama', 'sura', 'bhaga', 'van', 'brahmacarya', 'brahma', 'jyoti', 'caturmasya', 'citi', 'deva', 'nandana', 'dharma', 'guru', 'japa', 'kumbhaka-yoga', 'nitya-baddha', 'kaivalyam', 'kalpa', 'tra', 'nir', 'nirmama', 'loka', 'mantra', 'mukti', 'tat', 'sat', 'pavitram', 'rasa', 'recaka', 'sattva', 'soma-rasa', 'sthita', 'muni', 'sukham', 'svadharmas', 'sva', 'sundara', 'tapasya', 'tattvavit', 'vikarma', 'yajur', 'atharva-vedas', 'vikarma', 'yuga', 'devaloka', 'avyayam'
                                      // сюда будешь добавлять по мере нахождения
                                  ]);

    //Санскритские фразы для принудительного обозначения курсивом
    const sanskritPhrases = ['viddhi me', 'Apareyam itas tv', 'Bhagavad-gītā As It Is', 'Atharva-veda', 'Garga' +
                                                                                                        ' Upaniṣad', 'Padma Purāṇa', 'Svatvata Tantra', 'ha vai', 'ity upakramya', 'Param dhāma', 'Svalpam apy asya dharmasya trāyate mahato bhayāt', 'na tad bhāsayate sūryo na śaśāṅko na pāvakaḥ yad gatvā na nivartante tad dhāma paramaṁ mama', 'ābrahma-bhuvanāl lokāḥ punar āvartino \'rjuna'
    // другие словосочетания
    ];

    //Санскритские слова, исключения для обозначения курсивом
    const straightNames = new Set(['Kṛṣṇa', 'Kṛṣṇa\'s', 'Krishna', 'Arjuna', 'Sañjaya', 'Sañjaya\'s', 'Dhṛtarāṣṭra', 'Pāṇḍu', 'Madhusūdana', 'Parāśara', 'Vyāsadeva', 'Bhagavan', 'Parāmatma', 'non-Āryans', 'Pṛthā', 'Sāndīpani', 'Vaiṣṇava', 'Dhṛtarāṣṭra\'s', 'Guḍākeśa', 'Hṛṣīkeśa', 'Māyāvādī', 'Rāmānuja', 'Māyāvādīs', 'Bhārata', 'Kurukṣetra', 'Vyāsa', 'Yudhiṣṭhira', 'Bhīma', 'Draupadī', 'Draupadī\'s', 'Dhṛṣṭadyumna', 'Droṇācārya\'s', 'Vikarṇa', 'Aśvatthāmā', 'Bhūriśravā', 'Bāhlīkas', 'Kuntī', 'Kṛpācārya', 'Dāsa', 'Bhaṭṭa', 'Gopāla', 'Ācārya', 'Gadādhara', 'Gadādhara\'s', 'Śrīvāsa', 'Śrīmati', 'Rādhārāṇī', 'Lalitā', 'Viśākhā', 'Vṛndāvana', 'Vṛṣabhānu', 'Droṇa', 'Droṇācārya', 'Duryodhana', 'Bhīṣma', 'Karṇa', 'Kṛṣṇa-Caitanya', 'Prabhupāda', 'Jñānasindhu', 'Śrīla', 'Gosvāmī', 'Vaiṣṇavas', 'Śrī', 'Śrīmad', 'Brahmā', 'Viṣṇu', 'Śiva', 'Nārāyaṇa', 'Nārada', 'Padmanābha', 'Mādhava', 'Akṣobhya', 'Jayatīrtha', 'Jñānasindhu', 'Dayānidhi', 'Vidyānidhi', 'Rājendra', 'Puruṣottama', 'Brahmāṇyatīrtha', 'Vyāsatīrtha', 'Founder-Ācārya', 'Rāma', 'Prakāśānanda', 'Nṛhari', 'Pāṇḍavas', 'Kauravas', 'Arjuna\'s', 'Lakṣmīpati', 'Nityānanda', 'Nityānanda\'s', 'Rūpa', 'Raghunātha', 'Jīva', 'Kṛṣṇadāsa', 'Viśvanātha', 'Jagannātha', 'Gaurakiśora', 'Bhaktisiddhānta', 'Sarasvatī', 'Duḥśāsana', 'Pāṇḍit', 'Vivasvān', 'Vāyu', 'Śyāmasundara', 'Lakṣmī-Nārāyaṇa', 'Lakṣmī', 'Garbhodakaśāyī', 'Kūrma', 'Varāha', 'Hiraṇyākśa', 'Nṛsiṁhadeva', 'Hiraṇyakaśipu', 'Vāmanadeva', 'Paraśurāma', 'Rāmacandra', 'Sītā', 'Lakṣmaṇa', 'Balarāma', 'Kaṁsa', 'Kaṁsa\'s ', 'Devakī', 'Vasudeva', 'Mathurā', 'Pāṇḍava', 'Mahārāja', 'Ikṣvāku', 'Garuḍa', 'Mahā-Viṣṇu', 'Kāmadhuk', 'Prahlāda', 'Vāsuki', 'Varuṇa', 'Yamarāja', 'Airāvata', 'Ucchaiḥśravā', 'Rādhā-Kṛṣṇa', 'Māyā', 'Rādhā', 'Patañjali', 'Ādityas', 'Advaitācārya', 'Āryan', 'Yudhiṣṭhira\'s', 'Mahāprabhu', 'Kavirāja', 'Devakī-nandana', 'Devakī', 'Rāvaṇa', 'Prahlāda', 'Mahārāja', 'Ṭhākur', 'Navadvīpa', 'Dvāpara-yuga', 'Gāṇḍiva', 'Hanumān', 'Haridāsa',  'Hiraṇyakaśipu\'s', 'Kālī', 'Devahūti', 'Kṛṣṇaloka', 'Kṣīrodakaśāyī', 'Kāraṇodakaśāyī', 'Kumāras', 'Pṛthā', 'Kuntī', 'Paṇḍavas', 'Nṛsiṁha', 'Maha-Viṣṇu', 'Paramātmā', 'Parantapaḥ', 'Parasurāma', 'Prajāpati', 'Rāvaṇa', 'Śaṅkarācārya', 'Sarasvatī', 'Śukadeva', 'Sūryaloka', 'Pārtha-sārathi', 'Pārtha', 'Pitṛloka', 'Parīkṣit', 'Brahmaṇyatīrtha', 'Uccaiḥśravā', 'Vaikuṇṭhas', 'Vaiṣṇava', 'Yajñeśvara', 'Yamunācārya', 'Tretā-yuga', 'Uccaiḥśravā', 'Vaikuṇṭhas', 'Vāsudeva', 'Yajñeśvara', 'Yamunācārya', 'Yaśodā', 'Yaśodā-nandana', 'Yogeśvara', 'Tretā-yuga', 'Bhagavān', 'Vaikuṇṭha', 'Śañkarācārya', 'Rāmānujācārya', 'Madhvācārya']);

    //Санскритские фразы, исключения для обозначения курсивом
    const straightPhrases = ['Mādhavendra Purī', 'Īśvara Purī', 'Rūpa Gosvāmī', 'Kṛṣṇadasa Kavirāja Gosvāmī', 'Parāśara Muni', 'Sanātana Gosvāmī', '(Svarūpa, Sanātana)', '(Nityānanda, Advaita)', 'Advaita Ācārya', 'Śrī Advaita', 'Nimbārka Svāmī'
    // фразы которые не нужно оборачивать
                                ];

    function formatPara(para) {
        // Сначала обрабатываем словосочетания которые НЕ нужно оборачивать
        const placeholders = [];
        straightPhrases.forEach(phrase => {
            const re = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            para = para.replace(re, (match) => {
                placeholders.push(match);
                return `\x00${placeholders.length - 1}\x00`;
            });
        });

        // Затем sanskritPhrases
        sanskritPhrases.forEach(phrase => {
            const re = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            para = para.replace(re,
                `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;">${phrase}</span>`
            );
        });

        // Пословный разбор
        para = para.replace(/(<span[^>]*>.*?<\/span>)|[\w\u00C0-\u024F\u1E00-\u1EFF][\w\u00C0-\u024F\u1E00-\u1EFF\-'’]*/gu, (match, span) => {
            if (span) return span;
            const clean = match.replace(/[,\.]/g, '');
            // const clean = match.replace(/['’,\.]/g, '');
            if (straightNames.has(clean)) {
                if (GLOSSARY[clean.toLowerCase()]) {
                    return `<span data-term="${clean.toLowerCase()}">${match}</span>`;
                }
                return match;
            }
            if (diacritics.test(match) || sanskritWords.has(clean.toLowerCase())) {
                return `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;" data-term="${clean.toLowerCase()}">${match}</span>`;
            }
            return match;
        });

        // Восстанавливаем защищённые фразы
        para = para.replace(/\x00(\d+)\x00/g, (_, i) => placeholders[i]);

        return para;
    }

    const lines = text.split('\n');
    const result = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i++; continue; }
        if (line.trim().startsWith('<div')) {
            result.push(line);
            i++;
            continue;
        }
        if (isSanskritQuote(line)) {
            // собираем все подряд идущие санскритские строки
            const group = [line.trim()];
            while (i + 1 < lines.length && lines[i + 1].trim() && isSanskritQuote(lines[i + 1])) {
                i++;
                group.push(lines[i].trim());
            }
            if (group.length > 1) {
                result.push(`<div class="v-translit">${group.join('<br>')}</div>`);
            } else {
                result.push(`<p style="text-align:center;text-indent:0;margin:16px 0;line-height:24px;font-family:'Times New Roman',Times,serif;font-style:italic;">${group[0]}</p>`);
            }
            i++;
            continue;
        }
        result.push(`<p>${formatPara(line)}</p>`);
        i++;
    }
    return result.join('');
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
        ▶ ${isRu ? 'Прослушать класс' : 'Listen to class'}
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
    const previousCh = curCh; // запоминаем
    curCh = section;
    appendixVisited = true; // реальный переход произошёл
    localStorage.setItem('bg_chapter', section);
    try {
        const response = await fetch(`./special/${section.toLowerCase()}.html`);
        if (!response.ok) throw new Error(`Не удалось загрузить контент раздела ${section}`);

        let content = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        let contentHtml = doc.body.innerHTML;

        if (section.toLowerCase() !== 'references') {
            contentHtml = formatPurport(contentHtml);
        }

        document.getElementById('page').innerHTML = contentHtml + navButtonsHtml(section);

        const chapterData = CHAPTERS.find(c => c.n === section) ||
                            CHAPTERS.flatMap(c => c.children || []).find(c => c.n === section);
        document.getElementById('topTitle').innerHTML =
            chapterData ? chapterData[lang === 'ru' ? 'ru' : 'en'] : section;

        updateIllustration();

        const savedScroll = parseInt(localStorage.getItem('bg_scroll')) || 0;
        if (window._restoreScroll && savedScroll > 0) {
            setTimeout(() => window.scrollTo({top: savedScroll, behavior: 'instant'}), 50);
        }
        window._restoreScroll = false;

    } catch (error) {
        appendixVisited = false; // переход не удался
        console.error('Ошибка при загрузке контента:', error);
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
let _tipTimer = null;

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
    if (_tipTimer) { clearTimeout(_tipTimer); _tipTimer = null; }
}

function showGlossaryTip(e, term) {
    const key = term.toLowerCase().replace(/[^\wāīūṛṝṭḍṇśṣḥṃṁḷñāīūṭḍṇṅśṣḥṃṁḷñ\-]/g, '').trim();
    const entry = GLOSSARY[key];
    if (!entry) return;

    const def = (lang === 'ru' && entry.ru) ? entry.ru : entry.en;
    if (!def) return;

    const t = document.getElementById('tip');
    // Заголовок
    document.getElementById('tipSkr').textContent = lang === 'ru' ? 'Глоссарий' : 'Glossary';
    // Термин
    document.getElementById('tipTr').textContent = entry.term;
    // Определение
    document.getElementById('tipDef').textContent = def;

    t.classList.add('on');
    const x = Math.min(e.clientX + 12, window.innerWidth - 280);
    const y = Math.min(e.clientY + 12, window.innerHeight - 110);
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    setTimeout(() => document.addEventListener('click', hideTip, {once: true}), 10);
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

// Сохраняем позицию скролла при прокрутке
window.addEventListener('scroll', () => {
    localStorage.setItem('bg_scroll', window.scrollY);
});

// Глоссарий тултип — наведение на санскритский термин
document.addEventListener('mouseover', (e) => {
    const span = e.target.closest('span[data-term]');
    if (!span) return;
    const term = span.getAttribute('data-term');
    if (!GLOSSARY[term]) return;
    _tipTimer = setTimeout(() => showGlossaryTip(e, term), 1200);
});

document.addEventListener('mouseout', (e) => {
    const span = e.target.closest('span[data-term]');
    if (!span) return;
    if (_tipTimer) { clearTimeout(_tipTimer); _tipTimer = null; }
    hideTip();
});