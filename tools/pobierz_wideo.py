#!/usr/bin/env python3
"""Pobiera wideo z osadzonego odtwarzacza (np. SproutVideo) do pliku MP4.

Wymagania:  pip install -U yt-dlp pycryptodomex   oraz   ffmpeg w PATH
(pycryptodomex jest opcjonalny, ale bez niego szyfrowane strumienie pobierają się bardzo wolno)

Użycie:
    python tools/pobierz_wideo.py "<URL>" [-o KATALOG] [-q 720] [--referer URL_STRONY]

--referer podaj, gdy wideo działa tylko na konkretnej stronie (blokada domeny).
"""
import argparse
import shutil
import sys

try:
    import yt_dlp
except ImportError:
    sys.exit("Brak yt-dlp. Zainstaluj: pip install -U yt-dlp")


def main():
    p = argparse.ArgumentParser(description="Pobierz wideo z osadzonego odtwarzacza.")
    p.add_argument("url", help="adres wideo / embedu (w cudzysłowie)")
    p.add_argument("-o", "--katalog", default=".", help="katalog docelowy (domyślnie bieżący)")
    p.add_argument("-q", "--jakosc", type=int, help="maks. wysokość obrazu, np. 720 (domyślnie najlepsza)")
    p.add_argument("--referer", help="adres strony, na której wideo jest osadzone")
    p.add_argument("--lista", action="store_true", help="tylko pokaż dostępne jakości")
    a = p.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("Brak ffmpeg w PATH - jest potrzebny do złożenia strumienia w plik MP4.")

    fmt = f"bv*[height<={a.jakosc}]+ba/b[height<={a.jakosc}]" if a.jakosc else "bv*+ba/b"
    opts = {
        "format": fmt,
        "outtmpl": "%(title)s [%(id)s].%(ext)s",
        "paths": {"home": a.katalog},
        "merge_output_format": "mp4",
        "concurrent_fragment_downloads": 8,
        "retries": 10,
        "fragment_retries": 10,
        "listformats": a.lista,
    }
    if a.referer:
        opts["http_headers"] = {"Referer": a.referer}

    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.download([a.url])


if __name__ == "__main__":
    sys.exit(main())
