#!/usr/bin/env python3
"""Validate factual identity markup, discovery metadata and IndexNow configuration."""
from html import unescape
import json
from pathlib import Path
import re
from notify_indexnow import payload

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://futurecountllc.com/'
APPROVED_EMAIL = 'eric@futurecountllc.com'
EXPECTED = {
    'index.html': 'FutureCount | CFO and Sale-Readiness Advice for Owners and CEOs',
    'diagnostic.html': 'How I Work: Deep-Dive & Direction and Sale Readiness | FutureCount',
    'about.html': 'Eric Bass | Founder & Managing Partner | FutureCount',
    'contact.html': 'Talk with Eric Bass | FutureCount',
}


def main():
    assertions = 0

    def check(value, message):
        nonlocal assertions
        assertions += 1
        if not value:
            raise AssertionError(message)

    for name, title in EXPECTED.items():
        text = (ROOT / name).read_text()
        check(unescape(re.search(r'<title>(.*?)</title>', text).group(1)) == title, name + ': title')
        scripts = re.findall(r'<script type="application/ld\+json">(.*?)</script>', text, re.S)
        check(len(scripts) == 1, name + ': one JSON-LD block')
        schema = json.loads(scripts[0])
        check(schema.get('@context') == 'https://schema.org', name + ': schema context')
        entities = schema['@graph']
        by_id = {e['@id']: e for e in entities}
        check(len(by_id) == len(entities), name + ': unique identity IDs')
        org = by_id[BASE + '#organization']
        person = by_id[BASE + 'about.html#eric-bass']
        check(org['legalName'] == 'FutureCount Holdings LLC', name + ': legal entity')
        check(person['name'] == 'Eric Bass', name + ': founder')
        check(org['founder']['@id'] == person['@id'], name + ': founder connection')
        check('worksFor' not in person, name + ': client employers kept confidential')
        check(person['jobTitle'] == 'Chief Financial Officer', name + ': exact title')
        fields = re.findall(r'"(email|telephone|address)"\s*:\s*"([^"]*)"', scripts[0])
        check(all(k == 'email' and v == APPROVED_EMAIL for k, v in fields), name + ': unapproved contact details')
        check('<meta name="robots" content="index,follow">' in text, name + ': indexing enabled')
        if name == 'diagnostic.html':
            check(any(e['@type'] == 'Service' for e in entities), name + ': service identity')
    check('<meta name="msvalidate.01" content="5567235F49EF43552337FC29DB1E0E0D">' in (ROOT / 'index.html').read_text(), 'Bing verification tag')
    data = payload()
    check(len(data['urlList']) == 7, 'IndexNow has seven canonical pages')
    check(data['keyLocation'] == BASE + 'indexnow-key.txt', 'Correct IndexNow proof location')
    check('User-agent: *\nAllow: /' in (ROOT / 'robots.txt').read_text(), 'Crawler access preserved')
    print(f'{assertions} discovery checks passed')


if __name__ == '__main__':
    main()
