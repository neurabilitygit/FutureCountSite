#!/usr/bin/env python3
"""Notify IndexNow after the corresponding static release is publicly available."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
HOST = 'futurecountllc.com'
BASE = f'https://{HOST}/'
ENDPOINT = 'https://api.indexnow.org/indexnow'


def payload(root=ROOT):
    key = (root / 'indexnow-key.txt').read_text().strip()
    if not re.fullmatch(r'[a-f0-9]{32}', key):
        raise ValueError('Invalid IndexNow verification file')
    sitemap = ET.parse(root / 'sitemap.xml')
    urls = sorted({e.text for e in sitemap.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')})
    if not urls or len(urls) > 10000:
        raise ValueError('Expected between 1 and 10000 sitemap URLs')
    for url in urls:
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.netloc != HOST or parsed.query or parsed.fragment:
            raise ValueError('Sitemap contains a URL outside the canonical website')
    return {'host': HOST, 'key': key, 'keyLocation': BASE + 'indexnow-key.txt', 'urlList': urls}


def read_url(url):
    request = Request(url, headers={'User-Agent': 'FutureCount-IndexNow/1.0', 'Cache-Control': 'no-cache'})
    with urlopen(request, timeout=20) as response:
        return response.read()


def release_is_live(root=ROOT):
    # Compare all four changed pages and the ownership file, not just a successful HTTP status.
    for name in ('index.html', 'diagnostic.html', 'about.html', 'contact.html', 'indexnow-key.txt'):
        expected = (root / name).read_bytes()
        version = hashlib.sha256(expected).hexdigest()[:12]
        if read_url(BASE + name + '?indexnow-release=' + version) != expected:
            return False
    return True


def submit(data):
    request = Request(ENDPOINT, data=json.dumps(data).encode(), method='POST', headers={
        'Content-Type': 'application/json; charset=utf-8', 'User-Agent': 'FutureCount-IndexNow/1.0'})
    with urlopen(request, timeout=30) as response:
        status = response.status
        response.read()
    if status not in (200, 202):
        raise RuntimeError(f'Unexpected IndexNow response: HTTP {status}')
    print(json.dumps({'endpoint': ENDPOINT, 'http_status': status, 'urls_submitted': len(data['urlList']),
                      'result': 'received' if status == 200 else 'received; verification pending',
                      'indexing_guaranteed': False}, indent=2))
    return status


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-only', action='store_true')
    parser.add_argument('--wait-for-live', type=int, default=0)
    args = parser.parse_args()
    data = payload()
    if args.check_only:
        print(f'IndexNow configuration valid: {len(data["urlList"])} canonical URLs')
        return
    deadline = time.monotonic() + args.wait_for_live
    while True:
        try:
            ready = release_is_live()
        except (HTTPError, URLError, TimeoutError):
            ready = False
        if ready:
            break
        if time.monotonic() >= deadline:
            raise RuntimeError('This release is not yet live; no notification was sent')
        time.sleep(min(10, max(0, deadline - time.monotonic())))
    submit(data)


if __name__ == '__main__':
    main()
