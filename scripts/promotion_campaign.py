#!/usr/bin/env python3
"""Generate localized, trackable promotion drafts for HaoWordTool.

This script prepares posts and a campaign log. It deliberately does not log in,
post automatically, evade moderation, or create backlinks in bulk.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import date
from pathlib import Path
from urllib.parse import urlencode


BASE_URL = "https://haowordtool.com"


def configure_console() -> None:
    """Use UTF-8 for multilingual output on Windows PowerShell."""
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure:
            reconfigure(encoding="utf-8", errors="replace")


@dataclass(frozen=True)
class Draft:
    language: str
    language_name: str
    path: str
    title: str
    body: str


DRAFTS = {
    "zh": Draft(
        "zh",
        "中文",
        "/zh/",
        "我做了一个中文界面的免费英文单词重排工具，想听听大家的建议",
        """大家好，我做了一个面向英语学习和英文单词游戏的免费工具 HaoWordTool。输入乱序字母后，可以查找可能的英文单词，并查看定义、发音和拼字游戏分数；支持最多 15 个字母，以及 ?、* 通配符。

我刚完成中文界面，希望听听英语学习者和 Wordle/字谜玩家的真实反馈：搜索是否准确、手机使用是否方便、还缺少什么筛选功能？

工具：{url}

说明：工具查找的是英文单词，界面为中文。如果本社区不允许分享个人项目，请管理员删除，也欢迎直接指出。""",
    ),
    "fr": Draft(
        "fr",
        "Français",
        "/fr/",
        "J’ai créé un outil gratuit pour trouver des mots anglais à partir de lettres — vos avis ?",
        """Bonjour ! J’ai créé HaoWordTool, un petit outil gratuit destiné aux personnes qui apprennent l’anglais ou jouent à Wordle et à d’autres jeux de lettres en anglais. On saisit des lettres mélangées et l’outil propose des mots possibles, avec définition, prononciation et score de type Scrabble. Les jokers ? et * sont acceptés.

Je viens de terminer l’interface française et je cherche surtout des retours honnêtes : les explications sont-elles claires ? L’utilisation sur mobile est-elle pratique ? Quels filtres seraient réellement utiles ?

Lien : {url}

Il s’agit bien d’un solveur de mots anglais avec une interface française. Si l’auto-promotion n’est pas autorisée ici, je retirerai volontiers le lien.""",
    ),
    "es": Draft(
        "es",
        "Español",
        "/es/",
        "Creé una herramienta gratuita para formar palabras en inglés con letras desordenadas — busco opiniones",
        """¡Hola! He creado HaoWordTool, una herramienta gratuita para estudiantes de inglés y aficionados a Wordle y otros juegos de palabras en inglés. Introduces letras desordenadas y muestra palabras posibles, definiciones, pronunciación y puntuación tipo Scrabble. También admite los comodines ? y *.

Acabo de terminar la interfaz en español y me gustaría recibir comentarios sinceros: ¿se entiende bien?, ¿funciona cómodamente en el móvil?, ¿qué filtros serían útiles de verdad?

Enlace: {url}

Aclaro que busca palabras inglesas, aunque la interfaz está en español. Si este tipo de publicación no está permitido, retiraré el enlace.""",
    ),
    "ja": Draft(
        "ja",
        "日本語",
        "/ja/",
        "英語の文字を並べ替えて単語を探す無料ツールを作りました（日本語UI）",
        """こんにちは。英語学習者や英語版 Wordle、英単語パズル向けに、無料の HaoWordTool を作りました。バラバラのアルファベットを入力すると、候補となる英単語、意味、発音、Scrabble 形式のスコアを表示します。? と * のワイルドカードにも対応しています。

日本語インターフェースを公開したので、説明の分かりやすさ、スマートフォンでの使いやすさ、欲しい絞り込み機能について率直なご意見をいただけるとうれしいです。

リンク：{url}

検索対象は英単語で、画面表示が日本語です。宣伝投稿が禁止されている場合はリンクを削除します。""",
    ),
}


def slug(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9_-]+", "-", value.lower()).strip("-")
    if not cleaned:
        raise ValueError("source and campaign must contain letters or numbers")
    return cleaned


def tracked_url(draft: Draft, source: str, campaign: str) -> str:
    query = urlencode(
        {
            "utm_source": slug(source),
            "utm_medium": "referral",
            "utm_campaign": slug(campaign),
            "utm_content": draft.language,
        }
    )
    return f"{BASE_URL}{draft.path}?{query}"


def render(draft: Draft, source: str, campaign: str) -> dict[str, str]:
    url = tracked_url(draft, source, campaign)
    return {
        **asdict(draft),
        "source": source,
        "campaign": campaign,
        "url": url,
        "body": draft.body.format(url=url),
    }


def write_markdown(items: list[dict[str, str]], output: Path) -> None:
    sections = ["# HaoWordTool promotion drafts", ""]
    for item in items:
        sections.extend(
            [
                f"## {item['language_name']}",
                "",
                f"**{item['title']}**",
                "",
                item["body"],
                "",
                "---",
                "",
            ]
        )
    output.write_text("\n".join(sections), encoding="utf-8")


def create_log(items: list[dict[str, str]], output: Path) -> None:
    fields = [
        "date",
        "language",
        "platform",
        "community",
        "post_url",
        "target_url",
        "status",
        "rule_checked",
        "visits",
        "notes",
    ]
    with output.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for item in items:
            writer.writerow(
                {
                    "date": date.today().isoformat(),
                    "language": item["language"],
                    "platform": item["source"],
                    "community": "",
                    "post_url": "",
                    "target_url": item["url"],
                    "status": "draft",
                    "rule_checked": "no",
                    "visits": 0,
                    "notes": "Check community rules before posting.",
                }
            )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate localized HaoWordTool promotion drafts and UTM links."
    )
    parser.add_argument(
        "--language",
        choices=["all", *DRAFTS],
        default="all",
        help="Draft language; default: all.",
    )
    parser.add_argument(
        "--source",
        default="community",
        help="UTM source/platform, for example reddit, v2ex or zenn.",
    )
    parser.add_argument("--campaign", default="community-launch")
    parser.add_argument("--format", choices=["text", "json"], default="text")
    parser.add_argument("--output", type=Path, help="Write drafts to a Markdown or JSON file.")
    parser.add_argument("--log", type=Path, help="Create a UTF-8 CSV campaign log.")
    return parser.parse_args()


def main() -> int:
    configure_console()
    args = parse_args()
    selected = DRAFTS.values() if args.language == "all" else [DRAFTS[args.language]]
    try:
        items = [render(item, args.source, args.campaign) for item in selected]
    except ValueError as error:
        print(f"error: {error}", file=sys.stderr)
        return 2

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        if args.format == "json" or args.output.suffix.lower() == ".json":
            args.output.write_text(
                json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8"
            )
        else:
            write_markdown(items, args.output)
        print(f"Drafts written to {args.output}")
    elif args.format == "json":
        print(json.dumps(items, ensure_ascii=False, indent=2))
    else:
        for item in items:
            print(f"\n[{item['language_name']}] {item['title']}\n")
            print(item["body"])

    if args.log:
        args.log.parent.mkdir(parents=True, exist_ok=True)
        create_log(items, args.log)
        print(f"Campaign log written to {args.log}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
