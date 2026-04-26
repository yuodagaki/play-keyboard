#!/usr/bin/env python3
"""
src/data/words.json の全単語リストをあいうえお順（50音順）にソートするスクリプト。
ひらがなの Unicode コードポイントは 50 音順と一致するため、標準ソートで正しく並ぶ。

使い方:
    python3 sort-words.py
"""

import json
from pathlib import Path

WORDS_PATH = Path(__file__).parent / 'src' / 'data' / 'words.json'

with WORDS_PATH.open(encoding='utf-8') as f:
    data = json.load(f)

for group in data.values():
    for key in group:
        group[key] = sorted(group[key])

with WORDS_PATH.open('w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write('\n')

print(f'Sorted: {WORDS_PATH}')
