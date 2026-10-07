/* ════════════════════════════════════════════
Formatter.js
Форматирование текста: Sanskrit, IAST транслитерация,
пурпорт, пословный разбор.
════════════════════════════════════════════ */

class Formatter {
    constructor(library) {
        this.library = library;

        // Диакритические символы IAST
        this.diacritics = /[āīūṛṝṭḍṇśṣḥṃṁḷñṅĀĪŪṚṜṬḌṆŚṢḤṂṀḶÑṄ]/;

        // Имена собственные — не выделяются курсивом
        this.straightNames = new Set([
            'Kṛṣṇa',"Kṛṣṇa's",'Krishna','Arjuna',"Arjuna's",'Sañjaya',"Sañjaya's",
            'Dhṛtarāṣṭra',"Dhṛtarāṣṭra's",'Pāṇḍu','Madhusūdana','Parāśara','Vyāsadeva',
            'Bhagavan','Parāmatma','non-Āryans','Pṛthā','Sāndīpani','Vaiṣṇava','Vaiṣṇavas',
            'Guḍākeśa','Hṛṣīkeśa','Māyāvādī','Māyāvādīs','Rāmānuja','Bhārata','Kurukṣetra',
            'Vyāsa','Yudhiṣṭhira',"Yudhiṣṭhira's",'Bhīma','Draupadī',"Draupadī's",
            'Dhṛṣṭadyumna','Droṇācārya',"Droṇācārya's",'Vikarṇa','Aśvatthāmā','Bhūriśravā',
            'Bāhlīkas','Kuntī','Kṛpācārya','Dāsa','Bhaṭṭa','Gopāla','Ācārya','Gadādhara',
            "Gadādhara's",'Śrīvāsa','Śrīmati','Rādhārāṇī','Lalitā','Viśākhā','Vṛndāvana',
            'Vṛṣabhānu','Droṇa','Duryodhana','Bhīṣma','Karṇa','Kṛṣṇa-Caitanya','Prabhupāda',
            'Jñānasindhu','Śrīla','Gosvāmī','Śrī','Śrīmad','Brahmā','Viṣṇu','Śiva',
            'Nārāyaṇa','Nārada','Padmanābha','Mādhava','Akṣobhya','Jayatīrtha','Dayānidhi',
            'Vidyānidhi','Rājendra','Puruṣottama','Brahmāṇyatīrtha','Vyāsatīrtha',
            'Founder-Ācārya','Rāma','Prakāśānanda','Nṛhari','Pāṇḍavas','Kauravas',
            'Lakṣmīpati','Nityānanda',"Nityānanda's",'Rūpa','Raghunātha','Jīva',
            'Kṛṣṇadāsa','Viśvanātha','Jagannātha','Gaurakiśora','Bhaktisiddhānta','Sarasvatī',
            'Duḥśāsana','Pāṇḍit','Vivasvān','Vāyu','Śyāmasundara','Lakṣmī-Nārāyaṇa',
            'Lakṣmī','Garbhodakaśāyī','Kūrma','Varāha','Hiraṇyākśa','Nṛsiṁhadeva',
            "Hiraṇyakaśipu","Hiraṇyakaśipu's",'Vāmanadeva','Paraśurāma','Rāmacandra',
            'Sītā','Lakṣmaṇa','Balarāma','Kaṁsa',"Kaṁsa's",'Devakī','Vasudeva','Mathurā',
            'Pāṇḍava','Mahārāja','Ikṣvāku','Garuḍa','Mahā-Viṣṇu','Kāmadhuk','Prahlāda',
            'Vāsuki','Varuṇa','Yamarāja','Airāvata','Ucchaiḥśravā','Uccaiḥśravā',
            'Rādhā-Kṛṣṇa','Māyā','Rādhā','Patañjali','Ādityas','Advaitācārya','Āryan',
            'Mahāprabhu','Kavirāja','Devakī-nandana','Rāvaṇa','Ṭhākur','Navadvīpa',
            'Dvāpara-yuga','Gāṇḍiva','Hanumān','Haridāsa','Kālī','Devahūti','Kṛṣṇaloka',
            'Kṣīrodakaśāyī','Kāraṇodakaśāyī','Kumāras','Paṇḍavas','Nṛsiṁha','Paramātmā',
            'Parantapaḥ','Parasurāma','Prajāpati','Śaṅkarācārya','Śukadeva','Sūryaloka',
            'Pārtha-sārathi','Pārtha','Pitṛloka','Parīkṣit','Brahmaṇyatīrtha','Vaikuṇṭhas',
            'Vaikuṇṭha','Vāsudeva','Yajñeśvara','Yamunācārya','Yaśodā','Yaśodā-nandana',
            'Yogeśvara','Tretā-yuga','Satya-yuga','kali-yuga','Svargaloka','Sahadeva',
            'Mukunda','Manu','Kuvera','Kurus','Nakula','Kaunteya','Kapila','Janaka',
            'Indraloka','Indra','Govinda','Goloka','Ganges','Gandharvas','Drupada',
            'Candraloka','Candra','Brahman','Brahmaloka','Brahmajyoti','Anantavijaya',
            'Ananta','Agni','Aditi','Naimiṣāraṇya','Śaunaka','Aniruddha','Bhagavān',
            'Śañkarācārya','Rāmānujācārya','Madhvācārya','Maha-Viṣṇu','Bṛhaspati',
            'Pārvatī','Śaṅkara','Marīci','Bhṛgu','Aryamā','Yama','Rāma-kṛṣṇa','Brahmās',
            'Māyā devī','Śikhaṇḍī','Śeṣa','Advaita','Uśanā','Kṛtavarmā','Śalya',
        ]);

        // Санскритские слова — принудительный курсив
        this.sanskritWords = new Set([
            'bhakti','bhakta','buddhi','buddhi-yoga','buddhi-yogam','bhakti-yoga','bhakti-yogam',
            'yoga','karma-yoga','karma','svayam','pavitram','divyam','ajam','vibhum','sarvam',
            'etad','manye','sat','cit','vigraha','nityo','tava','vedas','kena','jagat','surabhi',
            'mahat-tattva','asura','avyakta','nirukti','vai','sma','ca','om','acintya','acyuta',
            'adhidaivatam','akarma','arca-vigraha','asat','yama','niyama','sura',
            'bhaga','van','brahmacarya','brahma','jyoti','caturmasya','citi','deva','nandana',
            'dharma','guru','japa','kumbhaka-yoga','nitya-baddha','kaivalyam','kalpa','tra',
            'nir','nirmama','loka','mantra','mukti','tat','rasa','recaka','sattva','soma-rasa',
            'sthita','muni','sukham','svadharmas','sva','sundara','tapasya','tattvavit',
            'vikarma','yajur','atharva-vedas','yuga','devaloka','avyayam','adi-devam',
            'advaitam','acyutam','agnihotra','aham','hi','sarvasya','sarve','anagha',
            'ananta-brahma','anantavijaya','anityam','lokam','annamaya','mahato','eva','smaran',
            'kalevaram','antavanta','ime','varjanam','apareyam','itas','tv','yadi','samagram',
            'vrajati','asuras','asya','yad','na','bhaved','paramo','ha','ity','upakramya',
            'viddhi','ratham','avyakto','uktas','gatim','prapadyate','kalpitasya','bhajate',
            'bhavambudhir','padam','apetasya','viparyayo','bhidyate','chidyante','brahmam',
            'etat','ye','pacanty','te','brahmaiva','san','brahma-jana','pathi',
            'brahma-yoga','acintya-bheda','daivim','uttamam','ceto','dvandvair','eko','devo',
            "ko'pi",'samau','neme','yamebhyo','lokebhya','prasanna-manaso','punar',
            "'rjuna",'veda',"'tha",'mitho','ajani','tad','avimucya','jantur',"'yam",
            'ajo',"'sya",'atha','tato','tam','ante','harer','tasya','tri-sandhyam',
            'yo','u','hy','ete','tu','ga','abhaktasya','kuto','yasya','kvacit','yato',
            'anyam','tais','tair','prapadyante','samabhavat','lokyate',"'nena",
            'mad-bhaktim','labhate','mama','yonir','mahad','mana','bhava','asti',
            'jiver','paravyome','mayi','sannyasya','muktir','namo','paro','devas',
            'rudro','sa','munir','binnam','deho','ucyate','kurute','tattvam',
            'patir','phalam','tau','sadaiva','vilokayanti','iti','rasam','raso',
            'samyag','bhadram','astu','bhavato','vraja','parityajya','yan','vadasi',
            'prabhum','vipro','marttyam','siddhis','prapannam','kahe','bahubhir',
            'arcanam','yei','bata','vidyate','devam','prapadye','anusmara','yudhya',
            'ya','vidur','bhavanti','tepus','tapas','juhuvu','sasnur','tvam','ubhe',
            'taraty','vadanti','tattva-vidas','yaj','advayam','sarvair','durlabham',
            'adurlabham','kvanantam','vinivartante','atho','tyajaty','yas',
            'bhavata','brahme','bhaktir','deve','bhramati','bhagavaty','yena',
            'yat','prayanty','kva','salite','api','sarvair','vedair','praiti',
            'sarva-gato','yogas','aho','kevalam','karau','muhyanti','bhavati',
            'avatare','dharmasya','govindam','yasmin','gurau','yatra','karhicit',
            'kim','asvatantra','iva','dvija','brahmajyoti','ananta','kavis',
            'bhagavad-bhakti-yogataḥ','nivasaty','santas', 'tatra'
        ]);

        // Фразы — принудительный курсив
        this.sanskritPhrases = [
            'viddhi me','Apareyam itas tv','Bhagavad-gītā As It Is',
            'Atharva-veda','Garga Upaniṣad','Padma Purāṇa','Svatvata Tantra',
            'ha vai','ity upakramya','Param dhāma',
            'Svalpam apy asya dharmasya trāyate mahato bhayāt',
            "na tad bhāsayate sūryo na śaśāṅko na pāvakaḥ yad gatvā na nivartante tad dhāma paramaṁ mama",
            "ābrahma-bhuvanāl lokāḥ punar āvartino 'rjuna",
            'om tat sat','u hy','caitanya prabhu','brahman hanyante',
        ];

        // Фразы-исключения — не выделяются курсивом
        this.straightPhrases = [
            'Mādhavendra Purī','Īśvara Purī','Rūpa Gosvāmī',
            'Kṛṣṇadasa Kavirāja Gosvāmī','Parāśara Muni','Sanātana Gosvāmī',
            '(Svarūpa, Sanātana)','(Nityānanda, Advaita)','Advaita Ācārya',
            'Śrī Advaita','Nimbārka Svāmī','Śukadeva Gosvāmī','Pranāva omkāra',
            'Prahlāda Mahārāja','Param dhāma','Param Brahman','om tat sat',
            'Nārada Muni','Nanda Mahārāja','Kṣīrodakaśāyī Viṣṇu',
            'Kṛṣṇadāsa Kavirāja Gosvāmī','Kāraṇodakaśāyī Viṣṇu',
            'Haridāsa Ṭhākur','Garbhodakaśāyī Viṣṇu','Caitanya Mahāprabhu',
            'Bhaktivinode Ṭhākur',
            'Bhaktisiddhānta Sarasvatī Gosvāmī Mahārāja Prabhupāda',
            'Asuraṁ bhāvam āśrita','Aparā prakṛti','Sūta Gosvāmī',
            'hare kṛṣṇa hare kṛṣṇa kṛṣṇa kṛṣṇa hare harehare rāma hare rāma rāma rāma hare hare',
            'Ambarīṣa Mahārāja','Durvāsā Muni',
        ];

        // IAST → русский транслит
        this.iastMap = [
            ['kh','кх'],['gh','гх'],['ch','чх'],['jh','джх'],
            ['ṭh','т̣х'],['ḍh','д̣х'],['th','тх'],['dh','дх'],
            ['ph','пх'],['bh','бх'],['ai','аи'],['au','ау'],
            ['ā','а̄'],['Ā','А̄'],['ī','ӣ'],['Ī','Ӣ'],
            ['ū','ӯ'],['Ū','Ӯ'],['ṛ','р̣'],['ṝ','р̣̄'],
            ['ḷ','л̣'],['ṅ','н̇'],['ñ','н̃'],
            ['ṭ','т̣'],['Ṭ','Т̣'],['ḍ','д̣'],['Ḍ','Д̣'],
            ['ṇ','н̣'],['Ṇ','Н̣'],['ś','ш́'],['Ś','Ш́'],
            ['ṣ','ш̣'],['Ṣ','Ш̣'],['ṃ','м̣'],['Ṃ','М̣'],
            ['ṁ','м̇'],['Ṁ','М̇'],['ḥ','х̣'],['Ḥ','Х̣'],
            ['a','а'],['A','А'],['i','и'],['I','И'],
            ['u','у'],['U','У'],['e','е'],['E','Е'],
            ['o','о'],['O','О'],['k','к'],['K','К'],
            ['g','г'],['G','Г'],['c','ч'],['C','Ч'],
            ['j','дж'],['J','Дж'],['t','т'],['T','Т'],
            ['d','д'],['D','Д'],['n','н'],['N','Н'],
            ['p','п'],['P','П'],['b','б'],['B','Б'],
            ['m','м'],['M','М'],['y','й'],['Y','Й'],
            ['r','р'],['R','Р'],['l','л'],['L','Л'],
            ['v','в'],['V','В'],['s','с'],['S','С'],
            ['h','х'],['H','Х'],
        ];
    }

    // ── IAST → Русская транслитерация ─────────────────────────────────────
    iastToRu(text) {
        if (!text) return text;
        const tags = [];
        let result = text.replace(/(<[^>]+>|&[a-z]+;)/g, m => {
            tags.push(m);
            return `\x00${tags.length - 1}\x00`;
        });
        for (const [from, to] of this.iastMap) {
            result = result.split(from).join(to);
        }
        return result.replace(/\x00(\d+)\x00/g, (_, i) => tags[i]);
    }

    // ── Пословный разбор (Word-by-Word) ──────────────────────────────────
    formatWbw(text) {
        if (!text || text === '—') return text;
        return text.split(';').map(part => {
            const idx = part.indexOf('—');
            if (idx === -1) return part;
            const sanskrit = part.substring(0, idx);
            const english  = part.substring(idx + 1);
            return `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;">${sanskrit}</span>`
                 + `<span style="font-family:'IM Fell English',Georgia,serif;font-style:normal;">—${english}</span>`;
        }).join('; ');
    }

    // ── Определить является ли строка цитатой на санскрите ───────────────
    #isSanskritQuote(para) {
        if (para.startsWith('\x01') || para.startsWith('\x02') || para.startsWith('\x03')) return false;
        if (/onclick=|gi-link/.test(para)) return false;
        const trimmed = para.trim();
        if (trimmed.length < 5) return false;
        if (/\s—\s/.test(trimmed)) return false;
        const words = trimmed.split(/\s+/);
        if (words.length < 2) return false;
        const sanskritCount    = words.filter(w => this.diacritics.test(w)).length;
        const hasEnglishSentence = /[A-Z][a-z]/.test(trimmed) || /;/.test(trimmed);
        const mostlySanskrit   = sanskritCount / words.length > 0.5;
        return (sanskritCount >= 1 && !hasEnglishSentence) || mostlySanskrit;
    }

    // ── Форматирование одного параграфа ──────────────────────────────────
    formatPara(para) {
        const glossary = this.library.glossary;
        const placeholders = [];

        // 1. Защищаем straightPhrases (не курсив)
        this.straightPhrases.forEach(phrase => {
            const re = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            para = para.replace(re, match => {
                placeholders.push(match);
                return `\x00${placeholders.length - 1}\x00`;
            });
        });

        // 2. Принудительный курсив для sanskritPhrases
        this.sanskritPhrases.forEach(phrase => {
            const re = new RegExp(phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            para = para.replace(re,
                `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;">${phrase}</span>`
            );
        });

        // 3. Пословная обработка
        para = para.replace(
            /(<span[^>]*>.*?<\/span>)|[''']?[\w\u00C0-\u024F\u1E00-\u1EFF][\w\u00C0-\u024F\u1E00-\u1EFF\-''']*/gu,
            (match, span) => {
                if (span) return span;
                const clean = match.replace(/[,.]/g, '');
                if (this.straightNames.has(clean)) {
                    if (glossary[clean.toLowerCase()]) {
                        return `<span data-term="${clean.toLowerCase()}">${match}</span>`;
                    }
                    return match;
                }
                if (this.diacritics.test(match) || this.sanskritWords.has(clean.toLowerCase())) {
                    return `<span style="font-family:'Times New Roman',Times,serif;font-style:italic;" data-term="${clean.toLowerCase()}">${match}</span>`;
                }
                return match;
            }
        );

        // 4. Восстанавливаем защищённые фразы
        para = para.replace(/\x00(\d+)\x00/g, (_, i) => {
            const phrase = placeholders[i];
            const key    = phrase.toLowerCase();
            if (glossary[key]) {
                return `<span data-term="${key}">${phrase}</span>`;
            }
            return phrase;
        });

        return para;
    }

    // ── Форматирование блока пурпорта ─────────────────────────────────────
    formatPurport(text) {
        if (!text || text.trim() === '—' || text.trim() === '') return '';

        // Концовка пурпорта
        const endPhrase = /Thus end the Bhaktivedanta Purports[^.]+\./;
        text = text.replace(endPhrase, match =>
            `\n<p style="text-align:left;font-style:italic;margin-top:24px;">${match}</p>`
        );

        const lines  = text.split('\n');
        const result = [];
        let i = 0;

        while (i < lines.length) {
            const line = lines[i];
            if (!line.trim()) { i++; continue; }

            // HTML блоки — вставляем как есть
            if (line.trim().startsWith('<div') || line.trim().startsWith('<p ') || line.trim().startsWith('<p>')) {
                result.push(line);
                i++;
                continue;
            }

            // Санскритская цитата
            if (this.#isSanskritQuote(line)) {
                const group = [line.trim()];
                while (i + 1 < lines.length && lines[i + 1].trim() && this.#isSanskritQuote(lines[i + 1])) {
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

            // General Index маркеры
            if (line.startsWith('\x01')) {
                result.push(`<p class="gi-subentry">${this.formatPara(line.slice(1))}</p>`);
            } else if (line.startsWith('\x02')) {
                result.push(`<p class="gi-continuation">${this.formatPara(line.slice(1))}</p>`);
            } else if (line.startsWith('\x03')) {
                result.push(`<p class="gi-entry">${this.formatPara(line.slice(1))}</p>`);
            } else {
                result.push(`<p>${this.formatPara(line)}</p>`);
            }
            i++;
        }

        return result.join('');
    }
}

// ── Глобальный экземпляр ─────────────────────────────────────────────────────
// Создаётся после BookLibrary, использует window.Library
window.Fmt = new Formatter(window.Library);

// Глобальные алиасы для обратной совместимости с reader.js
function formatPurport(text) { return window.Fmt.formatPurport(text); }
function formatPara(para)    { return window.Fmt.formatPara(para); }
function formatWbw(text)     { return window.Fmt.formatWbw(text); }
function iastToRu(text)      { return window.Fmt.iastToRu(text); }
