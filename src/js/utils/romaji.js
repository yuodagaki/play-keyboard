const ROMAJI_MAP = {
  'あ':'a',  'い':'i',  'う':'u',  'え':'e',  'お':'o',
  'か':'ka', 'き':'ki', 'く':'ku', 'け':'ke', 'こ':'ko',
  'さ':'sa', 'し':'shi','す':'su', 'せ':'se', 'そ':'so',
  'た':'ta', 'ち':'chi','つ':'tsu','て':'te', 'と':'to',
  'な':'na', 'に':'ni', 'ぬ':'nu', 'ね':'ne', 'の':'no',
  'は':'ha', 'ひ':'hi', 'ふ':'fu', 'へ':'he', 'ほ':'ho',
  'ま':'ma', 'み':'mi', 'む':'mu', 'め':'me', 'も':'mo',
  'や':'ya', 'ゆ':'yu', 'よ':'yo',
  'ら':'ra', 'り':'ri', 'る':'ru', 'れ':'re', 'ろ':'ro',
  'わ':'wa', 'を':'wo',
  'が':'ga', 'ぎ':'gi', 'ぐ':'gu', 'げ':'ge', 'ご':'go',
  'ざ':'za', 'じ':'ji', 'ず':'zu', 'ぜ':'ze', 'ぞ':'zo',
  'だ':'da', 'で':'de', 'ど':'do',
  'ば':'ba', 'び':'bi', 'ぶ':'bu', 'べ':'be', 'ぼ':'bo',
  'ぱ':'pa', 'ぴ':'pi', 'ぷ':'pu', 'ぺ':'pe', 'ぽ':'po',
  'きゃ':'kya','きゅ':'kyu','きょ':'kyo',
  'にゃ':'nya','にゅ':'nyu','にょ':'nyo',
  'しゃ':'sha','しゅ':'shu','しょ':'sho',
  'ちゃ':'cha','ちゅ':'chu','ちょ':'cho',
  'ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo',
  'みゃ':'mya','みゅ':'myu','みょ':'myo',
  'りゃ':'rya','りゅ':'ryu','りょ':'ryo',
  'ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo',
  'じゃ':'ja', 'じゅ':'ju', 'じょ':'jo',
  'びゃ':'bya','びゅ':'byu','びょ':'byo',
  'ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo',
  'ー':'-',
};

// 拗音の最長一致のためキーを長い順に並べたリスト
const SORTED_KEYS = Object.keys(ROMAJI_MAP).sort((a, b) => b.length - a.length);

const ALTERNATIVES = {
  'し':['si'], 'ち':['ti'], 'つ':['tu'], 'ふ':['hu'], 'じ':['zi'],
  'しゃ':['sya'], 'しゅ':['syu'], 'しょ':['syo'],
  'ちゃ':['tya','cya'], 'ちゅ':['tyu','cyu'], 'ちょ':['tyo','cyo'],
  'じゃ':['zya','jya'], 'じゅ':['zyu','jyu'], 'じょ':['zyo','jyo'],
};

export function createRomajiQuestion(text) {
  const tokens = [];
  for (let i = 0; i < text.length;) {
    const doubled = text[i] === 'っ';
    if (doubled && ++i === text.length) break;
    const kana = SORTED_KEYS.find(k => text.startsWith(k, i)) ?? text[i];
    i += kana.length;
    const standard = ROMAJI_MAP[kana] ?? kana.toLowerCase();
    let choices = [standard, ...(ALTERNATIVES[kana] ?? [])];
    if (kana === 'ん') {
      const next = text[i];
      if (!next) choices = ['n'];
      else if ('あいうえおやゆよ'.includes(next)) choices = ['nn'];
      else choices = ['n', 'nn'];
    }
    tokens.push(doubled ? choices.map(s => s[0] + s) : choices);
  }
  return { text, tokens };
}

// 各かなの候補を順に照合し、入力に合うお手本を返す。不一致なら null。
export function romajiGuide(tokens, typed) {
  function match(index, offset) {
    if (index === tokens.length) return offset >= typed.length ? '' : null;
    const remaining = typed.slice(offset);
    for (const choice of tokens[index]) {
      if (!remaining.startsWith(choice) && !choice.startsWith(remaining)) continue;
      // 「ん」の短い候補で後続が合わなければ、NN として照合し直す。
      const suffix = match(index + 1, offset + choice.length);
      if (suffix !== null) return choice + suffix;
    }
    return null;
  }
  return match(0, 0);
}

export function toRomaji(text) {
  return romajiGuide(createRomajiQuestion(text).tokens, '');
}

export function isHiragana(text) {
  return /[぀-ゟ]/.test(text);
}
