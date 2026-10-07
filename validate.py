#!/usr/bin/env python3
"""
Prabhupada Library Validator
Проверяет целостность всех книг в библиотеке.

Единый формат данных для ВСЕХ книг: books/<id>/data/content.json
  type "verses"   → { "1": [ {n, nLabel?, skr, tr, tr_en, pur_en, ...} ] }
  type "chapters" → { "1": [ {n, text_en, text_ru} ] }
Старое имя verses.json (только для type "verses") ещё принимается, но
даёт предупреждение — так же ведёт себя BookLibrary.js.

Использование:
  python3 validate.py [путь_к_корню_библиотеки]

Пример:
  python3 validate.py .
  python3 validate.py /path/to/bhagavad-gita
"""

import json
import os
import re
import sys

# ── Цвета для вывода ────────────────────────────────────────────────────────
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

def ok(msg):   print(f"  {GREEN}✓{RESET} {msg}")
def warn(msg): print(f"  {YELLOW}⚠{RESET} {msg}")
def error(msg): print(f"  {RED}✗{RESET} {msg}")
def info(msg): print(f"  {BLUE}→{RESET} {msg}")

errors_total = 0
warns_total = 0

def count_error():
    global errors_total
    errors_total += 1

def count_warn():
    global warns_total
    warns_total += 1

def fail(msg):
    error(msg)
    count_error()

def caution(msg):
    warn(msg)
    count_warn()

# ── Helpers ──────────────────────────────────────────────────────────────────

DATA_FILE = 'content.json'          # единое имя для всех книг
LEGACY_VERSES_FILE = 'verses.json'  # старое имя (только type "verses")

def load_json(path):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f), None
    except FileNotFoundError:
        return None, f"File not found: {path}"
    except json.JSONDecodeError as e:
        return None, f"JSON parse error in {path}: {e}"

def to_int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None

def parse_range(label):
    """'16–18' / '16-18' → (16, 18) или None."""
    parts = str(label).replace('–', '-').replace('—', '-').split('-')
    if len(parts) != 2:
        return None
    start, end = to_int(parts[0]), to_int(parts[1])
    if start is None or end is None:
        return None
    return start, end

def detect_shape(data):
    """Определить формат данных по первому непустому элементу."""
    for items in data.values():
        if isinstance(items, list) and items and isinstance(items[0], dict):
            first = items[0]
            if 'text_en' in first or 'text_ru' in first:
                return 'chapters'
            if any(k in first for k in ('tr', 'skr', 'tr_en', 'tr_ru', 'pur_en', 'pur_ru')):
                return 'verses'
    return None

def find_data_file(book_path, book_type):
    """content.json в приоритете; verses.json — только как legacy для verses."""
    data_dir = os.path.join(book_path, 'data')
    main = os.path.join(data_dir, DATA_FILE)
    legacy = os.path.join(data_dir, LEGACY_VERSES_FILE)

    if os.path.exists(main):
        if book_type == 'verses' and os.path.exists(legacy):
            caution(f"Найдены и {DATA_FILE}, и {LEGACY_VERSES_FILE} — используется {DATA_FILE}. "
                    f"Удалите {LEGACY_VERSES_FILE}, чтобы не путаться")
        return main
    if book_type == 'verses' and os.path.exists(legacy):
        caution(f"Старое имя {LEGACY_VERSES_FILE} — переименуйте в {DATA_FILE}")
        return legacy
    return None

# ── Validate catalog.json ────────────────────────────────────────────────────

def validate_catalog(root):
    print(f"\n{BOLD}=== catalog.json ==={RESET}")
    catalog_path = os.path.join(root, 'books', 'catalog.json')
    catalog, err = load_json(catalog_path)
    if err:
        fail(err)
        return []

    ok(f"catalog.json loaded — {len(catalog)} books")
    valid_books = []

    for entry in catalog:
        bid = entry.get('id', '?')
        status = entry.get('status', '?')
        if not entry.get('id'):
            fail(f"Entry missing 'id': {entry}")
            continue
        if status not in ('published', 'draft'):
            caution(f"Book '{bid}' has unknown status: '{status}'")
        else:
            info(f"Book '{bid}' [{status}]")
        valid_books.append(entry)

    return valid_books

# ── Validate meta.json ───────────────────────────────────────────────────────

REQUIRED_META_FIELDS = ['id', 'title', 'author', 'year', 'type', 'status']
VALID_TYPES = ['verses', 'chapters']

def validate_meta(root, book_path, book_id):
    print(f"\n  {BOLD}meta.json{RESET}")
    meta, err = load_json(os.path.join(book_path, 'meta.json'))
    if err:
        fail(err)
        return None

    ok("meta.json loaded")

    for field in REQUIRED_META_FIELDS:
        if field not in meta:
            fail(f"Missing required field: '{field}'")
        else:
            ok(f"Field '{field}': {meta[field]}")

    if meta.get('id') != book_id:
        fail(f"meta.id '{meta.get('id')}' doesn't match folder name '{book_id}'")

    if meta.get('type') not in VALID_TYPES:
        fail(f"Invalid type: '{meta.get('type')}'. Must be one of: {VALID_TYPES}")

    for field in ['cover', 'shortTitle', 'lang', 'description']:
        if field not in meta:
            caution(f"Recommended field missing: '{field}'")

    covers = meta.get('covers') or ([meta['cover']] if meta.get('cover') else [])
    if covers:
        for cover in covers:
            if os.path.exists(os.path.join(root, cover)):
                ok(f"Cover found: {cover}")
            else:
                caution(f"Cover image not found: {cover}")
    else:
        auto_cover = os.path.join(book_path, 'img', 'book&cover', 'cover.jpg')
        if os.path.exists(auto_cover):
            ok("Cover auto-detected: img/book&cover/cover.jpg")
        else:
            caution("No cover image found (checked img/book&cover/cover.jpg)")

    return meta

# ── Validate chapters.json ───────────────────────────────────────────────────

def validate_chapters(book_path):
    print(f"\n  {BOLD}chapters.json{RESET}")
    chapters, err = load_json(os.path.join(book_path, 'data', 'chapters.json'))
    if err:
        fail(err)
        return None

    ok(f"chapters.json loaded — {len(chapters)} entries")

    numeric_chapters = []
    string_chapters = []

    for ch in chapters:
        n = ch.get('n')
        if n is None:
            fail(f"Chapter missing 'n' field: {ch}")
            continue
        if not ch.get('en') and not ch.get('ru'):
            caution(f"Chapter {n} has no title (en or ru)")
        if isinstance(n, int):
            numeric_chapters.append(n)
        else:
            string_chapters.append(str(n))

    ok(f"Numeric chapters: {len(numeric_chapters)}")
    info(f"Special sections: {string_chapters}")

    dupes = [n for n in numeric_chapters if numeric_chapters.count(n) > 1]
    if dupes:
        fail(f"Duplicate chapter numbers: {list(set(dupes))}")
    else:
        ok("No duplicate chapter numbers")

    sorted_nums = sorted(numeric_chapters)
    expected = list(range(1, len(sorted_nums) + 1))
    gaps = [n for n in expected if n not in sorted_nums]
    if gaps:
        caution(f"Missing chapter numbers: {gaps}")

    return chapters

# ── Validate data (type "verses") ────────────────────────────────────────────

def validate_verses_data(verses, chapters):
    numeric_chapters = [ch['n'] for ch in (chapters or []) if isinstance(ch.get('n'), int)]
    total_verses = 0
    issues = []

    for ch_num in numeric_chapters:
        ch_verses = verses.get(str(ch_num), [])
        if not ch_verses:
            fail(f"Chapter {ch_num} has no verses")
            continue

        total_verses += len(ch_verses)
        verse_nums = [v.get('n') for v in ch_verses]

        for v in ch_verses:
            vn = v.get('n')
            if vn is None:
                issues.append(f"Ch{ch_num}: verse missing 'n'")
                continue
            has_content = any([
                v.get('skr'), v.get('tr'),
                v.get('tr_en'), v.get('tr_ru'),
                v.get('pur_en'), v.get('pur_ru'),
            ])
            if not has_content:
                issues.append(f"Ch{ch_num}.{vn}: no content in any field")

        dupes = [n for n in verse_nums if verse_nums.count(n) > 1]
        if dupes:
            issues.append(f"Ch{ch_num}: duplicate verse numbers {list(set(dupes))}")

    ok(f"Loaded — {total_verses} total verses")

    if issues:
        print(f"\n  {YELLOW}Issues found:{RESET}")
        for issue in issues[:20]:
            caution(issue)
        if len(issues) > 20:
            caution(f"... and {len(issues) - 20} more")
    else:
        ok("No verse issues found")

    # Диапазоны nLabel
    range_count = 0
    for ch_str, ch_verses in verses.items():
        for v in ch_verses:
            if not v.get('nLabel'):
                continue
            range_count += 1
            rng = parse_range(v['nLabel'])
            if rng is None:
                if to_int(v['nLabel']) is not None:
                    caution(f"Ch{ch_str}.{v.get('n')}: nLabel '{v['nLabel']}' is a single number — "
                            f"expected a range like '{v['nLabel']}-{to_int(v['nLabel']) + 1}' "
                            f"(or remove nLabel). Possible typo: dropped range end?")
                else:
                    caution(f"Ch{ch_str}.{v.get('n')}: unparseable nLabel '{v['nLabel']}'")
                continue
            start, end = rng
            if start >= end:
                caution(f"Ch{ch_str}.{v.get('n')}: invalid range '{v['nLabel']}'")
            if to_int(v.get('n')) != start:
                caution(f"Ch{ch_str}.{v.get('n')}: n={v.get('n')} but nLabel starts at {start}")

    info(f"Verse ranges (nLabel): {range_count}")

    # Пропуски в нумерации: каждый номер 1..max должен быть покрыт стихом или диапазоном
    for ch_num in numeric_chapters:
        covered = set()
        for v in verses.get(str(ch_num), []):
            n = to_int(v.get('n'))
            if n is not None:
                covered.add(n)
            rng = parse_range(v['nLabel']) if v.get('nLabel') else None
            if rng:
                covered.update(range(rng[0], rng[1] + 1))
        if covered:
            missing = [i for i in range(1, max(covered) + 1) if i not in covered]
            if missing:
                caution(f"Ch{ch_num}: verse numbers not covered by any verse/range: {missing}")

# ── Validate data (type "chapters") ──────────────────────────────────────────

def validate_chapters_data(content, chapters):
    numeric_chapters = [ch['n'] for ch in (chapters or []) if isinstance(ch.get('n'), int)]
    ok(f"Loaded — {len(content)} chapters with data")

    empty_chapters = []
    for ch_num in numeric_chapters:
        paras = content.get(str(ch_num), [])
        if not paras:
            empty_chapters.append(ch_num)
            continue
        for i, para in enumerate(paras):
            if not para.get('text_en') and not para.get('text_ru'):
                caution(f"Ch{ch_num} para {i}: no text_en or text_ru")

    if empty_chapters:
        caution(f"Chapters with no content: {empty_chapters}")
    else:
        ok("All chapters have content")

# ── Validate data/content.json (универсально) ────────────────────────────────

def validate_data(book_path, chapters, book_type):
    data_path = find_data_file(book_path, book_type)
    name = os.path.basename(data_path) if data_path else DATA_FILE
    print(f"\n  {BOLD}data/{name}{RESET}")

    if not data_path:
        fail(f"data/{DATA_FILE} not found")
        return None

    data, err = load_json(data_path)
    if err:
        fail(err)
        return None

    if not isinstance(data, dict):
        fail("Top-level JSON must be an object: { \"1\": [...], \"2\": [...] }")
        return None

    # Формат данных должен соответствовать meta.type
    shape = detect_shape(data)
    if shape is None:
        caution("Не удалось определить формат данных (нет ни стихов, ни абзацев)")
    elif shape != book_type:
        fail(f"meta.type = '{book_type}', но данные в формате '{shape}'")
        return None

    if book_type == 'verses':
        validate_verses_data(data, chapters)
    else:
        validate_chapters_data(data, chapters)

    return data

# ── Validate special sections ────────────────────────────────────────────────

def validate_special(book_path, chapters):
    print(f"\n  {BOLD}special/ sections{RESET}")
    special_dir = os.path.join(book_path, 'special')

    if not os.path.exists(special_dir):
        info("No special/ directory")
        return

    string_chapters = [ch for ch in (chapters or []) if isinstance(ch.get('n'), str)]
    found_files = set(f.lower() for f in os.listdir(special_dir) if f.endswith('.html'))

    for ch in string_chapters:
        n = ch.get('n', '').lower()
        expected_file = f"{n}.html"
        if expected_file in found_files:
            ok(f"special/{expected_file}")
        elif ch.get('children'):
            for child in ch['children']:
                child_file = f"{str(child.get('n', '')).lower()}.html"
                if child_file in found_files:
                    ok(f"special/{child_file}")
                else:
                    fail(f"Missing: special/{child_file}")
        else:
            fail(f"Missing: special/{expected_file}")

    # UPPERCASE имена файлов (Linux регистрозависим)
    uppercase = [f for f in os.listdir(special_dir) if f != f.lower() and f.endswith('.html')]
    if uppercase:
        fail(f"UPPERCASE filenames (will break on Linux): {uppercase}")
    else:
        ok("All filenames are lowercase")

# ── Validate generalindx links ───────────────────────────────────────────────

def verse_exists(ch_verses, vnum):
    """Есть ли стих vnum в главе — точное совпадение или внутри диапазона nLabel."""
    for x in ch_verses:
        if to_int(x.get('n')) == vnum:
            return True
        if x.get('nLabel'):
            rng = parse_range(x['nLabel'])
            if rng and rng[0] <= vnum <= rng[1]:
                return True
    return False

def validate_generalindx(book_path, verses):
    print(f"\n  {BOLD}generalindx.html links{RESET}")
    gi_path = os.path.join(book_path, 'special', 'generalindx.html')
    if not os.path.exists(gi_path):
        info("generalindx.html not found, skipping")
        return

    with open(gi_path, encoding='utf-8') as f:
        gi_content = f.read()

    upper_intro = gi_content.count("'INTRODUCTION'") + gi_content.count('"INTRODUCTION"')
    if upper_intro > 0:
        fail(f"Found {upper_intro} uppercase 'INTRODUCTION' in generalindx.html")
    else:
        ok("No uppercase INTRODUCTION found")

    links = re.findall(r'goToVerse\((\d+),\s*(\d+)\)', gi_content)
    ok(f"Total goToVerse links: {len(links)}")

    if not verses:
        info("Verse data not loaded — link check skipped")
        return

    broken = []
    for ch, v in links:
        ch_verses = verses.get(ch, [])
        if not ch_verses or not verse_exists(ch_verses, int(v)):
            broken.append(f"{ch}.{v}")

    if broken:
        caution(f"Potentially broken links ({len(broken)}): {broken[:10]}{'...' if len(broken) > 10 else ''}")
    else:
        ok("All goToVerse links appear valid")

# ── Main validator ───────────────────────────────────────────────────────────

def validate_book(root, book_id, status):
    book_path = os.path.join(root, 'books', book_id)
    print(f"\n{BOLD}{'=' * 60}{RESET}")
    print(f"{BOLD}Book: {book_id} [{status}]{RESET}")
    print(f"{BOLD}{'=' * 60}{RESET}")

    if not os.path.exists(book_path):
        fail(f"Book directory not found: {book_path}")
        return

    meta = validate_meta(root, book_path, book_id)
    book_type = meta.get('type', 'verses') if meta else 'verses'

    chapters = validate_chapters(book_path)

    # content.json — единый файл данных для любого типа книги
    data = validate_data(book_path, chapters, book_type)
    verses = data if (book_type == 'verses' and isinstance(data, dict)) else None

    validate_special(book_path, chapters)
    validate_generalindx(book_path, verses)

def main():
    root = sys.argv[1] if len(sys.argv) > 1 else '.'

    print(f"{BOLD}{'=' * 60}{RESET}")
    print(f"{BOLD}PRABHUPADA LIBRARY VALIDATOR{RESET}")
    print(f"{BOLD}Root: {os.path.abspath(root)}{RESET}")
    print(f"{BOLD}{'=' * 60}{RESET}")

    catalog = validate_catalog(root)

    for entry in catalog:
        validate_book(root, entry['id'], entry.get('status', '?'))

    print(f"\n{BOLD}{'=' * 60}{RESET}")
    print(f"{BOLD}SUMMARY{RESET}")
    if errors_total == 0 and warns_total == 0:
        print(f"{GREEN}{BOLD}All checks passed!{RESET}")
    else:
        if errors_total > 0:
            print(f"{RED}{BOLD}Errors: {errors_total}{RESET}")
        if warns_total > 0:
            print(f"{YELLOW}{BOLD}Warnings: {warns_total}{RESET}")
    print(f"{BOLD}{'=' * 60}{RESET}")

    sys.exit(1 if errors_total > 0 else 0)

if __name__ == '__main__':
    main()
