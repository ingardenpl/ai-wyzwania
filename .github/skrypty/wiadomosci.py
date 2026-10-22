"""Pasek „SIEĆ · AI na świecie”: pobiera najnowsze artykuły o AI z kanałów RSS/Atom i zapisuje wiadomosci.json.

Użycie:  python tools/wiadomosci.py ŚCIEŻKA/wiadomosci.json
Uruchamiany codziennie przez GitHub Actions w repozytorium publikacji (ingardenpl/ai-wyzwania,
.github/workflows/wiadomosci.yml); lokalnie tylko do podglądu. Tylko biblioteka standardowa Pythona.
Kanały sprawdzone 22.10.2026. Kanały mieszane (flaga True: m.in. strategia cyfrowa UE, Computerworld, Legalis,
Panoptykon, a także działy AI serwisów, w których trafiają się wpisy ogólne) przechodzą przez filtr słów kluczowych w tytule.
"""
from __future__ import annotations

import datetime as dt
import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

KANALY = [
    # (nazwa, adres, język, czy filtrować słowami kluczowymi)
    ("MIT Technology Review", "https://www.technologyreview.com/topic/artificial-intelligence/feed", "en", False),
    ("Ars Technica", "https://arstechnica.com/ai/feed/", "en", True),
    ("The Verge", "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "en", True),
    ("The Guardian", "https://www.theguardian.com/technology/artificialintelligenceai/rss", "en", True),
    ("Nature", "https://www.nature.com/subjects/machine-learning.rss", "en", False),
    ("AI Now Institute", "https://ainowinstitute.org/feed", "en", False),
    ("Komisja Europejska", "https://digital-strategy.ec.europa.eu/en/rss.xml", "en", True),
    ("One Useful Thing", "https://www.oneusefulthing.org/feed", "en", False),
    ("Computerworld", "https://www.computerworld.pl/feed/", "pl", True),
    ("Legalis", "https://legalis.pl/feed/", "pl", True),
    ("Panoptykon", "https://panoptykon.org/rss.xml", "pl", True),
]
AI = re.compile(r"\b(AI|A\.I\.|SI|GenAI|LLM\w*|AGI|ChatGPT|OpenAI|Anthropic|Claude|Gemini|DeepMind|Copilot|Bielik|PLLuM|"
                r"sztuczn\w* inteligencj\w*|artificial intelligence|machine learning|uczeni\w* maszynow\w*|"
                r"model\w* językow\w*|language model\w*|chatbot\w*|algorytm\w*|algorithm\w*|AI Act|deepfake\w*|"
                r"neural|sieci? neuronow\w*|automatyzacj\w*)\b", re.I)
DNI = 21
NA_ZRODLO = 4
RAZEM = 30
NS = {"atom": "http://www.w3.org/2005/Atom"}


def tekst(x: str | None) -> str:
    x = html.unescape(re.sub(r"<[^>]+>", " ", x or ""))
    return re.sub(r"\s+", " ", x).strip()


def data(s: str | None) -> dt.datetime | None:
    if not s:
        return None
    s = s.strip()
    try:
        d = email.utils.parsedate_to_datetime(s)
    except (TypeError, ValueError):
        try:
            d = dt.datetime.fromisoformat(s.replace("Z", "+00:00"))
        except ValueError:
            return None
    return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)


def pobierz(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (NEO-LUBLIN 2049; kurs WPiA UMCS; pasek wiadomosci)"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read()


def wpisy(xml: bytes):
    root = ET.fromstring(xml)
    for it in root.iter("item"):               # RSS 2.0
        yield (tekst(it.findtext("title")), (it.findtext("link") or "").strip(),
               it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date"), tekst(it.findtext("description")))
    for it in root.iter("{http://www.w3.org/2005/Atom}entry"):   # Atom
        link = ""
        for l in it.findall("atom:link", NS):
            if l.get("rel", "alternate") == "alternate":
                link = l.get("href", ""); break
        yield (tekst(it.findtext("atom:title", namespaces=NS)), link,
               it.findtext("atom:updated", namespaces=NS) or it.findtext("atom:published", namespaces=NS),
               tekst(it.findtext("atom:summary", namespaces=NS)))


def main(cel: str) -> int:
    teraz = dt.datetime.now(dt.timezone.utc)
    wszystkie, bledy = [], []
    for nazwa, url, jezyk, filtr in KANALY:
        try:
            n = 0
            for t, link, d, opis in wpisy(pobierz(url)):
                dd = data(d)
                if not t or not link.startswith(("http://", "https://")) or not dd or (teraz - dd).days > DNI:
                    continue
                if filtr and not AI.search(t):   # w kanałach mieszanych tytuł musi dotyczyć AI
                    continue
                wszystkie.append({"t": t[:200], "u": link, "z": nazwa, "d": dd.astimezone(dt.timezone.utc).strftime("%Y-%m-%d"), "j": jezyk, "_s": dd.timestamp()})
                n += 1
                if n >= NA_ZRODLO:
                    break
        except Exception as e:   # jeden niedziałający kanał nie zatrzymuje reszty
            bledy.append(f"{nazwa}: {type(e).__name__}")
    widziane, wynik = set(), []
    for w in sorted(wszystkie, key=lambda x: -x["_s"]):
        klucz = w["t"].lower()
        if klucz in widziane:
            continue
        widziane.add(klucz)
        w.pop("_s")
        wynik.append(w)
    wynik = wynik[:RAZEM]
    dane = {"aktualizacja": teraz.strftime("%Y-%m-%dT%H:%MZ"), "wpisy": wynik, "bledy": bledy}
    with open(cel, "w", encoding="utf-8", newline="\n") as f:
        json.dump(dane, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"Wiadomości: {len(wynik)} wpisów z {len({w['z'] for w in wynik})} źródeł; niedziałające kanały: {len(bledy)} {bledy}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "wiadomosci.json"))
