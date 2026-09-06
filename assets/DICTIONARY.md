# ENABLE source record

Downloaded 2026-09-06 from https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt

Upstream project: https://github.com/dolph/dictionary

SHA-256 of retained original file: `3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`

ENABLE is public-domain word data, compiled by Mendel Cooper with contributions from Alan Beale. Public-domain declaration and background: https://github.com/BartMassey/wordlists/blob/main/README-enable2k.txt

The original file is retained without modification. The application deduplicates entries and matches only lowercase ASCII a–z words of 2–15 letters. The file is fetched on first use and reused for that page session. It is not fetched on article pages.

This is a broad historical lexicon, not a common-word frequency list, definition database, child-safe curated list or current official Scrabble/Words With Friends dictionary. It includes rare and potentially sensitive entries. Do not claim tournament validity from inclusion, or invalidity from absence. The engine does not generate inflections absent from the data.

To update: review the upstream source and license, replace enable1.txt, update the expected checksum in assets/dictionary-loader.js and tests/solver.test.cjs, run `node --test tests/*.test.cjs` and `node scripts/validate-site.mjs`, and update this record. The browser rejects a mismatched file, even if it still contains many words. Do not silently swap to an incomplete download.
