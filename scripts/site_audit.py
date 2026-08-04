#!/usr/bin/env python3
"""Audit a static website before publishing it for SEO and AdSense.

Uses only the Python standard library. It never clicks ads, creates backlinks,
or sends traffic. Exit status is 1 when blocking errors are found.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse


ADSENSE_ID = "ca-pub-4489946300243174"
DEFAULT_ORIGIN = "https://haowordtool.com"
REQUIRED_FILES = ("ads.txt", "robots.txt", "sitemap.xml", "privacy.html", "terms.html")


@dataclass
class Finding:
    level: str
    code: str
    path: str
    message: str


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.description = ""
        self.canonical = ""
        self.robots = ""
        self.hreflangs: list[tuple[str, str]] = []
        self.links: list[str] = []
        self.h1_count = 0
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key.lower(): value or "" for key, value in attrs}
        tag = tag.lower()
        if tag == "title":
            self._in_title = True
        elif tag == "meta" and data.get("name", "").lower() == "description":
            self.description = data.get("content", "").strip()
        elif tag == "meta" and data.get("name", "").lower() == "robots":
            self.robots = data.get("content", "").lower()
        elif tag == "link" and "canonical" in data.get("rel", "").lower().split():
            self.canonical = data.get("href", "").strip()
        elif tag == "link" and "alternate" in data.get("rel", "").lower().split():
            if data.get("hreflang"):
                self.hreflangs.append((data["hreflang"].lower(), data.get("href", "")))
        elif tag == "a" and data.get("href"):
            self.links.append(data["href"].strip())
        elif tag == "h1":
            self.h1_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data


def public_path(root: Path, file: Path) -> str:
    relative = file.relative_to(root).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")]
    return "/" + relative


def target_file(root: Path, source: Path, href: str) -> Path | None:
    parsed = urlparse(href)
    if parsed.scheme or parsed.netloc or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    path = parsed.path
    if not path:
        return None
    target = root / path.lstrip("/") if path.startswith("/") else source.parent / path
    if path.endswith("/"):
        target /= "index.html"
    return target.resolve()


def audit_local(root: Path) -> list[Finding]:
    findings: list[Finding] = []
    html_files = sorted(root.rglob("*.html"))

    for required in REQUIRED_FILES:
        if not (root / required).is_file():
            findings.append(Finding("ERROR", "required-file", required, "Required trust or discovery file is missing."))

    ads_txt = root / "ads.txt"
    if ads_txt.is_file() and "pub-4489946300243174" not in ads_txt.read_text(encoding="utf-8"):
        findings.append(Finding("ERROR", "ads-txt", "ads.txt", "Publisher ID is missing or incorrect."))

    known_public_paths = {public_path(root, file) for file in html_files}
    for file in html_files:
        relative = file.relative_to(root).as_posix()
        text = file.read_text(encoding="utf-8")
        parser = PageParser()
        parser.feed(text)
        parser.title = re.sub(r"\s+", " ", parser.title).strip()

        if not parser.title:
            findings.append(Finding("ERROR", "title", relative, "Missing page title."))
        elif not 15 <= len(parser.title) <= 65:
            findings.append(Finding("WARN", "title-length", relative, f"Title length is {len(parser.title)}; target roughly 15-65 characters."))
        is_noindex = "noindex" in parser.robots
        contains_cjk = bool(re.search(r"[\u3040-\u30ff\u3400-\u9fff]", parser.description))
        description_minimum = 40 if contains_cjk else 70
        if not parser.description and not is_noindex:
            findings.append(Finding("WARN", "description", relative, "Missing meta description."))
        elif parser.description and not description_minimum <= len(parser.description) <= 170:
            findings.append(Finding("WARN", "description-length", relative, f"Description length is {len(parser.description)}; target roughly {description_minimum}-170 characters."))
        if not parser.canonical:
            findings.append(Finding("WARN", "canonical", relative, "Missing canonical URL."))
        elif not parser.canonical.startswith(DEFAULT_ORIGIN + "/"):
            findings.append(Finding("ERROR", "canonical-origin", relative, f"Canonical points outside {DEFAULT_ORIGIN}."))
        if parser.h1_count != 1 and not is_noindex:
            findings.append(Finding("WARN", "h1", relative, f"Expected one H1; found {parser.h1_count}."))

        loaders = text.count("pagead2.googlesyndication.com/pagead/js/adsbygoogle.js")
        if relative not in {"privacy.html", "terms.html", "word.html", "share.html"}:
            if ADSENSE_ID not in text:
                findings.append(Finding("WARN", "adsense-code", relative, "AdSense publisher code is absent."))
            if loaders > 1:
                findings.append(Finding("ERROR", "duplicate-adsense", relative, f"AdSense loader occurs {loaders} times."))

        for href in parser.links:
            target = target_file(root, file, href)
            if target is not None and root.resolve() in target.parents and not target.exists():
                findings.append(Finding("ERROR", "broken-link", relative, f"Internal link does not exist: {href}"))

        if relative in {"index.html", "zh/index.html", "fr/index.html", "es/index.html", "ja/index.html"}:
            languages = {language for language, _ in parser.hreflangs}
            missing = {"en", "zh", "fr", "es", "ja", "x-default"} - languages
            if missing:
                findings.append(Finding("WARN", "hreflang", relative, "Missing hreflang values: " + ", ".join(sorted(missing))))

    sitemap = root / "sitemap.xml"
    if sitemap.is_file():
        try:
            tree = ET.parse(sitemap)
            namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
            locations = [node.text or "" for node in tree.findall("sm:url/sm:loc", namespace)]
            if len(locations) != len(set(locations)):
                findings.append(Finding("ERROR", "sitemap-duplicate", "sitemap.xml", "Duplicate URLs are present."))
            for location in locations:
                parsed = urlparse(location)
                if parsed.netloc != urlparse(DEFAULT_ORIGIN).netloc:
                    findings.append(Finding("ERROR", "sitemap-origin", "sitemap.xml", f"Unexpected URL: {location}"))
                elif parsed.path not in known_public_paths and parsed.path != "/":
                    findings.append(Finding("ERROR", "sitemap-target", "sitemap.xml", f"URL has no local HTML file: {location}"))
        except ET.ParseError as error:
            findings.append(Finding("ERROR", "sitemap-xml", "sitemap.xml", str(error)))

    return findings


def audit_live(origin: str, timeout: float) -> list[Finding]:
    findings: list[Finding] = []
    for path in ("/", "/ads.txt", "/robots.txt", "/sitemap.xml", "/privacy.html", "/terms.html"):
        url = urljoin(origin.rstrip("/") + "/", path.lstrip("/"))
        request = urllib.request.Request(url, headers={"User-Agent": "HaowordtoolSiteAudit/1.0"})
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                if response.status != 200:
                    findings.append(Finding("ERROR", "live-status", path, f"HTTP {response.status}"))
        except (urllib.error.URLError, TimeoutError) as error:
            findings.append(Finding("ERROR", "live-request", path, str(error)))
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--live", action="store_true", help="Also check important production URLs.")
    parser.add_argument("--origin", default=DEFAULT_ORIGIN)
    parser.add_argument("--timeout", type=float, default=10.0)
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON.")
    args = parser.parse_args()

    root = args.root.resolve()
    findings = audit_local(root)
    if args.live:
        findings.extend(audit_live(args.origin, args.timeout))

    errors = sum(item.level == "ERROR" for item in findings)
    warnings = sum(item.level == "WARN" for item in findings)
    result = {"root": str(root), "errors": errors, "warnings": warnings, "findings": [asdict(item) for item in findings]}
    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        for item in findings:
            print(f"{item.level:5} {item.code:22} {item.path}: {item.message}")
        print(f"\nAudit complete: {errors} error(s), {warnings} warning(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
