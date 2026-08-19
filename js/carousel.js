/* ── PICTURE INDEX CAROUSEL ── */

const PLATES = [
  {
    "plate": 1,
    "img": "./img/picindx/Plate 1.jpg",
    "sig": "Plate 1. Dhrtarastra inquires from Safijaya about the events of the battle.",
    "ch": 1,
    "verse": 1
  },
  {
    "plate": 2,
    "img": "./img/picindx/Plate 2.jpg",
    "sig": "Plate 2. “О my teacher, behold the great army of the sons of Pandu.”",
    "ch": 1,
    "verse": 3
  },
  {
    "plate": 3,
    "img": "./img/picindx/Plate 3.jpg",
    "sig": "Plate 3. Krsna and Arjuna in the midst of the two armies.",
    "ch": 1,
    "verse": 3
  },
  {
    "plate": 4,
    "img": "./img/picindx/Plate 4.jpg",
    "sig": "Plate 4. Krsna and Arjuna sounded their transcendental conchshells.",
    "ch": 1,
    "verse": 14
  },
  {
    "plate": 5,
    "img": "./img/picindx/Plate 5.jpg",
    "sig": "Plate 5. When Arjuna saw all different grades of friends and relatives, he became overwhelmed with compassion.",
    "ch": 1,
    "verse": 26
  },
  {
    "plate": 6,
    "img": "./img/picindx/Plate 6.jpg",
    "sig": "Plate 6. The insulting of Draupadi.",
    "ch": 1,
    "verse": 32
  },
  {
    "plate": 7,
    "img": "./img/picindx/Plate 7.jpg",
    "sig": "Plate 7. The Blessed Lord said: The wise lament neither for the living nor the dead.",
    "ch": 2,
    "verse": 11
  },
  {
    "plate": 8,
    "img": "./img/picindx/Plate 8.jpg",
    "sig": "Plate 8. The soul changes bodies as a person changes garments.",
    "ch": 2,
    "verse": 13
  },
  {
    "plate": 9,
    "img": "./img/picindx/Plate 9.jpg",
    "sig": "Plate 9. The body changes, but the soul remains the same.",
    "ch": 2,
    "verse": 13
  },
  {
    "plate": 10,
    "img": "./img/picindx/Plate 10.jpg",
    "sig": "Plate 10. Kṛṣṇa and the living entity are seated on the tree of the body.",
    "ch": 2,
    "verse": 22
  },
  {
    "plate": 11,
    "img": "./img/picindx/Plate 11.jpg",
    "sig": "Plate 11. While contemplating the objects of the senses, a person develops attachment for them.",
    "ch": 2,
    "verse": 62
  },
  {
    "plate": 12,
    "img": "./img/picindx/Plate 12.jpg",
    "sig": "Plate 12. \"Be thou happy by this sacrifice because its performance will bestow upon you all desirable things.\"",
    "ch": 3,
    "verse": 10
  },
  {
    "plate": 13,
    "img": "./img/picindx/Plate 13.jpg",
    "sig": "Plate 13. The demigods, being satisfied by the performance of sacrifice, supply all needs to man.",
    "ch": 3,
    "verse": 12
  },
  {
    "plate": 14,
    "img": "./img/picindx/Plate 14.jpg",
    "sig": "Plate 14. The living entity is covered by different degrees of lust.",
    "ch": 3,
    "verse": 37
  },
  {
    "plate": 15,
    "img": "./img/picindx/Plate 15.jpg",
    "sig": "Plate 15. The Blessed Lord first instructed this imperishable science of yoga to Vivasvān.",
    "ch": 4,
    "verse": 1
  },
  {
    "plate": 16,
    "img": "./img/picindx/Plate 16.jpg",
    "sig": "Plate 16.  The Lord descends whenever there is a decline in religious principles",
    "ch": 4,
    "verse": 7
  },
  {
    "plate": 17,
    "img": "./img/picindx/Plate 17.jpg",
    "sig": "Plate 17.  “In order to deliver the pious and to annihilate the miscreants. . .”",
    "ch": 4,
    "verse": 8
  },
  {
    "plate": 18,
    "img": "./img/picindx/Plate 18.jpg",
    "sig": "Plate 18. \"Аs they surrender to Me, I reward them accordingly.\"",
    "ch": 4,
    "verse": 11
  },
  {
    "plate": 19,
    "img": "./img/picindx/Plate 19.jpg",
    "sig": "Plate 19. He who applies himself well to one of these paths achieves the results of both.",
    "ch": 5,
    "verse": 4
  },
  {
    "plate": 20,
    "img": "./img/picindx/Plate 20.jpg",
    "sig": "Plate 20.  The humble sage sees with equal vision.",
    "ch": 5,
    "verse": 18
  },
  {
    "plate": 21,
    "img": "./img/picindx/Plate 21.jpg",
    "sig": "Plate 21. \"One should meditate on Me within the heart and make Me the ultimate goal of life.\"",
    "ch": 6,
    "verse": 11
  },
  {
    "plate": 22,
    "img": "./img/picindx/Plate 22.jpg",
    "sig": "Plate 22. One should engage oneself in the practice of yoga with undeviating determination and faith.",
    "ch": 6,
    "verse": 24
  },
  {
    "plate": 23,
    "img": "./img/picindx/Plate 23.jpg",
    "sig": "Plate 23. \"The mind is restless, turbulent, obstinate and very strong, О Kṛṣṇa\"",
    "ch": 6,
    "verse": 34
  },
  {
    "plate": 24,
    "img": "./img/picindx/Plate 24.jpg",
    "sig": "Plate 24. \"Of all yogis, he who abides in Me with great faith is the highest of all.\"",
    "ch": 6,
    "verse": 47
  },
  {
    "plate": 25,
    "img": "./img/picindx/Plate 25.jpg",
    "sig": "Plate 25. Kṛṣṇa's material and spiritual energies.",
    "ch": 7,
    "verse": 4
  },
  {
    "plate": 26,
    "img": "./img/picindx/Plate 26.jpg",
    "sig": "Plate 26. Four kinds of pious men surrender to Kṛṣṇa, and four kinds of impious men do not.",
    "ch": 7,
    "verse": 15
  },
  {
    "plate": 27,
    "img": "./img/picindx/Plate 27.jpg",
    "sig": "Plate 27. \"When one goes there, he never comes back. That is My supreme abode.\"",
    "ch": 8,
    "verse": 21
  },
  {
    "plate": 28,
    "img": "./img/picindx/Plate 28.jpg",
    "sig": "Plate 28. \"Fools deride Me when I descend in the human form.\"",
    "ch": 9,
    "verse": 11
  },
  {
    "plate": 29,
    "img": "./img/picindx/Plate 29.jpg",
    "sig": "Plate 29. Arjuna addressed Kṛṣṇa: \"You are the Supreme Brahman, the ultimate, the supreme abode and purifier.\"",
    "ch": 10,
    "verse": 12
  },
  {
    "plate": 30,
    "img": "./img/picindx/Plate 30.jpg",
    "sig": "Plate 30. \"Know that all these beautiful, glorious and mighty creations spring from but a spark of My splendor.\"",
    "ch": 10,
    "verse": 41
  },
  {
    "plate": 31,
    "img": "./img/picindx/Plate 31.jpg",
    "sig": "Plate 31. The universal form.",
    "ch": 11,
    "verse": 13
  },
  {
    "plate": 32,
    "img": "./img/picindx/Plate 32.jpg",
    "sig": "Plate 32. At last Kṛṣṇa showed Arjuna His two-armed form.",
    "ch": 11,
    "verse": 50
  },
  {
    "plate": 33,
    "img": "./img/picindx/Plate 33.jpg",
    "sig": "Plate 33. Kṛṣṇa delivers His unalloyed devotee from the ocean of birth and death.",
    "ch": 12,
    "verse": 6
  },
  {
    "plate": 34,
    "img": "./img/picindx/Plate 34.jpg",
    "sig": "Plate 34. The three modes of material nature.",
    "ch": 14,
    "verse": 14
  },
  {
    "plate": 35,
    "img": "./img/picindx/Plate 35.jpg",
    "sig": "Plate 35. There is a banyan tree which has its roots upward and its branches down.",
    "ch": 15,
    "verse": 1
  },
  {
    "plate": 36,
    "img": "./img/picindx/Plate 36.jpg",
    "sig": "Plate 36.  The spiritual and material worlds.",
    "ch": 15,
    "verse": 6
  },
  {
    "plate": 37,
    "img": "./img/picindx/Plate 37.jpg",
    "sig": "Plate 37. The living entity in the material world carries his different conceptions of life as the air carries aromas.",
    "ch": 15,
    "verse": 8
  },
  {
    "plate": 38,
    "img": "./img/picindx/Plate 38.jpg",
    "sig": "Plate 38. Bewildered by false ego, strength, pride, lust and anger.",
    "ch": 16,
    "verse": 5
  },
  {
    "plate": 39,
    "img": "./img/picindx/Plate 39.jpg",
    "sig": "Plate 39. Lust, greed and anger are the three gates leading down to hell.",
    "ch": 16,
    "verse": 10
  },
  {
    "plate": 40,
    "img": "./img/picindx/Plate 40.jpg",
    "sig": "Plate 40. There are three kinds of faith-that in the mode of goodness, that in passion and that in ignorance.",
    "ch": 17,
    "verse": 4
  },
  {
    "plate": 41,
    "img": "./img/picindx/Plate 41.jpg",
    "sig": "Plate 41. The place of action, the performer, the senses, the endeavor and ultimately the Supersoul. These are the five factors of action.",
    "ch": 18,
    "verse": 13
  },
  {
    "plate": 42,
    "img": "./img/picindx/Plate 42.jpg",
    "sig": "Plate 42. By worship of the Lord, man can, in the performance of his own duty, become perfect.",
    "ch": 18,
    "verse": 41
  },
  {
    "plate": 43,
    "img": "./img/picindx/Plate 43.jpg",
    "sig": "Plate 43. \"Always think of Me and become My devotee. Worship Me and offer your homage unto Me.\"",
    "ch": 18,
    "verse": 65
  },
  {
    "plate": 44,
    "img": "./img/picindx/Plate 44.jpg",
    "sig": "Plate 44. Wherever there is Kṛṣṇa and Arjuna there will certainly be opulence, victory, extraordinary power and morality.",
    "ch": 18,
    "verse": 78
  }
];

let currentPlateIdx = 0;

function openPlateModal(plateNum) {
    const idx = PLATES.findIndex(p => p.plate === plateNum);
    if (idx < 0) return;
    currentPlateIdx = idx;
    // Create modal if not exists
    if (!document.getElementById('plateModal')) createPlateModal();
    renderPlate();
    document.getElementById('plateModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function createPlateModal() {
    const modal = document.createElement('div');
    modal.id = 'plateModal';
    modal.style.cssText = [
        'display:none',
        'position:fixed',
        'inset:0',
        'background:rgba(0,0,0,0.85)',
        'z-index:1000',
        'align-items:center',
        'justify-content:center',
    ].join(';');

    modal.innerHTML = `
        <div style="
            position:relative;
            width:min(680px,92vw);
            height:min(620px,90vh);
            background:var(--paper);
            border-radius:8px;
            display:flex;
            flex-direction:column;
            overflow:hidden;
        ">
            <!-- Close -->
            <button onclick="closePlateModal()" style="
                position:absolute;top:10px;right:14px;
                background:none;border:none;font-size:22px;
                cursor:pointer;color:var(--ink);z-index:10;line-height:1;
            ">✕</button>

            <!-- Image area — fixed height -->
            <div style="
                flex:1;
                min-height:0;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:20px 20px 0;
                overflow:hidden;
            ">
                <img id="plateImg" src="" style="
                    max-width:100%;
                    max-height:100%;
                    object-fit:contain;
                " alt=""/>
            </div>

            <!-- Caption — fixed height with scroll if needed -->
            <div id="plateSig" style="
                height:80px;
                overflow-y:auto;
                padding:10px 24px;
                font-family:'IM Fell English',Georgia,serif;
                font-style:normal;
                font-size:15px;
                text-align:center;
                color:var(--ink);
                line-height:1.5;
                flex-shrink:0;
                border-top:1px solid var(--rule);
            "></div>

            <!-- Controls — always at bottom, fixed height -->
            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                padding:10px 20px;
                border-top:1px solid var(--rule);
                flex-shrink:0;
                background:var(--paper2);
            ">
                <button onclick="prevPlate()" style="
                    background:var(--paper);
                    border:1px solid var(--rule);
                    border-radius:4px;
                    width:40px;height:40px;
                    cursor:pointer;font-size:22px;
                    color:var(--ink);
                    display:flex;align-items:center;justify-content:center;
                ">‹</button>

                <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
                    <span id="plateCounter" style="
                        font-family:'Spectral SC',serif;
                        font-size:13px;
                        color:var(--ink3);
                    "></span>
                    <a id="plateVerseLink" href="#" onclick="goToPlateVerse(); return false;" style="
                        font-family:'IM Fell English',Georgia,serif;
                        font-size:13px;
                        color:var(--ink3);
                        border-bottom:1px dotted var(--rule);
                        text-decoration:none;
                    ">Go to verse</a>
                </div>

                <button onclick="nextPlate()" style="
                    background:var(--paper);
                    border:1px solid var(--rule);
                    border-radius:4px;
                    width:40px;height:40px;
                    cursor:pointer;font-size:22px;
                    color:var(--ink);
                    display:flex;align-items:center;justify-content:center;
                ">›</button>
            </div>
        </div>
    `;

    modal.addEventListener('click', e => { if (e.target === modal) closePlateModal(); });
    document.body.appendChild(modal);
}

function closePlateModal() {
    const modal = document.getElementById('plateModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
}

function renderPlate() {
    const p = PLATES[currentPlateIdx];
    document.getElementById('plateImg').src = p.img;

    // Apply formatPara to caption if available
    const sigEl = document.getElementById('plateSig');
    const sigText = p.sig;
    if (typeof formatPara === 'function') {
        sigEl.innerHTML = formatPara(sigText);
    } else {
        sigEl.textContent = sigText;
    }

    document.getElementById('plateCounter').textContent =
        'Plate ' + p.plate + ' of ' + PLATES.length;
    document.getElementById('plateVerseLink').textContent =
        'Verse ' + p.ch + '.' + p.verse;
}

function prevPlate() {
    currentPlateIdx = (currentPlateIdx - 1 + PLATES.length) % PLATES.length;
    renderPlate();
}

function nextPlate() {
    currentPlateIdx = (currentPlateIdx + 1) % PLATES.length;
    renderPlate();
}

function goToPlateVerse() {
    const p = PLATES[currentPlateIdx];
    closePlateModal();
    if (typeof goToVerse === 'function') {
        goToVerse(p.ch, p.verse);
        setTimeout(() => {
            const query = '.page img[src*="Plate ' + p.plate + '.jpg"]';
            const img = document.querySelector(query);
            if (img) img.scrollIntoView({behavior:'smooth', block:'center'});
        }, 600);
    }
}

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('plateModal');
    if (!modal || modal.style.display === 'none') return;
    if (e.key === 'ArrowLeft')  prevPlate();
    if (e.key === 'ArrowRight') nextPlate();
    if (e.key === 'Escape')     closePlateModal();
});