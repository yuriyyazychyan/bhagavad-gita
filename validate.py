#!/usr/bin/env python3
"""
Prabhupada Library Validator
Проверяет целостность всех книг в библиотеке.

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
from pathlib import Path

# ── Цвета для вывода ────────────────────────────────────────────────────────
GREEN  = '\033[92m'
YELLOW = '\033[93m'
RED    = '\033[91m'
BLUE   = '\033[94m'
RESET  = '\033[0m'
BOLD   = '\033[1m'

def ok(msg):    print(f"  {GREEN}✓{RESET} {msg}")
def warn(msg):  print(f"  {YELLOW}⚠{RESET} {msg}")
def error(msg): print(f"  {RED}✗{RESET} {msg}")
def info(msg):  print(f"  {BLUE}→{RESET} {msg}")

errors_total = 0
warns_total  = 0

def count_error(): global errors_total; errors_total += 1
def count_warn():  global warns_total;  warns_total  += 1

# ── Helpers ──────────────────────────────────────────────────────────────────

def load_json(path):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f), None
    except FileNotFoundError:
        return None, f"File not found: {path}"
    except json.JSONDecodeError as e:
        return None, f"JSON parse error in {path}: {e}"

def check_file_exists(path, label):
    if os.path.exists(path):
        ok(f"{label} exists")
        return True
    else:
        error(f"{label} missing: {path}")
        count_error()
        return False

# ── Validate catalog.json ────────────────────────────────────────────────────

def validate_catalog(root):
    print(f"\n{BOLD}=== catalog.json ==={RESET}")
    catalog_path = os.path.join(root, 'books', 'catalog.json')
    catalog, err = load_json(catalog_path)
    if err:
        error(err); count_error(); return []

    ok(f"catalog.json loaded — {len(catalog)} books")
    valid_books = []

    for entry in catalog:
        bid    = entry.get('id', '?')
        status = entry.get('status', '?')
        if not entry.get('id'):
            error(f"Entry missing 'id': {entry}")
            count_error()
            continue
        if status not in ('published', 'draft'):
            warn(f"Book '{bid}' has unknown status: '{status}'")
            count_warn()
        else:
            info(f"Book '{bid}' [{status}]")
        valid_books.append(entry)

    return valid_books

# ── Validate meta.json ───────────────────────────────────────────────────────

REQUIRED_META_FIELDS = ['id', 'title', 'author', 'year', 'type', 'status']
VALID_TYPES = ['verses', 'chapters']

def validate_meta(book_path, book_id):
    print(f"\n  {BOLD}meta.json{RESET}")
    meta_path = os.path.join(book_path, 'meta.json')
    meta, err = load_json(meta_path)
    if err:
        error(err); count_error(); return None

    ok("meta.json loaded")

    # Required fields
    for field in REQUIRED_META_FIELDS:
        if field not in meta:
            error(f"Missing required field: '{field}'")
            count_error()
        else:
            ok(f"Field '{field}': {meta[field]}")

    # id matches folder name
    if meta.get('id') != book_id:
        error(f"meta.id '{meta.get('id')}' doesn't match folder name '{book_id}'")
        count_error()

    # type is valid
    if meta.get('type') not in VALID_TYPES:
        error(f"Invalid type: '{meta.get('type')}'. Must be one of: {VALID_TYPES}")
        count_error()

    # Optional but recommended
    for field in ['cover', 'shortTitle', 'lang', 'description']:
        if field not in meta:
            warn(f"Recommended field missing: '{field}'")
            count_warn()

    # Check cover image(s) exist
    covers = meta.get('covers') or ([meta['cover']] if meta.get('cover') else [])
    if covers:
        for cover in covers:
            cover_path = os.path.join(root_global, cover)
            if os.path.exists(cover_path):
                ok(f"Cover found: {cover}")
            else:
                warn(f"Cover image not found: {cover}")
                count_warn()
    else:
        # Auto-detect: look for cover.jpg in img/book&cover/
        book_id = meta.get('id', '')
        auto_cover = os.path.join(root_global, 'books', book_id, 'img', 'book&cover', 'cover.jpg')
        if os.path.exists(auto_cover):
            ok(f"Cover auto-detected: img/book&cover/cover.jpg")
        else:
            warn(f"No cover image found (checked img/book&cover/cover.jpg)")
            count_warn()

    return meta

# ── Validate chapters.json ───────────────────────────────────────────────────

def validate_chapters(book_path, book_type):
    print(f"\n  {BOLD}chapters.json{RESET}")
    path = os.path.join(book_path, 'data', 'chapters.json')
    chapters, err = load_json(path)
    if err:
        error(err); count_error(); return None

    ok(f"chapters.json loaded — {len(chapters)} entries")

    numeric_chapters = []
    string_chapters  = []

    for ch in chapters:
        n = ch.get('n')
        if n is None:
            error(f"Chapter missing 'n' field: {ch}")
            count_error()
            continue
        if not ch.get('en') and not ch.get('ru'):
            warn(f"Chapter {n} has no title (en or ru)")
            count_warn()
        if isinstance(n, int):
            numeric_chapters.append(n)
        else:
            string_chapters.append(str(n))

    ok(f"Numeric chapters: {len(numeric_chapters)}")
    info(f"Special sections: {string_chapters}")

    # Check for duplicate n values
    dupes = [n for n in numeric_chapters if numeric_chapters.count(n) > 1]
    if dupes:
        error(f"Duplicate chapter numbers: {list(set(dupes))}")
        count_error()
    else:
        ok("No duplicate chapter numbers")

    # Check sequential
    sorted_nums = sorted(numeric_chapters)
    expected = list(range(1, len(sorted_nums) + 1))
    gaps = [n for n in expected if n not in sorted_nums]
    if gaps:
        warn(f"Missing chapter numbers: {gaps}")
        count_warn()

    return chapters

# ── Validate verses.json ─────────────────────────────────────────────────────

def validate_verses(book_path, chapters):
    print(f"\n  {BOLD}verses.json{RESET}")
    path = os.path.join(book_path, 'data', 'verses.json')
    verses, err = load_json(path)
    if err:
        warn(f"verses.json not found (ok for chapter-type books)"); count_warn(); return None

    numeric_chapters = [ch['n'] for ch in (chapters or []) if isinstance(ch.get('n'), int)]
    total_verses = 0
    issues = []

    for ch_num in numeric_chapters:
        ch_verses = verses.get(str(ch_num), [])
        if not ch_verses:
            error(f"Chapter {ch_num} has no verses in verses.json")
            count_error()
            continue

        total_verses += len(ch_verses)
        verse_nums = [v.get('n') for v in ch_verses]

        # Check required fields
        for v in ch_verses:
            vn = v.get('n')
            if vn is None:
                issues.append(f"Ch{ch_num}: verse missing 'n'")
                continue
            # Check at least one language has content
            has_content = any([
                v.get('pur_en'), v.get('pur_ru'),
                v.get('tr_en'),  v.get('tr_ru'),
                v.get('tr')
            ])
            if not has_content:
                issues.append(f"Ch{ch_num}.{vn}: no content in any field")

        # Check for duplicate verse numbers
        dupes = [n for n in verse_nums if verse_nums.count(n) > 1]
        if dupes:
            issues.append(f"Ch{ch_num}: duplicate verse numbers {list(set(dupes))}")

    ok(f"verses.json loaded — {total_verses} total verses")

    if issues:
        print(f"\n  {YELLOW}Issues found:{RESET}")
        for issue in issues[:20]:  # limit output
            warn(issue)
            count_warn()
        if len(issues) > 20:
            warn(f"... and {len(issues) - 20} more")
    else:
        ok("No verse issues found")

    # Validate range labels
    range_count = 0
    for ch_str, ch_verses in verses.items():
        for v in ch_verses:
            if v.get('nLabel'):
                range_count += 1
                label = str(v['nLabel']).replace('–', '-').replace('—', '-')
                parts = label.split('-')
                if len(parts) == 2:
                    try:
                        start, end = int(parts[0]), int(parts[1])
                        if start >= end:
                            warn(f"Ch{ch_str}.{v['n']}: invalid range '{v['nLabel']}'")
                            count_warn()
                        if v['n'] != start:
                            warn(f"Ch{ch_str}.{v['n']}: n={v['n']} but nLabel starts at {start}")
                            count_warn()
                    except ValueError:
                        warn(f"Ch{ch_str}.{v['n']}: unparseable nLabel '{v['nLabel']}'")
                        count_warn()

    info(f"Verse ranges (nLabel): {range_count}")
    return verses

# ── Validate content.json ────────────────────────────────────────────────────

def validate_content(book_path, chapters):
    print(f"\n  {BOLD}content.json{RESET}")
    path = os.path.join(book_path, 'data', 'content.json')
    content, err = load_json(path)
    if err:
        info("content.json not present (ok for verse-type books)")
        return None

    numeric_chapters = [ch['n'] for ch in (chapters or []) if isinstance(ch.get('n'), int)]
    ok(f"content.json loaded — {len(content)} chapters")

    empty_chapters = []
    for ch_num in numeric_chapters:
        paras = content.get(str(ch_num), [])
        if not paras:
            empty_chapters.append(ch_num)
        else:
            # Check paragraph structure
            for i, para in enumerate(paras):
                if not para.get('text_en') and not para.get('text_ru'):
                    warn(f"Ch{ch_num} para {i}: no text_en or text_ru")
                    count_warn()

    if empty_chapters:
        warn(f"Chapters with no content: {empty_chapters}")
        count_warn()
    else:
        ok("All chapters have content")

    return content

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
        else:
            # Check children
            if ch.get('children'):
                for child in ch['children']:
                    child_file = f"{str(child.get('n','')).lower()}.html"
                    if child_file in found_files:
                        ok(f"special/{child_file}")
                    else:
                        error(f"Missing: special/{child_file}")
                        count_error()
            else:
                error(f"Missing: special/{expected_file}")
                count_error()

    # Check for UPPERCASE filenames (Linux case-sensitive issue)
    all_files = os.listdir(special_dir)
    uppercase = [f for f in all_files if f != f.lower() and f.endswith('.html')]
    if uppercase:
        error(f"UPPERCASE filenames (will break on Linux): {uppercase}")
        count_error()
    else:
        ok("All filenames are lowercase")

# ── Validate generalidx links ────────────────────────────────────────────────

def validate_generalidx(book_path, verses):
    print(f"\n  {BOLD}generalidx.html links{RESET}")
    gi_path = os.path.join(book_path, 'special', 'generalindx.html')
    if not os.path.exists(gi_path):
        info("generalidx.html not found, skipping")
        return

    with open(gi_path, encoding='utf-8') as f:
        gi_content = f.read()

    # Check for INTRODUCTION uppercase
    upper_intro = gi_content.count("'INTRODUCTION'") + gi_content.count('"INTRODUCTION"')
    if upper_intro > 0:
        error(f"Found {upper_intro} uppercase 'INTRODUCTION' in generalidx.html")
        count_error()
    else:
        ok("No uppercase INTRODUCTION found")

    # Check goToVerse links
    links = re.findall(r'goToVerse\((\d+),\s*(\d+)\)', gi_content)
    broken = []
    if verses:
        for ch, v in links:
            ch_verses = verses.get(ch, [])
            if not ch_verses:
                broken.append(f"{ch}.{v}")
                continue
            # Try resolving
            found = any(
                str(x['n']) == v or
                (x.get('nLabel') and
                 str(x['n']) <= v <=
                 str(x['nLabel']).replace('–','-').split('-')[-1])
                for x in ch_verses
            )
            if not found:
                broken.append(f"{ch}.{v}")

    ok(f"Total goToVerse links: {len(links)}")
    if broken:
        warn(f"Potentially broken links ({len(broken)}): {broken[:10]}{'...' if len(broken)>10 else ''}")
        count_warn()
    else:
        ok("All goToVerse links appear valid")

# ── Main validator ───────────────────────────────────────────────────────────

root_global = '.'

def validate_book(root, book_id, status):
    book_path = os.path.join(root, 'books', book_id)
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}Book: {book_id} [{status}]{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

    if not os.path.exists(book_path):
        error(f"Book directory not found: {book_path}")
        count_error()
        return

    # meta.json
    meta = validate_meta(book_path, book_id)
    book_type = meta.get('type', 'verses') if meta else 'verses'

    # chapters.json
    chapters = validate_chapters(book_path, book_type)

    # verses.json (only for verse-type)
    verses = None
    if book_type == 'verses':
        verses = validate_verses(book_path, chapters)
    else:
        # content.json for chapter-type
        validate_content(book_path, chapters)

    # special/ sections
    validate_special(book_path, chapters)

    # generalidx if present
    validate_generalidx(book_path, verses)

def main():
    global root_global
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    root_global = root

    print(f"{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}PRABHUPADA LIBRARY VALIDATOR{RESET}")
    print(f"{BOLD}Root: {os.path.abspath(root)}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

    # Validate catalog
    catalog = validate_catalog(root)

    # Validate each book
    for entry in catalog:
        validate_book(root, entry['id'], entry.get('status', '?'))

    # Summary
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}SUMMARY{RESET}")
    if errors_total == 0 and warns_total == 0:
        print(f"{GREEN}{BOLD}All checks passed!{RESET}")
    else:
        if errors_total > 0:
            print(f"{RED}{BOLD}Errors:   {errors_total}{RESET}")
        if warns_total > 0:
            print(f"{YELLOW}{BOLD}Warnings: {warns_total}{RESET}")
    print(f"{BOLD}{'='*60}{RESET}")

    sys.exit(1 if errors_total > 0 else 0)

if __name__ == '__main__':
    main()
