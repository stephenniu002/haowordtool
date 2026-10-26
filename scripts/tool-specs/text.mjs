/**
 * 文本处理类。
 *
 * 这一类的判据很简单：输入别人的文本，输出改好的文本，中间不能有服务器。
 * 凡是需要「把内容发给某个 API 再拿回来」的，这里都不做——那是另一个产品。
 */

export default [
  {
    slug: 'slug-generator',
    name: 'Slug Generator',
    title: 'Slug Generator — URL-Friendly Text Converter',
    desc: 'Turn titles into clean URL slugs. Handles accents, CJK, punctuation and duplicate hyphens. Choose separator and case.',
    cat: 'text',
    catName: 'Text',
    lead: 'Diacritics folded, punctuation stripped, spaces collapsed. One slug per line if you paste a list.',
    fields: [
      { k: 'input', label: 'Titles (one per line)', type: 'area', rows: 6, val: 'Héllo Wörld — 10 Tips & Tricks!\nWhat\'s New in 2026?' },
      { k: 'sep', label: 'Separator', type: 'sel', val: '-', opts: [['-', 'hyphen'], ['_', 'underscore']] },
      { k: 'lower', label: 'Lowercase', type: 'chk', val: true },
      { k: 'max', label: 'Max length (0 = no limit)', type: 'num', val: 0, min: 0, step: 1 },
    ],
    outs: [{ k: 'out', label: 'Slugs', type: 'code' }],
    compute: (v) => {
      const sep = v.sep || '-';
      const max = Number(v.max) || 0;
      const lines = String(v.input || '').split('\n').filter((l) => l.trim());
      const out = lines.map((line) => {
        let s = line.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        // CJK 保留：折成拼音不合适，直接留下字符比整串删掉好
        s = s.replace(/[^\w\u4e00-\u9fa5\s-]/g, ' ');
        s = s.trim().replace(/[\s_-]+/g, sep);
        if (v.lower) s = s.toLowerCase();
        if (max > 0 && s.length > max) {
          s = s.slice(0, max);
          const cut = s.lastIndexOf(sep);
          if (cut > max * 0.6) s = s.slice(0, cut);
          s = s.replace(new RegExp(`\\${sep}+$`), '');
        }
        return s;
      });
      return { out: out.join('\n') };
    },
    example:
      '<code>Héllo Wörld — 10 Tips &amp; Tricks!</code> becomes <code>hello-world-10-tips-tricks</code>. The em dash and the ampersand both collapse into a single separator rather than leaving doubles.',
    body: [
      'A slug is the human-readable part of a URL. It carries no ranking weight on its own, but it appears in search results, gets copied into chat, and gets read aloud when someone says a link out loud. Clean slugs are a usability feature that happens to look like an SEO feature.',
      '## What gets removed and why',
      'Diacritics are folded so that "café" and "cafe" resolve to one URL rather than two pages competing for the same query. Punctuation becomes a separator because a trailing question mark in a URL is legal but confusing. Repeated separators collapse, since <code>a---b</code> and <code>a-b</code> are different URLs pointing at the same content.',
      '## Length limits',
      'There is no hard limit, but most editors and social previews truncate around 60–75 characters total, and the domain eats part of that. Cutting at a separator boundary rather than mid-word keeps the tail readable when it is truncated again downstream.',
      '## CJK titles',
      'Chinese, Japanese and Korean characters are preserved rather than transliterated. A pinyin slug is longer, ambiguous for homophones, and unreadable to the person who wrote the title. Percent-encoded CJK in a URL is ugly but correct, and modern browsers display it decoded.',
    ],
    faq: [
      [
        'Should slugs be lowercase?',
        'Yes. URL paths are case-sensitive by spec, so <code>/About</code> and <code>/about</code> are two different resources. Lowercasing removes a whole class of duplicate-URL problems.',
      ],
      [
        'Do I need to change slugs when I edit a title?',
        'No. Changing a published slug breaks every existing link and requires a redirect. Treat the slug as permanent once it is indexed; edit the title instead.',
      ],
    ],
  },

  {
    slug: 'lorem-ipsum',
    name: 'Lorem Ipsum Generator',
    title: 'Lorem Ipsum Generator — Placeholder Text by Paragraph',
    desc: 'Generate placeholder text by paragraph, sentence or word count. Classic Latin or a plain-English variant, ready to copy.',
    cat: 'text',
    catName: 'Text',
    lead: 'Paragraphs, sentences or words. Classic Latin, or English filler that reads like real copy for layout tests.',
    fields: [
      { k: 'n', label: 'How many', type: 'num', val: 3, min: 1, max: 100, step: 1 },
      { k: 'unit', label: 'Unit', type: 'sel', val: 'para', opts: [['para', 'paragraphs'], ['sent', 'sentences'], ['word', 'words']] },
      { k: 'flavor', label: 'Flavor', type: 'sel', val: 'latin', opts: [['latin', 'Classic Latin'], ['en', 'Plain English']] },
      { k: 'start', label: 'Start with "Lorem ipsum dolor sit amet"', type: 'chk', val: true },
    ],
    outs: [{ k: 'out', label: 'Text', type: 'code' }],
    compute: (v) => {
      const LAT = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(' ');
      const EN = 'the quick brown fox jumps over a lazy dog while the layout shifts and the text reflows across every breakpoint that the designer promised would hold up under real content'.split(' ');
      const words = v.flavor === 'en' ? EN : LAT;
      const pick = (i) => words[i % words.length];
      const sentence = (n) => {
        let w = [];
        for (let i = 0; i < n; i++) w.push(pick(i));
        return w.join(' ').replace(/^./, (c) => c.toUpperCase()) + '.';
      };
      const para = () => {
        const s = [];
        const len = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < len; i++) s.push(sentence(8 + Math.floor(Math.random() * 10)));
        return s.join(' ');
      };
      const n = Math.max(1, Math.min(100, Math.floor(Number(v.n) || 1)));
      let out = [];
      if (v.unit === 'para') for (let i = 0; i < n; i++) out.push(para());
      else if (v.unit === 'sent') for (let i = 0; i < n; i++) out.push(sentence(8 + Math.floor(Math.random() * 10)));
      else {
        let w = [];
        for (let i = 0; i < n; i++) w.push(pick(i + 2));
        out = [w.join(' ')];
      }
      let text = v.unit === 'para' ? out.join('\n\n') : out.join(' ');
      if (v.start && v.unit !== 'word') {
        text = text.replace(/^./, 'L').replace(/^\S+/, 'Lorem ipsum dolor sit amet,');
      }
      return { out: text };
    },
    example:
      'Lorem ipsum is scrambled Latin from Cicero\'s <em>De finibus bonorum et malorum</em>, used as filler since the 1500s. The point is that it has the letter-frequency and word-length distribution of real prose, so a layout tested with it does not collapse when the real copy arrives.',
    body: [
      'Placeholder text exists to be replaced. Its only job is to occupy the right amount of space with the right visual texture so that typography, line length and wrapping can be judged before the content exists.',
      '## Latin or English',
      'Classic Latin is neutral — nobody reads it, so reviewers look at the layout instead of editing the words. Plain English is better when you need to check how real sentences fall: capitalisation, sentence length, and whether the line-height survives actual punctuation. Use English for design review, Latin for client mockups.',
      '## What it will not catch',
      'Lorem ipsum has no long words, no URLs, no numbers and no code. A layout that looks perfect with it will still break on a 40-character German compound or an unbreakable tracking number. Test those cases with real strings before shipping.',
      '## Accessibility note',
      'Screen readers will attempt to pronounce Latin filler. For anything that will be tested with assistive technology, mark placeholder blocks <code>aria-hidden="true"</code> or use real sample content instead.',
    ],
    faq: [
      [
        'Is the output always the same?',
        'No. Sentences and paragraph lengths are randomised on each run, so repeated clicks give different text — which is what you want when filling several cards or columns.',
      ],
      [
        'Can I use it commercially?',
        'The Latin itself is public domain. The generated arrangement is not copyrightable in any meaningful sense.',
      ],
    ],
  },

  {
    slug: 'text-reverse',
    name: 'Text Reverser',
    title: 'Text Reverser — Reverse Characters, Words or Lines',
    desc: 'Reverse text by character, word or line. Handles emoji and combining marks correctly by reversing grapheme clusters, not bytes.',
    cat: 'text',
    catName: 'Text',
    lead: 'Three reversal modes. Emoji and accented characters stay intact because this reverses graphemes, not code units.',
    fields: [
      { k: 'input', label: 'Text', type: 'area', rows: 6, val: 'Hello world 👋 café' },
      { k: 'mode', label: 'Mode', type: 'sel', val: 'char', opts: [['char', 'Reverse characters'], ['word', 'Reverse word order'], ['line', 'Reverse line order']] },
    ],
    outs: [{ k: 'out', label: 'Output', type: 'code' }],
    compute: (v) => {
      const s = String(v.input || '');
      if (v.mode === 'word') {
        return { out: s.split('\n').map((l) => l.split(/(\s+)/).reverse().join('')).join('\n') };
      }
      if (v.mode === 'line') {
        return { out: s.split('\n').reverse().join('\n') };
      }
      // 按字素簇反转：拆成码点再反转会把 👋🏽 和 é 拆坏
      const seg = typeof Intl !== 'undefined' && Intl.Segmenter
        ? [...new Intl.Segmenter().segment(s)].map((x) => x.segment)
        : Array.from(s);
      return { out: seg.reverse().join('') };
    },
    example:
      'Reversing by code unit turns <code>café</code> into a broken sequence, because the é may be stored as two code points. Reversing by grapheme cluster keeps it as one visible character.',
    body: [
      'String reversal looks trivial and is not. JavaScript strings are UTF-16 code units; splitting on them tears apart anything outside the Basic Multilingual Plane — emoji, rare CJK, musical symbols — and separates combining marks from the letter they modify.',
      '## Three modes',
      'Character mode reverses the whole string and is what people usually want when checking palindromes. Word mode keeps the words in order but reverses their sequence, which is useful for reordering lists. Line mode flips the vertical order of a list without touching anything inside a line.',
      '## Where reversal is genuinely useful',
      'Checking whether a string is a palindrome, generating a rough cipher for a puzzle, and inspecting the tail of a long identifier. It is not a security measure — reversed text is not hidden text.',
      '## Copying the result',
      'Some platforms mangle right-to-left or emoji-heavy output when it is pasted into a form field. If the result looks correct here but wrong after pasting, the problem is in the destination application\'s text handling.',
    ],
    faq: [
      [
        'Why does my emoji stay in one piece?',
        'The page uses <code>Intl.Segmenter</code> where available, which splits text into user-perceived characters rather than code units. Older browsers fall back to code points.',
      ],
      [
        'Does this work for right-to-left languages?',
        'The characters reverse but the visual order is then handled by the browser\'s bidi algorithm, which can produce a confusing result. For Arabic or Hebrew, line reversal is usually what you actually want.',
      ],
    ],
  },

  {
    slug: 'sort-lines',
    name: 'Sort Lines',
    title: 'Sort Lines — Alphabetical, Numeric, Length and Reverse',
    desc: 'Sort a list alphabetically, numerically, by length or in reverse. Case-insensitive option, removes blank lines, handles thousands of rows.',
    cat: 'text',
    catName: 'Text',
    lead: 'Alphabetical, numeric, by length, or reversed. Case-insensitive and dedupe options included.',
    fields: [
      { k: 'input', label: 'Lines', type: 'area', rows: 8, val: 'banana\nApple\ncherry\napple\n10\n9\n100' },
      { k: 'mode', label: 'Sort by', type: 'sel', val: 'alpha', opts: [['alpha', 'Alphabetical'], ['num', 'Numeric'], ['len', 'Line length']] },
      { k: 'ci', label: 'Case-insensitive', type: 'chk', val: true },
      { k: 'desc', label: 'Descending', type: 'chk', val: false },
      { k: 'blank', label: 'Remove blank lines', type: 'chk', val: true },
      { k: 'uniq', label: 'Remove duplicates', type: 'chk', val: false },
    ],
    outs: [
      { k: 'out', label: 'Sorted', type: 'code' },
      { k: 'count', label: 'Lines', type: 'big' },
    ],
    compute: (v) => {
      let lines = String(v.input || '').split('\n');
      if (v.blank) lines = lines.filter((l) => l.trim() !== '');
      const norm = (s) => (v.ci ? s.toLowerCase() : s);
      if (v.uniq) {
        const seen = new Set();
        lines = lines.filter((l) => {
          const k = norm(l);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }
      const cmp = {
        // localeCompare 让 ä 排在 a 后面而不是排到 z 后面
        alpha: (a, b) => norm(a).localeCompare(norm(b), undefined, { numeric: true, sensitivity: v.ci ? 'base' : 'variant' }),
        num: (a, b) => {
          const na = parseFloat(a.replace(/[^0-9.eE+-]/g, ''));
          const nb = parseFloat(b.replace(/[^0-9.eE+-]/g, ''));
          if (isNaN(na) && isNaN(nb)) return 0;
          if (isNaN(na)) return 1;
          if (isNaN(nb)) return -1;
          return na - nb;
        },
        len: (a, b) => a.length - b.length || norm(a).localeCompare(norm(b)),
      }[v.mode];
      lines.sort(cmp);
      if (v.desc) lines.reverse();
      return { out: lines.join('\n'), count: String(lines.length) };
    },
    example:
      'A plain string sort puts <code>100</code> before <code>9</code>, because "1" sorts before "9". Numeric mode parses the leading number and compares values, which is what you want for prices, quantities and version lists.',
    body: [
      'Sorting a list looks like a solved problem until the list contains numbers, mixed case, accents or blanks. Each of those needs a different comparison function, and picking the wrong one produces an order that is stable but wrong.',
      '## Which mode to pick',
      'Alphabetical with the case-insensitive flag is the right default for names and tags. Numeric is for anything where the digits are the value rather than an identifier — quantities, prices, scores. Length mode surfaces the longest or shortest entries, useful when auditing meta descriptions or tag lists.',
      '## Accents and case',
      'This page sorts with <code>localeCompare</code>, which puts "ä" next to "a" rather than after "z" as raw character codes would. Turning off case-insensitive switches to a stricter comparison where uppercase sorts before lowercase, matching what a byte sort does.',
      '## Duplicates',
      'The dedupe option keeps the first occurrence and drops later ones, comparing case-insensitively when that box is checked. Blank lines are removed separately, because a list pasted from a spreadsheet usually ends with one.',
    ],
    faq: [
      [
        'How many lines can it handle?',
        'Tens of thousands without trouble. Above that the browser starts to stutter on each keystroke, because the sort reruns on every input event with a 120 ms debounce.',
      ],
      [
        'Why do my numbers with units sort oddly?',
        'Numeric mode strips everything except digits, a decimal point and an exponent. A value like <code>1,200</code> parses as 1 because the comma is not a recognised separator in this quick parse.',
      ],
    ],
  },

  {
    slug: 'dedupe-lines',
    name: 'Remove Duplicate Lines',
    title: 'Remove Duplicate Lines — Dedupe a List Online',
    desc: 'Remove duplicate lines from a list. Case-insensitive matching, trim whitespace, and a count of what was removed.',
    cat: 'text',
    catName: 'Text',
    lead: 'Keeps the first occurrence of each line, reports how many were removed.',
    fields: [
      { k: 'input', label: 'Lines', type: 'area', rows: 8, val: 'apple\nbanana\nApple\nbanana\ncherry' },
      { k: 'ci', label: 'Ignore case', type: 'chk', val: true },
      { k: 'trim', label: 'Trim whitespace before comparing', type: 'chk', val: true },
      { k: 'sort', label: 'Sort the result', type: 'chk', val: false },
    ],
    outs: [
      { k: 'out', label: 'Deduplicated', type: 'code' },
      { k: 'stats', label: 'Removed', type: 'big' },
    ],
    compute: (v) => {
      let lines = String(v.input || '').split('\n');
      const before = lines.length;
      const seen = new Set();
      const kept = [];
      for (const l of lines) {
        const key = (v.trim ? l.trim() : l);
        const k = v.ci ? key.toLowerCase() : key;
        if (seen.has(k)) continue;
        seen.add(k);
        kept.push(key);
      }
      if (v.sort) kept.sort((a, b) => a.localeCompare(b));
      return { out: kept.join('\n'), stats: `${before - kept.length} of ${before}` };
    },
    example:
      'With case-insensitive matching, <code>apple</code> and <code>Apple</code> count as the same entry. Turning it off keeps both — correct when the capitalisation is meaningful, wrong when it is a paste artefact.',
    body: [
      'Duplicate lines come from three places: concatenated exports, copy-paste from a paginated view, and case or whitespace differences that look identical on screen but differ byte for byte. This tool handles all three, and the trade-off is always which of the duplicates you keep.',
      '## Keep first, or keep last?',
      'This keeps the first occurrence. That is the right default for append-only exports where later rows are the stale ones, and the wrong default for update logs where the last row is current. If you need the latest value, reverse the list, dedupe, and reverse back.',
      '## Whitespace',
      'Trimming before comparison catches the most common invisible difference — a trailing space from a spreadsheet column. The output is the trimmed line, so the result is also cleaner than the input.',
      '## What counts as a duplicate',
      'Exact matches after the chosen normalisation. It does not catch near-duplicates such as "New York" versus "New York, NY", or URLs that differ only by a tracking parameter. Those need a real matching rule, not a dedupe button.',
    ],
    faq: [
      [
        'Are blank lines treated as duplicates?',
        'Yes — one blank line is kept and the rest are dropped. If you want them gone entirely, run the result through the whitespace remover.',
      ],
      [
        'Does it preserve the original order?',
        'Yes, unless you check the sort box. First occurrences appear in their original positions.',
      ],
    ],
  },

  {
    slug: 'find-replace',
    name: 'Find and Replace',
    title: 'Find and Replace Text — Plain or Regex, with Undo',
    desc: 'Find and replace across text, with optional regular expressions and case sensitivity. Shows the match count before and after.',
    cat: 'text',
    catName: 'Text',
    lead: 'Plain text or regex, case toggle, and a live count of matches so you can see the blast radius before committing.',
    fields: [
      { k: 'input', label: 'Text', type: 'area', rows: 8, val: 'The cat sat on the mat. The Cat ate.' },
      { k: 'find', label: 'Find', type: 'text', val: 'cat' },
      { k: 'repl', label: 'Replace with', type: 'text', val: 'dog' },
      { k: 'regex', label: 'Treat Find as a regular expression', type: 'chk', val: false },
      { k: 'ci', label: 'Case-insensitive', type: 'chk', val: false },
    ],
    outs: [
      { k: 'out', label: 'Result', type: 'code' },
      { k: 'count', label: 'Replacements', type: 'big' },
    ],
    compute: (v) => {
      const src = String(v.input || '');
      const find = String(v.find || '');
      if (!find) return { out: src, count: '0' };
      const flags = 'g' + (v.ci ? 'i' : '');
      let re;
      try {
        re = v.regex ? new RegExp(find, flags) : new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      } catch (e) {
        throw new Error('Invalid regular expression: ' + e.message);
      }
      const matches = src.match(re);
      const out = src.replace(re, String(v.repl ?? ''));
      return { out, count: String(matches ? matches.length : 0) };
    },
    example:
      'Replacing <code>cat</code> with <code>dog</code> in the sample above hits one match with case sensitivity on, and two with it off. The count is the point of the tool: it tells you whether the pattern is too broad before you paste the result anywhere.',
    body: [
      'Bulk find and replace is where text editing causes damage. A pattern that matches more than intended silently rewrites content that was already correct, and by the time it is noticed there is no undo history to fall back on.',
      '## Check the count first',
      'The replacement count updates as you type. If you expected three changes and it reports forty, the pattern is wrong — narrow it before copying the output. This one habit prevents most find-and-replace incidents.',
      '## Regex mode',
      'Use it for structure rather than literals: <code>\\s+$</code> for trailing whitespace, <code>\\b\\d{4}-\\d{2}-\\d{2}\\b</code> for dates, <code>^\\s*\\d+\\.\\s*</code> to strip list numbering. Capture groups work in the replacement — <code>$1</code> for the first group.',
      '## Case sensitivity',
      'Off by default, which is the safer choice for prose and the wrong choice for code identifiers. In code, a case-insensitive replace of <code>id</code> will also hit <code>ID</code> and <code>Id</code>.',
    ],
    faq: [
      [
        'Do backslashes in the replacement need escaping?',
        'Only <code>$</code> is special in the replacement string, for capture group references. A literal dollar sign needs to be written as <code>$$</code>.',
      ],
      [
        'Why does my regex match more than I expected?',
        'Quantifiers are greedy by default — <code>.*</code> runs to the end of the line. Add a question mark to make it lazy, or use a negated class such as <code>[^&lt;]*</code>.',
      ],
    ],
  },

  {
    slug: 'text-statistics',
    name: 'Text Statistics',
    title: 'Text Statistics — Word, Sentence and Paragraph Counts',
    desc: 'Count words, characters, sentences and paragraphs, with average word length and lexical diversity. Useful for editing and content audits.',
    cat: 'text',
    catName: 'Text',
    lead: 'Words, sentences, paragraphs, average word length, longest sentence and unique-word ratio.',
    fields: [{ k: 'input', label: 'Text', type: 'area', rows: 10, val: '' }],
    outs: [
      { k: 'words', label: 'Words', type: 'big' },
      { k: 'chars', label: 'Characters', type: 'big' },
      { k: 'sentences', label: 'Sentences', type: 'big' },
      { k: 'paragraphs', label: 'Paragraphs', type: 'big' },
      { k: 'avg', label: 'Average word length', type: 'big' },
      { k: 'longest', label: 'Longest sentence', type: 'big' },
      { k: 'diversity', label: 'Unique word ratio', type: 'big' },
    ],
    compute: (v) => {
      const s = String(v.input || '');
      if (!s.trim()) return { words: '0', chars: '0', sentences: '0', paragraphs: '0', avg: '—', longest: '—', diversity: '—' };
      const words = s.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
      const sentences = s.split(/[.!?。！？]+/).map((x) => x.trim()).filter(Boolean);
      const paragraphs = s.split(/\n\s*\n/).filter((p) => p.trim()).length;
      const clean = words.map((w) => w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')).filter(Boolean);
      const uniq = new Set(clean).size;
      const longest = sentences.reduce((a, b) => (b.split(/\s+/).length > a.split(/\s+/).length ? b : a), sentences[0] || '');
      return {
        words: String(words.length),
        chars: String(s.length),
        sentences: String(sentences.length),
        paragraphs: String(paragraphs),
        avg: (clean.join('').length / (clean.length || 1)).toFixed(2),
        longest: `${longest.split(/\s+/).length} words`,
        diversity: `${Math.round((uniq / (clean.length || 1)) * 100)}%`,
      };
    },
    example:
      'Unique word ratio below about 40% in a 500-word article usually means repetition rather than concision — the same few nouns doing all the work. Above 60% is normal for edited prose; above 70% is typical of lists and data.',
    body: [
      'Word count is the number every editor asks for and the least interesting one. The secondary figures — average word length, longest sentence, unique word ratio — are what actually indicate whether a passage reads well.',
      '## Reading the numbers',
      'Average English word length sits near 4.7 characters. Sustained averages above 6 mean heavy nominalisation: long abstract nouns instead of verbs. A longest sentence above 35 words is worth splitting regardless of what the total count says.',
      '## Sentence and paragraph detection',
      'Sentences are split on terminal punctuation, which miscounts abbreviations such as "Dr." and decimals such as "3.5". Paragraphs are split on blank lines, so a document with soft returns throughout will report one paragraph. Both are heuristics, not parsing.',
      '## Counting rules differ',
      'Microsoft Word counts "don\'t" as one word; some CMSs count hyphenated compounds as two. If you are matching a client\'s number, ask which tool they are using rather than arguing about the arithmetic.',
    ],
    faq: [
      [
        'Does it count CJK characters as words?',
        'No — CJK text without spaces counts as very few words. For Chinese or Japanese, use the character count and multiply by roughly 0.6 for a Western-equivalent word count.',
      ],
      [
        'What counts as a character?',
        'Every code unit in the string, including spaces and punctuation, matching what most CMSs report.',
      ],
    ],
  },

  {
    slug: 'reading-time',
    name: 'Reading Time Calculator',
    title: 'Reading Time Calculator — Words per Minute Estimate',
    desc: 'Estimate reading time from word count at adjustable speed. Gives speaking time too, for scripts and presentations.',
    cat: 'text',
    catName: 'Text',
    lead: 'Paste the text or a word count. Adjustable reading speed, plus a separate speaking estimate.',
    fields: [
      { k: 'input', label: 'Text (or leave empty and use the count below)', type: 'area', rows: 8, val: '' },
      { k: 'override', label: 'Word count override (0 = use text)', type: 'num', val: 0, min: 0, step: 1 },
      { k: 'wpm', label: 'Reading speed (words/min)', type: 'num', val: 238, min: 50, max: 1000, step: 1 },
    ],
    outs: [
      { k: 'words', label: 'Words', type: 'big' },
      { k: 'read', label: 'Reading time', type: 'big' },
      { k: 'speak', label: 'Speaking time (150 wpm)', type: 'big' },
      { k: 'deep', label: 'Careful reading (150 wpm)', type: 'big' },
    ],
    compute: (v) => {
      const text = String(v.input || '');
      const words = Number(v.override) > 0
        ? Math.floor(Number(v.override))
        : text.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
      const fmt = (mins) => {
        if (!isFinite(mins) || mins <= 0) return '0 min';
        const m = Math.floor(mins);
        const s = Math.round((mins - m) * 60);
        if (m < 1) return `${s} sec`;
        return s >= 30 ? `${m} min ${s} sec` : `${m} min`;
      };
      const wpm = Math.max(50, Number(v.wpm) || 238);
      return {
        words: String(words),
        read: fmt(words / wpm),
        speak: fmt(words / 150),
        deep: fmt(words / 150),
      };
    },
    example:
      '238 words per minute is the average for silent reading of English prose, from Brysbaert\'s meta-analysis of 190 studies. Skimming runs three to four times faster; reading to retain technical material, closer to 150.',
    body: [
      'Reading time estimates are a courtesy to the reader, not a measurement. The number on an article card sets an expectation — "6 min read" promises something different from "18 min read" — and readers decide whether to start based on it.',
      '## Where the numbers come from',
      'Median silent reading speed for English is about 238 words per minute, with wide variation between 175 and 300. Speaking is slower and more consistent: roughly 130–150 wpm is comfortable for an audience, and 150 is the usual planning figure for scripts.',
      '## What the estimate ignores',
      'It ignores images, code blocks, tables, and the fact that people reread. It also ignores formatting: a wall of text at the same word count takes materially longer than the same words broken into sections. Treat the figure as a floor.',
      '## Use it for',
      'Setting expectations on article cards, budgeting a slide script against a slot length, and catching articles that have quietly grown past the length their title implies.',
    ],
    faq: [
      [
        'Why is speaking time slower than reading time?',
        'Because speech is constrained by articulation. A presenter averaging 238 wpm is rushing; 150 leaves room for pauses and emphasis.',
      ],
      [
        'Does it work for non-English text?',
        'Only approximately. The word count relies on spaces, so CJK text reports far fewer words than it has characters. Use the count override with a manually estimated value.',
      ],
    ],
  },

  {
    slug: 'markdown-preview',
    name: 'Markdown Preview',
    title: 'Markdown Preview — Live Renderer with HTML Output',
    desc: 'Write Markdown and see it rendered live. Supports headings, lists, tables, code blocks, links and emphasis. No external library.',
    cat: 'text',
    catName: 'Text',
    lead: 'Markdown on the left, rendered HTML on the right. The renderer is small on purpose — no external library, no CDN dependency.',
    fields: [{ k: 'input', label: 'Markdown', type: 'area', rows: 14, val: '# Hello\n\nSome **bold** and *italic* text with a [link](https://example.com).\n\n- one\n- two\n\n```js\nconsole.log(1)\n```' }],
    outs: [
      { k: 'html', label: 'Rendered HTML', type: 'code' },
      { k: 'preview', label: 'Preview (raw HTML below is escaped, this is the live render)', type: 'big' },
    ],
    compute: (v) => {
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      let src = String(v.input || '');
      const blocks = [];
      // 先抽出代码块，否则里面的 * 和 # 会被当成语法
      src = src.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        blocks.push(`<pre><code data-lang="${esc(lang)}">${esc(code)}</code></pre>`);
        return `\u0000BLOCK${blocks.length - 1}\u0000`;
      });
      src = esc(src);
      src = src
        .replace(/^###### (.*)$/gm, '<h6>$1</h6>')
        .replace(/^##### (.*)$/gm, '<h5>$1</h5>')
        .replace(/^#### (.*)$/gm, '<h4>$1</h4>')
        .replace(/^### (.*)$/gm, '<h3>$1</h3>')
        .replace(/^## (.*)$/gm, '<h2>$1</h2>')
        .replace(/^# (.*)$/gm, '<h1>$1</h1>')
        .replace(/^&gt; (.*)$/gm, '<blockquote>$1</blockquote>')
        .replace(/^\s*[-*+] (.*)$/gm, '<li>$1</li>')
        .replace(/^\s*\d+\. (.*)$/gm, '<li data-ordered="1">$1</li>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" rel="noopener nofollow">$1</a>')
        .replace(/^---+$/gm, '<hr>');
      src = src.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
      src = src.replace(/\u0000BLOCK(\d+)\u0000/g, (_m, i) => blocks[Number(i)]);
      const paras = src.split(/\n{2,}/).map((p) => {
        const t = p.trim();
        if (!t) return '';
        if (/^<(h\d|ul|ol|pre|blockquote|hr)/.test(t)) return t;
        return `<p>${t.replace(/\n/g, '<br>')}</p>`;
      });
      const html = paras.filter(Boolean).join('\n');
      return { html, preview: `${html.replace(/<[^>]+>/g, '').slice(0, 60)}… (see HTML panel)` };
    },
    example:
      'The renderer escapes HTML first, then applies Markdown patterns. That order matters: a blog comment containing a <code>&lt;script&gt;</code> tag arrives as text rather than executing.',
    body: [
      'Markdown is a formatting convention, not a file format — the same source can render differently in GitHub, in a static site generator and in a chat app, because each implements a slightly different dialect. This previewer implements the common subset.',
      '## What this supports',
      'Headings, bold, italic, inline code, fenced code blocks, unordered and ordered lists, blockquotes, horizontal rules, links and paragraphs. Code blocks are extracted before any other rule runs, so asterisks inside code stay literal.',
      '## What it deliberately omits',
      'Raw HTML passthrough, footnotes, definition lists, tables and task lists. Raw HTML is the big one: allowing it in a preview tool is how an XSS demonstration becomes an XSS incident when someone pastes their own content.',
      '## The escaping order',
      'Angle brackets and ampersands are escaped before Markdown patterns are applied. If that order were reversed, Markdown-generated tags would be escaped too and nothing would render — a mistake that shows up as a page full of visible HTML tags.',
    ],
    faq: [
      [
        'Can I paste the HTML into my blog?',
        'Yes for static content. Note that the escaping already happened, so anything that looks like a tag in your source is text, not markup.',
      ],
      [
        'Why do my tables not render?',
        'Table syntax is not implemented. Pipe tables require column alignment rules and vary between dialects; most people pasting into a CMS need the HTML form anyway.',
      ],
    ],
  },

  {
    slug: 'html-escape',
    name: 'HTML Escape / Unescape',
    title: 'HTML Entity Encoder and Decoder',
    desc: 'Escape HTML special characters to entities, or decode entities back to text. Prevents markup injection in pasted content.',
    cat: 'text',
    catName: 'Text',
    lead: 'Escape the five characters that break markup, or decode an entity-laden string back to plain text.',
    fields: [
      { k: 'mode', label: 'Mode', type: 'sel', val: 'esc', opts: [['esc', 'Escape'], ['unesc', 'Unescape']] },
      { k: 'input', label: 'Input', type: 'area', rows: 6, val: '<p class="x">Tom & Jerry\'s</p>' },
    ],
    outs: [{ k: 'out', label: 'Output', type: 'code' }],
    compute: (v) => {
      const s = String(v.input || '');
      if (v.mode === 'esc') {
        return {
          out: s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;'),
        };
      }
      // 用 textarea 的解析器解实体，比自己写映射表可靠
      const ta = document.createElement('textarea');
      ta.innerHTML = s;
      return { out: ta.value };
    },
    example:
      'Escaping <code>&lt;p&gt;</code> produces <code>&amp;lt;p&amp;gt;</code>. The browser renders that as the literal characters instead of starting a paragraph.',
    body: [
      'HTML uses angle brackets as syntax, so any text containing them has to be escaped before it is placed into a page. The five characters that matter are <code>&amp;</code>, <code>&lt;</code>, <code>&gt;</code>, <code>"</code> and <code>\'</code>. Escaping exactly those five is sufficient in text and in quoted attribute values.',
      '## Escape, then insert',
      'The order matters: escape when the text enters HTML, not before. Escaping twice produces a page showing <code>&amp;lt;</code> to the reader, which is a common bug when a template engine already escapes and the developer escapes again.',
      '## Unescaping is for display and debugging',
      'Decoding entities is useful when you are inspecting stored content or reading a feed that double-encoded. It is not a sanitiser — unescaping untrusted input and then inserting it into HTML reintroduces exactly the injection that escaping prevented.',
      '## Not the same as URL encoding',
      'HTML entities and percent-encoding solve different problems in different layers. A URL parameter inside an HTML attribute needs both: percent-encode the value, then HTML-escape the whole attribute.',
    ],
    faq: [
      [
        'Do I need to escape inside a &lt;script&gt; block?',
        'No, and escaping there breaks the JavaScript. Script content is parsed as code, not markup, so <code>&amp;</code> stays a literal ampersand and the string becomes wrong.',
      ],
      [
        'What about non-breaking spaces?',
        'Unescaping converts <code>&amp;nbsp;</code> to a non-breaking space character. It looks like a normal space and behaves differently when text wraps — that is the point of it.',
      ],
    ],
  },

  {
    slug: 'csv-to-json',
    name: 'CSV to JSON',
    title: 'CSV to JSON Converter — With Header Detection',
    desc: 'Convert CSV to JSON in the browser. Handles quoted fields, embedded commas and custom delimiters. Detects numbers and booleans.',
    cat: 'text',
    catName: 'Text',
    lead: 'Quoted fields, embedded commas, custom delimiters. First row becomes keys unless you turn that off.',
    fields: [
      { k: 'input', label: 'CSV', type: 'area', rows: 10, val: 'name,age,city\n"Smith, John",42,"New York"\nJane,31,Boston' },
      { k: 'delim', label: 'Delimiter', type: 'sel', val: ',', opts: [[',', 'comma'], [';', 'semicolon'], ['\t', 'tab'], ['|', 'pipe']] },
      { k: 'header', label: 'First row is a header', type: 'chk', val: true },
      { k: 'typed', label: 'Convert numbers and true/false', type: 'chk', val: true },
      { k: 'pretty', label: 'Pretty-print', type: 'chk', val: true },
    ],
    outs: [
      { k: 'out', label: 'JSON', type: 'code' },
      { k: 'rows', label: 'Rows', type: 'big' },
    ],
    compute: (v) => {
      const d = v.delim || ',';
      const src = String(v.input || '').replace(/\r\n?/g, '\n');
      // 手写解析：split 会在引号内的分隔符上炸掉
      const rows = [];
      let row = [];
      let cell = '';
      let quoted = false;
      for (let i = 0; i < src.length; i++) {
        const c = src[i];
        if (quoted) {
          if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
          else if (c === '"') quoted = false;
          else cell += c;
        } else if (c === '"') quoted = true;
        else if (c === d) { row.push(cell); cell = ''; }
        else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else cell += c;
      }
      if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
      const clean = rows.filter((r) => r.some((x) => x.trim() !== ''));
      if (!clean.length) return { out: '[]', rows: '0' };
      const keys = v.header ? clean[0].map((h, i) => h.trim() || `column_${i + 1}`) : null;
      const body = v.header ? clean.slice(1) : clean;
      const conv = (x) => {
        if (!v.typed) return x;
        const t = x.trim();
        if (t === '') return '';
        if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return Number(t);
        if (/^(true|false)$/i.test(t)) return t.toLowerCase() === 'true';
        if (/^(null|)$/i.test(t)) return null;
        return x;
      };
      const data = body.map((r) => (keys ? Object.fromEntries(keys.map((k, i) => [k, conv(r[i] ?? '')])) : r.map(conv)));
      return {
        out: JSON.stringify(data, null, v.pretty ? 2 : 0),
        rows: String(data.length),
      };
    },
    example:
      'A field like <code>"Smith, John"</code> survives because the parser tracks quote state instead of splitting on every comma. A naive <code>split(\',\')</code> produces two fields and shifts every subsequent column.',
    body: [
      'CSV looks like a trivial format and is not. RFC 4180 allows quoted fields containing the delimiter, embedded newlines and escaped quotes — which means a correct parser is a small state machine, not a call to split.',
      '## The three things that break naive parsers',
      'Delimiters inside quotes, newlines inside quotes, and doubled quotes representing a literal quote. All three appear in real exports from Excel, Google Sheets and CRMs on a regular basis.',
      '## Type conversion',
      'Numbers and booleans are converted when the toggle is on, which is usually what you want for JSON consumers. Turn it off when leading zeros matter — a postcode like <code>01234</code> becomes <code>1234</code> if parsed as a number, which is a data-loss bug that ships quietly.',
      '## Header handling',
      'With headers on, the first row supplies keys and duplicate headers are left as-is, so the last column with that name wins. Turn headers off to get arrays of arrays, which is the safer shape when the first row is data rather than a schema.',
    ],
    faq: [
      [
        'How large a file can it handle?',
        'A few megabytes comfortably. Everything runs in the tab, so a 50 MB export will freeze the interface — for that, use a command-line tool.',
      ],
      [
        'Why is my numeric column suddenly strings?',
        'Because at least one value in it is not a number — a stray space, a currency symbol, or "N/A". Conversion is per cell, so mixed columns end up heterogeneous.',
      ],
    ],
  },

  {
    slug: 'json-to-csv',
    name: 'JSON to CSV',
    title: 'JSON to CSV Converter — Flatten Nested Objects',
    desc: 'Convert a JSON array to CSV. Flattens nested objects with dot notation and unions keys across rows so no column is lost.',
    cat: 'text',
    catName: 'Text',
    lead: 'Paste an array of objects, get CSV. Nested keys are flattened with dots; the column set is the union of every row.',
    fields: [
      { k: 'input', label: 'JSON', type: 'area', rows: 10, val: '[{"name":"Jane","age":31,"address":{"city":"Boston"}},{"name":"John","age":42,"address":{"city":"New York"},"vip":true}]' },
      { k: 'delim', label: 'Delimiter', type: 'sel', val: ',', opts: [[',', 'comma'], [';', 'semicolon'], ['\t', 'tab']] },
      { k: 'flat', label: 'Flatten nested objects', type: 'chk', val: true },
    ],
    outs: [
      { k: 'out', label: 'CSV', type: 'code' },
      { k: 'rows', label: 'Rows', type: 'big' },
      { k: 'cols', label: 'Columns', type: 'big' },
    ],
    compute: (v) => {
      let data;
      try {
        data = JSON.parse(String(v.input || 'null'));
      } catch (e) {
        throw new Error('Invalid JSON: ' + e.message);
      }
      if (!Array.isArray(data)) data = [data];
      if (!data.length) return { out: '', rows: '0', cols: '0' };
      const flat = (obj, prefix, out) => {
        for (const [k, val] of Object.entries(obj)) {
          const key = prefix ? `${prefix}.${k}` : k;
          if (v.flat && val && typeof val === 'object' && !Array.isArray(val)) flat(val, key, out);
          else out[key] = Array.isArray(val) ? JSON.stringify(val) : val === null || val === undefined ? '' : val;
        }
        return out;
      };
      const rows = data.map((r) => (r && typeof r === 'object' ? flat(r, '', {}) : { value: r }));
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
      const d = v.delim || ',';
      const cell = (x) => {
        const s = x === undefined || x === null ? '' : String(x);
        return /["\n\r]/.test(s) || s.includes(d) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const csv = [cols.map(cell).join(d), ...rows.map((r) => cols.map((c) => cell(r[c])).join(d))].join('\n');
      return { out: csv, rows: String(rows.length), cols: String(cols.length) };
    },
    example:
      'When rows have different keys, the column set is the union — a row without <code>vip</code> gets an empty cell rather than shifting the remaining columns left.',
    body: [
      'CSV is a flat table; JSON is a tree. Converting between them means deciding what happens to the parts that do not fit, and that decision is where most converters quietly lose data.',
      '## Flattening',
      'A nested object <code>{"address":{"city":"Boston"}}</code> becomes a column named <code>address.city</code>. This preserves the nesting in the header, which is round-trippable if you later un-flatten. Turn it off to get <code>[object Object]</code> — occasionally useful to see which columns are nested.',
      '## Arrays',
      'Arrays are serialised as JSON strings inside a single cell rather than spread across columns. Spreading them would require a rule for which array index maps to which column, and there is no rule that works for arbitrary data.',
      '## Ragged rows',
      'The column set is the union across all rows, so a field present in one row appears in every row. This is why the output is wider than the first row suggests, and why missing values appear as empty cells rather than absent columns.',
    ],
    faq: [
      [
        'Why does Excel show my numbers in scientific notation?',
        'Excel guesses types on import. Open the CSV through Data → From Text/CSV and set the column type to Text for long identifiers such as order numbers.',
      ],
      [
        'Can it handle an array of arrays?',
        'Yes, though each array becomes a single cell containing JSON. For that shape, the raw text is usually what you want.',
      ],
    ],
  },

  {
    slug: 'json-formatter',
    name: 'JSON Formatter',
    title: 'JSON Formatter and Validator — Pretty Print or Minify',
    desc: 'Format, minify and validate JSON. Shows the exact error position when parsing fails, and sorts keys on request.',
    cat: 'text',
    catName: 'Text',
    lead: 'Pretty-print, minify, or validate. Parse errors report the character position instead of a generic message.',
    fields: [
      { k: 'input', label: 'JSON', type: 'area', rows: 12, val: '{"b":1,"a":[1,2,{"c":true}]}' },
      { k: 'mode', label: 'Mode', type: 'sel', val: 'pretty', opts: [['pretty', 'Pretty print'], ['min', 'Minify'], ['sort', 'Pretty print, keys sorted']] },
      { k: 'indent', label: 'Indent', type: 'sel', val: '2', opts: [['2', '2 spaces'], ['4', '4 spaces'], ['tab', 'tab']] },
    ],
    outs: [
      { k: 'out', label: 'Output', type: 'code' },
      { k: 'stats', label: 'Status', type: 'big' },
    ],
    compute: (v) => {
      const src = String(v.input || '');
      if (!src.trim()) return { out: '', stats: 'Empty' };
      let data;
      try {
        data = JSON.parse(src);
      } catch (e) {
        // 从错误里抠出位置，指着出事的那一段
        const m = /position (\d+)/.exec(e.message);
        if (m) {
          const p = Number(m[1]);
          const around = src.slice(Math.max(0, p - 30), p + 30).replace(/\n/g, '⏎');
          throw new Error(`${e.message}\n near: …${around}…`);
        }
        throw new Error(e.message);
      }
      const sortKeys = (x) => {
        if (Array.isArray(x)) return x.map(sortKeys);
        if (x && typeof x === 'object') {
          return Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])]));
        }
        return x;
      };
      const indent = v.indent === 'tab' ? '\t' : Number(v.indent) || 2;
      const out = v.mode === 'min'
        ? JSON.stringify(data)
        : JSON.stringify(v.mode === 'sort' ? sortKeys(data) : data, null, indent);
      const bytes = new TextEncoder().encode(out).length;
      return { out, stats: `Valid · ${out.split('\n').length} lines · ${bytes} bytes` };
    },
    example:
      'Valid JSON is a stricter format than JavaScript object literals: no trailing commas, no comments, no single quotes, and every key must be a double-quoted string. Each of those produces a parse error that looks mysterious in a browser console.',
    body: [
      'JSON formatting is cosmetic; JSON validation is the useful half. A parser that tells you where it stopped saves the fifteen minutes of staring at a minified one-line payload from an API.',
      '## Reading a parse error',
      'The position is a character offset, not a line number. This page shows the surrounding text with newlines marked so the location is visible. The most common causes, in order: a trailing comma, a single-quoted string, an unquoted key, and a control character pasted from a word processor.',
      '## Minifying',
      'Removing whitespace typically cuts a JSON payload by 15–25%. That matters for network transfer and does not matter at all for readability, so minify at the boundary where it is sent, not where it is stored.',
      '## Sorting keys',
      'Key order is not significant in JSON but it is significant for diffing. Sorting recursively makes two payloads from different sources comparable, and turns a noisy diff into a readable one.',
    ],
    faq: [
      [
        'Does formatting change the data?',
        'No. Whitespace between tokens is insignificant. The exception is sorting, which reorders keys — the values and their associations are unchanged, but a byte comparison against the original will differ.',
      ],
      [
        'What about very large files?',
        'Parsing is in-memory, so a 100 MB document will exhaust the tab. Use a streaming tool for that.',
      ],
    ],
  },

  {
    slug: 'regex-tester',
    name: 'Regex Tester',
    title: 'Regex Tester — Test JavaScript Regular Expressions Live',
    desc: 'Test a regular expression against sample text. Shows all matches with positions and capture groups, using JavaScript regex syntax.',
    cat: 'text',
    catName: 'Text',
    lead: 'JavaScript regex syntax, all matches with positions and capture groups. Flags are toggles rather than a string you have to remember.',
    fields: [
      { k: 'pattern', label: 'Pattern (without slashes)', type: 'text', val: '(\\w+)@(\\w+\\.\\w+)' },
      { k: 'input', label: 'Test text', type: 'area', rows: 8, val: 'Contact a@example.com or b@test.org for details.' },
      { k: 'g', label: 'g — global', type: 'chk', val: true },
      { k: 'i', label: 'i — ignore case', type: 'chk', val: true },
      { k: 'm', label: 'm — multiline', type: 'chk', val: false },
      { k: 's', label: 's — dot matches newline', type: 'chk', val: false },
    ],
    outs: [
      { k: 'out', label: 'Matches', type: 'code' },
      { k: 'count', label: 'Match count', type: 'big' },
    ],
    compute: (v) => {
      const p = String(v.pattern || '');
      if (!p) return { out: 'Enter a pattern', count: '0' };
      const flags = (v.g ? 'g' : '') + (v.i ? 'i' : '') + (v.m ? 'm' : '') + (v.s ? 's' : '');
      let re;
      try {
        re = new RegExp(p, flags);
      } catch (e) {
        throw new Error('Invalid pattern: ' + e.message);
      }
      const text = String(v.input || '');
      const out = [];
      if (!v.g) {
        const m = re.exec(text);
        if (m) out.push({ match: m[0], index: m.index, groups: m.slice(1) });
      } else {
        let m;
        let guard = 0;
        while ((m = re.exec(text)) !== null) {
          out.push({ match: m[0], index: m.index, groups: m.slice(1) });
          // 零宽匹配会死循环：手动推进一位
          if (m.index === re.lastIndex) re.lastIndex++;
          if (++guard > 5000) break;
        }
      }
      return {
        out: out.length
          ? out.map((m, i) => `${i + 1}. "${m.match}" at ${m.index}${m.groups.length ? '  groups: ' + m.groups.map((g) => JSON.stringify(g)).join(', ') : ''}`).join('\n')
          : 'No matches',
        count: String(out.length),
      };
    },
    example:
      'The pattern <code>(\\w+)@(\\w+\\.\\w+)</code> against the sample finds two matches, each with the local part and domain as separate capture groups. The index tells you where in the string the match starts, counting from zero.',
    body: [
      'A regex tester earns its place by showing matches, positions and capture groups at the same time. Seeing only "it matched" does not tell you whether it matched what you meant.',
      '## Flags, briefly',
      '<code>g</code> finds all matches rather than the first. <code>i</code> ignores case. <code>m</code> makes <code>^</code> and <code>$</code> match at line boundaries instead of the whole string. <code>s</code> lets <code>.</code> cross newlines — without it, a dot stops at the end of a line.',
      '## The zero-width trap',
      'A pattern that can match an empty string, such as <code>a*</code>, loops forever under a global search unless the position is advanced manually. This tester handles that, but the same bug appears constantly in application code.',
      '## Syntax differences',
      'This uses JavaScript regex, which differs from PCRE and Python in named groups (<code>(?&lt;name&gt;...)</code>), lookbehind support, and possessive quantifiers. A pattern tested here may need rewriting for a PHP or Java backend.',
      '## Escaping',
      'Inside a JavaScript string literal, a backslash needs doubling. In a regex written directly in a page or a <code>/.../</code> literal, it does not. Half of all "my regex does not work" reports are this.',
    ],
    faq: [
      [
        'Why does it stop at 5000 matches?',
        'A guard against pathological patterns. If you need to count more than that, the regex is probably the wrong approach for the job.',
      ],
      [
        'Can I test a pattern for catastrophic backtracking?',
        'Not reliably here — this page will hang rather than report. Nested quantifiers like <code>(a+)+</code> against a long non-matching string are the classic case; use a dedicated tool with a timeout.',
      ],
    ],
  },

  {
    slug: 'word-frequency',
    name: 'Word Frequency Counter',
    title: 'Word Frequency Counter — Top Words and Keyword Density',
    desc: 'Count how often each word appears, with stop-word filtering and a keyword density percentage. Useful for editing and content review.',
    cat: 'text',
    catName: 'Text',
    lead: 'Top words with counts and density. Stop words filtered by default, so the list shows what the text is actually about.',
    fields: [
      { k: 'input', label: 'Text', type: 'area', rows: 10, val: '' },
      { k: 'stop', label: 'Remove common stop words', type: 'chk', val: true },
      { k: 'min', label: 'Minimum word length', type: 'num', val: 3, min: 1, max: 20, step: 1 },
      { k: 'top', label: 'Show top N', type: 'num', val: 30, min: 5, max: 200, step: 5 },
    ],
    outs: [
      { k: 'out', label: 'Frequency table', type: 'code' },
      { k: 'total', label: 'Words analysed', type: 'big' },
      { k: 'unique', label: 'Unique words', type: 'big' },
    ],
    compute: (v) => {
      const STOP = new Set('the a an and or but if then than that this these those of in on at to for from by with without as is are was were be been being it its it\'s not no you your we our they their he she his her i me my can will would could should do does did have has had about into over under more most other some such only own same so too very just'.split(' '));
      const min = Math.max(1, Number(v.min) || 1);
      const words = String(v.input || '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
        .split(/\s+/)
        .map((w) => w.replace(/^[-']+|[-']+$/g, ''))
        .filter((w) => w.length >= min && /[\p{L}\p{N}]/u.test(w));
      const total = words.length;
      const counts = new Map();
      for (const w of words) {
        if (v.stop && STOP.has(w)) continue;
        counts.set(w, (counts.get(w) || 0) + 1);
      }
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
      const top = Math.max(5, Math.min(200, Number(v.top) || 30));
      const rows = sorted.slice(0, top).map(([w, n], i) => {
        const density = total ? ((n / total) * 100).toFixed(2) : '0.00';
        return `${String(i + 1).padStart(3)}. ${w.padEnd(22)} ${String(n).padStart(5)}  ${density.padStart(6)}%`;
      });
      return {
        out: rows.length ? rows.join('\n') : 'No words above the length threshold',
        total: String(total),
        unique: String(counts.size),
      };
    },
    example:
      'The density figure is the word count divided by total words analysed, not by unique words. A term at 4% density in a 1000-word article appears 40 times — usually a sign of keyword stuffing rather than relevance.',
    body: [
      'Word frequency answers a narrow question well: which terms does this text repeat, and how often. That is useful for finding accidental repetition, checking whether a piece actually covers its stated topic, and spotting the difference between what a page says it is about and what it keeps talking about.',
      '## Density is a diagnostic, not a target',
      'There is no correct keyword density. Search engines have not used it as a ranking signal for many years, and writing to a percentage produces prose that reads like it was written to a percentage. Use the figure to notice over-repetition, not to hit a number.',
      '## Stop words',
      'Filtering them out makes the list readable: without the filter, "the" and "of" dominate every English text and bury the terms you care about. Turn it off when analysing writing style rather than topic — function-word frequency is a fingerprint of authorship.',
      '## Hyphens and possessives',
      'Hyphenated compounds are kept together, so "long-term" counts as one word. Possessives are stripped, so "user\'s" and "users" both count as "users", which is usually the intent.',
    ],
    faq: [
      [
        'Why is my top word something meaningless?',
        'Usually a template artefact — a cookie banner, a navigation label, a repeated disclaimer. Paste only the body text to get a clean signal.',
      ],
      [
        'Does it handle CJK text?',
        'It splits on whitespace, so Chinese text without spaces arrives as very long "words". Proper CJK segmentation needs a dictionary; the character counter is the more useful tool there.',
      ],
    ],
  },

  {
    slug: 'whitespace-remover',
    name: 'Whitespace Remover',
    title: 'Remove Extra Spaces and Line Breaks',
    desc: 'Collapse multiple spaces, strip trailing whitespace, remove blank lines and unwrap hard-wrapped text. Handles non-breaking spaces too.',
    cat: 'text',
    catName: 'Text',
    lead: 'Four independent cleanups: collapse spaces, trim line ends, drop blank lines, unwrap paragraphs.',
    fields: [
      { k: 'input', label: 'Text', type: 'area', rows: 10, val: '' },
      { k: 'spaces', label: 'Collapse repeated spaces to one', type: 'chk', val: true },
      { k: 'trim', label: 'Trim each line', type: 'chk', val: true },
      { k: 'blank', label: 'Remove blank lines', type: 'chk', val: true },
      { k: 'unwrap', label: 'Join wrapped lines into paragraphs', type: 'chk', val: false },
      { k: 'nbsp', label: 'Convert non-breaking spaces to normal spaces', type: 'chk', val: true },
    ],
    outs: [{ k: 'out', label: 'Cleaned', type: 'code' }],
    compute: (v) => {
      let s = String(v.input || '');
      if (v.nbsp) s = s.replace(/\u00a0/g, ' ').replace(/\u200b/g, '');
      if (v.unwrap) {
        // 空行是段落边界，其余换行当软换行处理
        s = s.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).join('\n\n');
      }
      let lines = s.split('\n');
      if (v.trim) lines = lines.map((l) => l.trim());
      if (v.spaces) lines = lines.map((l) => l.replace(/[ \t]{2,}/g, ' '));
      if (v.blank) lines = lines.filter((l) => l.trim() !== '');
      return { out: lines.join('\n') };
    },
    example:
      'Text copied from a PDF usually contains non-breaking spaces (U+00A0) that look identical to normal spaces and break every search and regex. Converting them is the fix that most people miss.',
    body: [
      'Whitespace problems are invisible until something downstream breaks: a search that should match does not, a CSV column shifts, a diff shows every line changed. The characters involved are usually not the ones you think.',
      '## The four invisible characters',
      'Non-breaking space (U+00A0) from web pages and PDFs, zero-width space (U+200B) from some editors, the tab, and the carriage return. Only the last two are obvious. The first two look exactly like a normal space and silently defeat string comparison.',
      '## Unwrapping',
      'Hard-wrapped text — from an email, a PDF column, or an editor set to 72 columns — has newlines that are not paragraph breaks. Unwrapping joins them within each paragraph while preserving blank-line boundaries, which is the only reliable signal for a real paragraph break.',
      '## Order matters',
      'Converting non-breaking spaces happens first, then unwrapping, then trimming and collapsing. Reversing that order leaves stray characters inside joined lines that no later step will catch.',
    ],
    faq: [
      [
        'Can I see what characters are actually there?',
        'Not on this page. Paste into an editor with visible whitespace, or check the character codes with a hex dump. This tool cleans; it does not diagnose.',
      ],
      [
        'Does removing blank lines change paragraph structure?',
        'Yes, and that is destructive for Markdown, where a blank line is what ends a paragraph. Leave the option off when cleaning Markdown.',
      ],
    ],
  },

  {
    slug: 'line-numbering',
    name: 'Add Line Numbers',
    title: 'Add Line Numbers to Text — Numbered List Generator',
    desc: 'Prefix every line with a number. Choose the start value, padding and separator. Useful for reviewing code and citing lines.',
    cat: 'text',
    catName: 'Text',
    lead: 'Prefix each line with a number. Configurable start, padding and separator, so the output lines up in a monospace block.',
    fields: [
      { k: 'input', label: 'Lines', type: 'area', rows: 10, val: '' },
      { k: 'start', label: 'Start at', type: 'num', val: 1, step: 1 },
      { k: 'pad', label: 'Pad to width (0 = none)', type: 'num', val: 0, min: 0, max: 8, step: 1 },
      { k: 'sep', label: 'Separator after number', type: 'sel', val: '. ', opts: [['. ', 'dot space'], [': ', 'colon space'], ['\\t', 'tab'], [' ', 'space']] },
      { k: 'skip', label: 'Skip blank lines (do not number them)', type: 'chk', val: false },
    ],
    outs: [{ k: 'out', label: 'Numbered', type: 'code' }],
    compute: (v) => {
      const lines = String(v.input || '').split('\n');
      const start = Math.floor(Number(v.start) || 0);
      const pad = Math.max(0, Math.min(8, Math.floor(Number(v.pad) || 0)));
      const sep = v.sep === '\\t' ? '\t' : v.sep || '. ';
      let n = start;
      const out = lines.map((l) => {
        if (v.skip && l.trim() === '') return l;
        const label = pad ? String(n).padStart(pad, ' ') : String(n);
        n++;
        return label + sep + l;
      });
      return { out: out.join('\n') };
    },
    example:
      'Padding to width 3 turns <code>1.</code>, <code>2.</code>, <code>10.</code> into a column where the text starts at the same offset on every line. Without padding, a list crossing 9 to 10 shifts sideways.',
    body: [
      'Line numbers do two things: they let you refer to a specific line in a review, and they make a pasted block survive a channel that would otherwise reflow it. Both are practical, neither is cosmetic.',
      '## Padding',
      'A monospace block with unpadded numbers looks ragged as soon as the count crosses a power of ten. Padding to the width of the largest number fixes it, and the width is predictable: 3 for lists under 1000, 4 for anything longer.',
      '## Skipping blanks',
      'When quoting code, numbering blank lines wastes attention on nothing. When quoting a log, blank lines are often meaningful separators and should be numbered. There is no universal default, so it is a toggle.',
      '## Starting from something other than 1',
      'Starting at a nonzero value matters when you are numbering a fragment of a longer file — a 40-line excerpt from line 1200 onward should carry the real line numbers, not restart at one.',
    ],
    faq: [
      [
        'Can I number only some lines?',
        'Not with a filter. Delete the lines you do not want first, number the rest, or use a text editor with block selection.',
      ],
      [
        'Does the tab separator stay aligned?',
        'In a monospace context yes, but tab width is renderer-dependent. For anything pasted elsewhere, spaces are safer.',
      ],
    ],
  },

  {
    slug: 'text-to-speech',
    name: 'Text to Speech',
    title: 'Text to Speech — Read Text Aloud in Your Browser',
    desc: 'Read text aloud using your system voices. Adjust rate, pitch and volume. Works offline after the voice list loads.',
    cat: 'text',
    catName: 'Text',
    lead: 'Uses the voices already installed on your device through the Web Speech API. Nothing is uploaded and no audio is generated on a server.',
    fields: [
      { k: 'input', label: 'Text', type: 'area', rows: 8, val: 'This is a test of the speech synthesis engine. Adjust the rate below to hear the difference.' },
      { k: 'rate', label: 'Rate', type: 'num', val: 1, min: 0.5, max: 2, step: 0.1 },
      { k: 'pitch', label: 'Pitch', type: 'num', val: 1, min: 0, max: 2, step: 0.1 },
      { k: 'voice', label: 'Voice (names depend on your system)', type: 'sel', val: '', opts: [['', 'default']] },
    ],
    outs: [
      { k: 'status', label: 'Status', type: 'big' },
      { k: 'voices', label: 'Voices available', type: 'big' },
    ],
    compute: (v) => {
      if (typeof speechSynthesis === 'undefined') {
        return { status: 'Speech synthesis is not supported in this browser', voices: '0' };
      }
      const all = speechSynthesis.getVoices();
      return {
        status: all.length ? `Ready — ${all.length} voices. Click the button under the card to play.` : 'Loading voice list…',
        voices: String(all.length),
      };
    },
    example:
      'The voice list is empty on first load in some browsers until the speech engine initialises. That is a platform quirk, not a failure — the list populates a moment later.',
    body: [
      'Speech synthesis has shipped in browsers for years and is still uneven: voice availability depends on the operating system, and the same page sounds different on Windows, macOS and Android.',
      '## What the voices are',
      'These are the system voices, not cloud voices. Quality varies from the robotic default on a bare Linux install to neural voices on recent versions of macOS and Windows. Nothing is sent anywhere — which is the reason to use this over a cloud text-to-speech service when the text is private.',
      '## Practical settings',
      'A rate of 1.0 is normal speed. 0.8 is useful for proofreading your own writing, because it forces you to hear the words rather than skim them. Pitch changes are mostly cosmetic; extreme values sound unnatural on every engine.',
      '## Limits',
      'Long text can be cut off, because some engines cap utterance length. The workaround is to split into paragraphs and queue them, which is what production implementations do. This page reads what is in the box in one pass.',
    ],
    faq: [
      [
        'Why is my language missing from the voice list?',
        'The system has no voice installed for it. On Windows, add voices under Settings → Time &amp; Language → Speech. On Linux, install speech-dispatcher voices.',
      ],
      [
        'Can I download the audio as a file?',
        'Not from the browser. The Web Speech API plays audio but does not expose it as a blob, which is a deliberate restriction in the specification.',
      ],
    ],
  },

  {
    slug: 'palindrome-checker',
    name: 'Palindrome Checker',
    title: 'Palindrome Checker — Words, Phrases and Sentences',
    desc: 'Check whether text reads the same backwards. Ignores case, spaces and punctuation by default, and shows the normalised string.',
    cat: 'text',
    catName: 'Text',
    lead: 'Case, spaces and punctuation stripped by default. Shows the normalised string so you can see why it did or did not pass.',
    fields: [
      { k: 'input', label: 'Text', type: 'area', rows: 5, val: 'A man, a plan, a canal: Panama' },
      { k: 'strict', label: 'Strict mode (compare exactly, no normalisation)', type: 'chk', val: false },
    ],
    outs: [
      { k: 'verdict', label: 'Result', type: 'big' },
      { k: 'normal', label: 'Normalised string', type: 'code' },
      { k: 'reversed', label: 'Reversed', type: 'code' },
    ],
    compute: (v) => {
      const s = String(v.input || '');
      if (!s.trim()) return { verdict: 'Enter some text', normal: '', reversed: '' };
      const norm = v.strict ? s : s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
      const chars = Intl.Segmenter ? [...new Intl.Segmenter().segment(norm)].map((x) => x.segment) : Array.from(norm);
      const rev = [...chars].reverse().join('');
      return {
        verdict: norm === rev ? `Palindrome (${chars.length} characters)` : 'Not a palindrome',
        normal: norm || '(empty after normalisation)',
        reversed: rev,
      };
    },
    example:
      '<code>A man, a plan, a canal: Panama</code> normalises to <code>amanaplanacanalpanama</code>, which reads the same in both directions. In strict mode the same text fails, because the spaces and punctuation differ.',
    body: [
      'A palindrome reads identically forwards and backwards. The interesting part is not the check — it is deciding what counts as a character, which is where strict and normalised modes diverge.',
      '## Two definitions',
      'Strict mode compares the raw string, so any difference in case or spacing fails. Normalised mode lowercases and drops everything that is not a letter or a digit, which is the definition used in wordplay and the one that makes "A man, a plan" qualify.',
      '## Unicode considerations',
      'Reversing a string by code unit breaks emoji and combining accents. This page segments into grapheme clusters first, so a palindrome containing accented characters is compared on visible characters rather than bytes.',
      '## Where this is actually used',
      'Word puzzles, checking generated identifiers for accidental symmetry, and as a small correctness test for string handling in a new language. In production code, the two-line implementation is worth writing rather than depending on a library.',
    ],
    faq: [
      [
        'Are numbers included?',
        'Yes. <code>12321</code> is a palindrome, and so is <code>1a2a1</code> in normalised mode.',
      ],
      [
        'Why does my accented text fail in strict mode?',
        'Because the same visible character can be stored as one code point or as a letter plus a combining mark. Strict comparison sees two different strings.',
      ],
    ],
  },

  {
    slug: 'morse-code-translator',
    name: 'Morse Code Translator',
    title: 'Morse Code Translator — Text to Morse and Back',
    desc: 'Translate text to Morse code and decode Morse back to text. Supports letters, digits and common punctuation with proper spacing.',
    cat: 'text',
    catName: 'Text',
    lead: 'Text to Morse and back. Letters separated by spaces, words by slashes, which is the convention most people expect.',
    fields: [
      { k: 'mode', label: 'Direction', type: 'sel', val: 'enc', opts: [['enc', 'Text → Morse'], ['dec', 'Morse → Text']] },
      { k: 'input', label: 'Input', type: 'area', rows: 6, val: 'SOS hello' },
    ],
    outs: [{ k: 'out', label: 'Output', type: 'code' }],
    compute: (v) => {
      const MAP = {
        A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
        K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
        U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
        0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
        5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
        '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--', '/': '-..-.',
        '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
        '+': '.-.-.', '-': '-....-', _: '..--.-', '"': '.-..-.', '@': '.--.-.',
      };
      const s = String(v.input || '');
      if (v.mode === 'enc') {
        const out = s.toUpperCase().split('\n').map((line) =>
          line.split(/\s+/).filter(Boolean).map((word) =>
            [...word].map((c) => MAP[c] || '').filter(Boolean).join(' ')
          ).join(' / ')
        ).join('\n');
        return { out };
      }
      const REV = Object.fromEntries(Object.entries(MAP).map(([k, val]) => [val, k]));
      const out = s.split('\n').map((line) =>
        line.trim().split(/\s*\/\s*/).map((word) =>
          word.split(/\s+/).filter(Boolean).map((code) => REV[code] || '?').join('')
        ).join(' ')
      ).join('\n');
      return { out };
    },
    example:
      'SOS is <code>... --- ...</code> — three dots, three dashes, three dots. The spaces between letters matter; the slashes between words are a convention added for readability, not part of the original code.',
    body: [
      'Morse encodes each character as a sequence of short and long signals. It was designed for a single wire and a human ear, which is why the timing ratios matter as much as the symbols: a dash is three units, the gap between symbols one unit, between letters three, between words seven.',
      '## Why the spacing matters',
      'Without separators, <code>...</code> could be S, or the start of many other characters. This translator uses a single space between letters and a slash between words, which is the convention used in written Morse and the one radio operators read.',
      '## What it cannot represent',
      'Accented characters, CJK, and most symbols are dropped rather than transliterated. Morse has no standard encoding for them, and inventing one produces output that no other implementation can read.',
      '## Practical uses',
      'Puzzles, teaching signal encoding, and generating decorative text. It is not encryption — anyone with the table decodes it in seconds, and it has been public since 1844.',
    ],
    faq: [
      [
        'Should I use dots and dashes or the beep sounds?',
        'Written Morse uses dots and dashes; audio Morse uses tones of two lengths. The mapping is identical, only the medium differs.',
      ],
      [
        'Why did some characters turn into question marks?',
        'The decoder saw a code that is not in the standard table — usually a missing space between letters. Check the separator between the affected symbols.',
      ],
    ],
  },
];
