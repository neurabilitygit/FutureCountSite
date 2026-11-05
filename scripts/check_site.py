#!/usr/bin/env python3
"""Dependency-free release checks for the static FutureCount website."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import json
import re
import sys
from urllib.parse import unquote, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
PAGES = ('index.html', 'diagnostic.html', 'about.html', 'contact.html',
         'privacy.html', 'terms.html', 'accessibility.html')
BOOKING = 'https://app.simplymeet.me/futurecount/futurecount-introductory-call'


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.nodes = []
        self.feed(source)

    def handle_starttag(self, tag, attributes):
        self.nodes.append((tag, dict(attributes)))

    def find(self, tag, **attributes):
        return [a for t, a in self.nodes if t == tag and all(a.get(k) == v for k, v in attributes.items())]


def check_site():
    failures = []
    checks = 0

    def check(condition, message):
        nonlocal checks
        checks += 1
        if not condition:
            failures.append(message)

    files = sorted(ROOT.rglob('*.html'))
    documents = {p.resolve(): Document(p.read_text()) for p in files}
    local_links = 0
    image_count = 0
    for path, document in documents.items():
        name = str(path.relative_to(ROOT))
        source = path.read_text()
        check(source.lower().startswith('<!doctype html>'), f'{name}: missing HTML doctype')
        check(bool(document.find('html', lang='en')), f'{name}: missing language')
        check(len(document.find('title')) == 1, f'{name}: expected one title')
        check(len(document.find('h1')) == 1, f'{name}: expected one h1')
        check(bool(document.find('meta', name='viewport')), f'{name}: missing viewport')
        ids = [a['id'] for _, a in document.nodes if 'id' in a]
        check(len(ids) == len(set(ids)), f'{name}: duplicate IDs')
        check(not re.search(r'private preview|live website unchanged|preview version|before publication|127\.0\.0\.1|localhost|/Users/', source, re.I), f'{name}: working-copy content remains')
        check(not re.search(r'rising\s*senior|risingsenior|operate as one|eric@|mailto:', source, re.I), f'{name}: retired or exposed-contact content remains')
        for tag, attrs in document.nodes:
            if tag == 'img':
                image_count += 1
                check('alt' in attrs, f'{name}: image missing alt')
                check('width' in attrs and 'height' in attrs, f'{name}: image missing dimensions')
            if tag == 'a' and attrs.get('target') == '_blank':
                check('noopener' in attrs.get('rel', '').split(), f'{name}: unsafe external tab')
            if tag == 'script':
                check(not urlsplit(attrs.get('src', '')).netloc, f'{name}: external script')
            for attr in ('href', 'src'):
                value = attrs.get(attr)
                if not value:
                    continue
                parsed = urlsplit(value)
                if parsed.scheme or parsed.netloc:
                    check(parsed.scheme == 'https', f'{name}: non-HTTPS resource {value}')
                    continue
                local_links += 1
                target = ((ROOT / parsed.path.lstrip('/')) if parsed.path.startswith('/') else (path.parent / parsed.path)) if parsed.path else path
                if target.is_dir():
                    target = target / 'index.html'
                target = target.resolve()
                check(target.is_relative_to(ROOT) and target.is_file(), f'{name}: missing local target {value}')
                if parsed.fragment and target in documents:
                    target_ids = [a.get('id') for _, a in documents[target].nodes]
                    check(unquote(parsed.fragment) in target_ids, f'{name}: missing fragment {value}')
        if name in PAGES:
            check(bool(document.find('meta', name='description')), f'{name}: missing description')
            check(bool(document.find('meta', name='robots', content='index,follow')), f'{name}: indexing disabled')
            expected = 'https://futurecountllc.com/' + ('' if name == 'index.html' else name)
            check(bool(document.find('link', rel='canonical', href=expected)), f'{name}: wrong canonical')
            check(bool(document.find('a', href='#main')), f'{name}: missing skip link')
            check(bool(document.find('main', id='main')), f'{name}: missing main landmark')
            check(bool(document.find('nav', id='navigation')), f'{name}: missing navigation')
            check(bool(document.find('button', **{'aria-controls': 'navigation', 'aria-expanded': 'false'})), f'{name}: menu missing state')
            for legal in ('privacy.html', 'terms.html', 'accessibility.html'):
                check(bool(document.find('a', href=legal)), f'{name}: missing {legal} footer link')
    for name in PAGES:
        check((ROOT / name).is_file(), f'Missing primary page {name}')
    contact = documents.get((ROOT / 'contact.html').resolve())
    check(bool(contact and contact.find('a', href=BOOKING)), 'Booking destination changed')
    check((ROOT / 'CNAME').read_text().strip() == 'futurecountllc.com', 'Custom domain changed')
    check((ROOT / '.nojekyll').is_file(), 'Missing .nojekyll')
    robots = (ROOT / 'robots.txt').read_text()
    check('Disallow: /' not in robots and 'Sitemap: https://futurecountllc.com/sitemap.xml' in robots, 'Invalid production robots')
    sitemap = ET.parse(ROOT / 'sitemap.xml')
    locations = {e.text for e in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
    expected_locations = {'https://futurecountllc.com/' + ('' if p == 'index.html' else p) for p in PAGES}
    check(locations == expected_locations, 'Sitemap does not match primary pages')
    css = (ROOT / 'assets/diagnostic.css').read_text()
    for resource in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css):
        check((ROOT / 'assets' / resource).is_file(), f'Missing CSS asset {resource}')
    check('prefers-reduced-motion' in css, 'Missing reduced-motion support')
    check(':focus-visible' in css, 'Missing visible keyboard focus')
    js = (ROOT / 'assets/navigation.js').read_text()
    check(not re.search(r'localStorage|sessionStorage|document\.cookie|fetch\(|XMLHttpRequest', js), 'Unexpected storage or network code')
    check((ROOT / 'assets/fonts/OFL.txt').is_file(), 'Missing font license')
    asset_bytes = sum(p.stat().st_size for p in (ROOT / 'assets').rglob('*') if p.is_file())
    check(asset_bytes < 2_000_000, f'Asset budget exceeded: {asset_bytes} bytes')
    check(not any('before-' in p.name or 'preview' in p.name or p.name.endswith('.zip') for p in ROOT.rglob('*') if '.git' not in p.parts), 'Working files included in release')
    result = {'checks': checks, 'passed': checks - len(failures), 'failures': failures,
              'html_files': len(files), 'primary_pages': len(PAGES), 'local_references': local_links,
              'image_instances': image_count, 'asset_bytes': asset_bytes}
    print(json.dumps(result, indent=2))
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(check_site())
