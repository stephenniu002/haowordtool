/**
 * 安全与凭据类工具。
 *
 * 共同点：这些东西用户不该交给第三方站。别人的 TOTP 生成器意味着别人的服务器
 * 拿到过你的种子；别人的哈希工具意味着明文经过了他的日志。这里全部在本地算，
 * WebCrypto 就在浏览器里。
 *
 * 约束：compute 必须是自包含函数——生成时用 toString() 落到页面，闭包拿不到
 * 模块作用域里的任何东西。要用什么就在函数体里自己写。
 */

export default [
  {
    slug: 'totp-generator',
    name: '2FA Code Generator (TOTP)',
    title: '2FA Code Generator — TOTP Authenticator in Your Browser',
    desc: 'Generate 6-digit TOTP codes from a base32 secret. Works offline, nothing is sent to a server. Same algorithm as Google Authenticator.',
    cat: 'security',
    catName: 'Security',
    lead: 'Type the base32 secret from your 2FA setup and get the current 6-digit code, plus the next one. Computed locally with WebCrypto.',
    fields: [
      { k: 'secret', label: 'Base32 secret', type: 'text', val: 'JBSWY3DPEHPK3PXP', ph: 'JBSWY3DPEHPK3PXP' },
      { k: 'digits', label: 'Digits', type: 'sel', val: '6', opts: ['6', '8'] },
      { k: 'period', label: 'Period (seconds)', type: 'sel', val: '30', opts: ['30', '60'] },
    ],
    outs: [
      { k: 'code', label: 'Current code', type: 'big' },
      { k: 'left', label: 'Seconds remaining', type: 'big' },
      { k: 'next', label: 'Next code', type: 'big' },
    ],
    tick: 1000,
    compute: async (v) => {
      const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const clean = String(v.secret || '').toUpperCase().replace(/[\s-]/g, '').replace(/=+$/, '');
      if (!clean) throw new Error('Enter a base32 secret');
      let bits = '';
      for (const ch of clean) {
        const i = B32.indexOf(ch);
        if (i < 0) throw new Error(`"${ch}" is not a base32 character (A–Z and 2–7 only)`);
        bits += i.toString(2).padStart(5, '0');
      }
      const bytes = new Uint8Array(Math.floor(bits.length / 8));
      for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
      if (!bytes.length) throw new Error('Secret is too short');

      const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
      const digits = Number(v.digits) || 6;
      const period = Number(v.period) || 30;

      const codeAt = async (counter) => {
        const buf = new ArrayBuffer(8);
        const dv = new DataView(buf);
        // counter 超过 2^32 的极端情况用高 32 位兜住
        dv.setUint32(0, Math.floor(counter / 4294967296));
        dv.setUint32(4, counter >>> 0);
        const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, buf));
        const off = mac[mac.length - 1] & 0x0f;
        const bin =
          ((mac[off] & 0x7f) << 24) | (mac[off + 1] << 16) | (mac[off + 2] << 8) | mac[off + 3];
        return String(bin % 10 ** digits).padStart(digits, '0');
      };

      const now = Math.floor(Date.now() / 1000);
      const counter = Math.floor(now / period);
      const code = await codeAt(counter);
      const next = await codeAt(counter + 1);
      return {
        code,
        left: period - (now % period),
        next,
      };
    },
    example:
      'Secret <code>JBSWY3DPEHPK3PXP</code> is the standard test vector. At any moment it produces one 6-digit code, valid for the rest of the current 30-second window — the countdown above tells you how much of it is left.',
    body: [
      'A time-based one-time password is an HMAC over the current time step. The server and your device share a secret; both derive the same 6 digits from the same 30-second window without ever transmitting the code twice. That is why the codes work with no network at all — this page never calls out to anything.',
      '## How to use it',
      'Paste the secret exactly as your service showed it. Most setup screens display a base32 string next to the QR code — often hidden behind an "enter this manually" or "can\'t scan?" link. Spaces and hyphens are ignored, and lowercase is fine.',
      'If a code is rejected, check the device clock before anything else. TOTP has no tolerance for drift beyond the window your service allows, and a phone that is two minutes fast will produce codes that never validate. Some services accept the previous window; most accept one step of skew.',
      '## What this page does not do',
      'It does not store the secret. Close the tab and it is gone — which is the right behaviour for a shared computer, and the wrong behaviour if you expected an authenticator replacement. For daily use, keep a real authenticator app that stores secrets in the system keystore.',
    ],
    faq: [
      [
        'Why does the code change every 30 seconds?',
        'The code is derived from the current Unix time divided by 30. When that counter increments, every input to the hash changes and so does the output. Services can be configured for 60-second steps; the selector above handles both.',
      ],
      [
        'Is it safe to paste my secret here?',
        'The value stays in this tab. There is no request, no analytics call carrying it, and no storage write. Verification is one keystroke away: open DevTools, watch the Network panel, and change the secret — no request fires.',
      ],
      [
        'Can I use this to log into my account right now?',
        'Yes, if you have the secret. Note that many services now require a second factor on top of TOTP, and some treat a fresh TOTP login from an unknown device as suspicious regardless of correctness.',
      ],
    ],
  },

  {
    slug: 'totp-secret-generator',
    name: 'TOTP Secret Generator',
    title: 'TOTP Secret Generator — Base32 Key and otpauth:// URI',
    desc: 'Generate a cryptographically random base32 secret for TOTP, plus a ready-to-scan otpauth:// URI. 160-bit keys, generated in your browser.',
    cat: 'security',
    catName: 'Security',
    lead: 'Generate a 160-bit base32 secret and the matching otpauth:// URI for any authenticator app.',
    fields: [
      { k: 'label', label: 'Account label', type: 'text', val: 'you@example.com' },
      { k: 'issuer', label: 'Issuer (shown in the app)', type: 'text', val: 'MyApp' },
      { k: 'bits', label: 'Key size', type: 'sel', val: '160', opts: [['128', '128-bit'], ['160', '160-bit (recommended)'], ['256', '256-bit']] },
    ],
    outs: [
      { k: 'secret', label: 'Base32 secret', type: 'code' },
      { k: 'uri', label: 'otpauth:// URI', type: 'code' },
    ],
    compute: (v) => {
      const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      const bits = Number(v.bits) || 160;
      const buf = new Uint8Array(bits / 8);
      crypto.getRandomValues(buf);
      // RFC 4648 base32，末尾补位
      let acc = 0;
      let accBits = 0;
      let out = '';
      for (const byte of buf) {
        acc = (acc << 8) | byte;
        accBits += 8;
        while (accBits >= 5) {
          out += B32[(acc >>> (accBits - 5)) & 31];
          accBits -= 5;
        }
      }
      if (accBits > 0) out += B32[(acc << (5 - accBits)) & 31];

      const label = encodeURIComponent(String(v.label || 'account'));
      const issuer = encodeURIComponent(String(v.issuer || ''));
      const uri =
        `otpauth://totp/${issuer}:${label}` +
        `?secret=${out}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
      return { secret: out, uri };
    },
    example:
      'A 160-bit key becomes 32 base32 characters. That is the same key length Google Authenticator uses when it provisions a new account, and it is the length most servers assume.',
    body: [
      'A TOTP secret is just random bytes, encoded in base32 so it can be typed and scanned as text. Nothing about the format is secret — the secrecy is entirely in the randomness. This page uses <code>crypto.getRandomValues</code>, the browser CSPRNG, not <code>Math.random</code>, which is predictable enough to reconstruct from a handful of outputs.',
      '## Picking a key size',
      'RFC 4226 requires at least 128 bits and recommends 160. Six-digit codes only carry about 20 bits of entropy per attempt, so a longer key does not make individual guesses harder; it protects against offline attacks on a captured key. 160 bits is the interoperable default and what every authenticator app expects.',
      '## Using the URI',
      'The otpauth:// form is what a QR code encodes. Paste it into any QR generator that accepts text — the QR generator on this site does — and scan the result with your authenticator app. Keep the secret out of shared documents; the URI contains the key in plain text.',
      '## If you are building the server side',
      'Store the base32 secret encrypted at rest, and treat it as a long-term credential rather than a temporary token. Rate-limit verification attempts to a handful per minute per account, and reject codes from a window that has already been used for that account — replay within the same 30 seconds is otherwise possible.',
    ],
    faq: [
      [
        'Should I use SHA-256 or SHA-512 instead of SHA-1?',
        'Only if your server supports it and the client app does too. The otpauth spec allows it, but interoperability is poor — many apps silently fall back to SHA-1 and every code fails. SHA-1 here is used as an HMAC, where its collision weaknesses do not apply.',
      ],
      [
        'Can I regenerate the same secret later?',
        'No. It comes from the CSPRNG and is not derived from anything. Save it before closing the tab, or re-provision the account.',
      ],
    ],
  },

  {
    slug: 'password-strength-checker',
    name: 'Password Strength Checker',
    title: 'Password Strength Checker — Entropy and Crack Time Estimate',
    desc: 'Estimate password entropy and offline crack time. Runs locally, nothing is transmitted. Explains why length beats complexity rules.',
    cat: 'security',
    catName: 'Security',
    lead: 'Entropy in bits, the character pool it assumes, and how long an offline attacker would need at a given guess rate.',
    fields: [
      { k: 'pw', label: 'Password', type: 'text', val: '', ph: 'type or paste a password' },
      { k: 'rate', label: 'Attacker guess rate', type: 'sel', val: '1e10', opts: [['1e6', '1 million/s — online, throttled'], ['1e10', '10 billion/s — GPU against a fast hash'], ['1e12', '1 trillion/s — GPU cluster, MD5/SHA-1']] },
    ],
    outs: [
      { k: 'entropy', label: 'Entropy', type: 'big' },
      { k: 'pool', label: 'Assumed character pool', type: 'big' },
      { k: 'time', label: 'Estimated crack time (average)', type: 'big' },
      { k: 'verdict', label: 'Verdict', type: 'big' },
    ],
    compute: (v) => {
      const pw = String(v.pw || '');
      if (!pw) return { entropy: '0 bits', pool: '—', time: '—', verdict: 'Enter a password' };
      let pool = 0;
      if (/[a-z]/.test(pw)) pool += 26;
      if (/[A-Z]/.test(pw)) pool += 26;
      if (/[0-9]/.test(pw)) pool += 10;
      if (/[^a-zA-Z0-9]/.test(pw)) pool += 33;
      // 重复字符会显著降低实际空间，这里用「不同字符数」打个折扣，
      // 不做完整字典攻击模拟——那需要词表，浏览器里跑不动
      const distinct = new Set(pw).size;
      const repeatPenalty = distinct / pw.length;
      const entropy = pw.length * Math.log2(pool || 1) * (0.35 + 0.65 * repeatPenalty);

      const rate = Number(v.rate) || 1e10;
      const seconds = 2 ** entropy / 2 / rate;
      const human = (s) => {
        if (s < 1) return 'under a second';
        const u = [
          [60, 'second'], [60, 'minute'], [24, 'hour'], [365, 'day'],
          [1000, 'year'], [1000, 'thousand years'], [1000, 'million years'],
        ];
        let x = s;
        let name = 'second';
        for (const [div, n] of u) {
          name = n;
          if (x < div) break;
          x /= div;
        }
        if (x > 1000) return 'longer than the age of the universe';
        return `${x < 10 ? x.toFixed(1) : Math.round(x)} ${name}${x >= 1.5 ? 's' : ''}`;
      };
      const verdict =
        entropy < 40 ? 'Weak — brute-forced quickly' :
        entropy < 60 ? 'Fair — survives casual attacks' :
        entropy < 80 ? 'Strong' :
        'Very strong';
      return { entropy: `${entropy.toFixed(1)} bits`, pool: String(pool), time: human(seconds), verdict };
    },
    example:
      'A 20-character passphrase of random lowercase words carries roughly 100 bits; an 8-character password mixing cases, digits and symbols carries about 52. Doubling length multiplies the search space; adding one symbol class adds a single factor of about 1.3.',
    body: [
      'Entropy here is measured as <code>length × log2(pool)</code>, adjusted downward for repeated characters. That is the standard back-of-envelope model: it assumes an attacker who knows your character classes and searches the whole space uniformly. A real attacker does better — dictionaries, mangling rules, and every password from every breach — which is why a password that scores well here can still fall in minutes if it is a known phrase with substitutions.',
      '## Reading the numbers',
      'Forty bits is the line where a determined hobbyist with a GPU stops caring. Sixty bits is where a funded attacker starts to hesitate. Eighty and above is out of reach for offline attacks against a properly salted, slow hash. The crack-time figure assumes a fast hash; against bcrypt at a sensible cost factor, divide the effective rate by several orders of magnitude.',
      '## Why length wins',
      'Each additional character multiplies the search space by the pool size. Each additional character *class* multiplies it by a much smaller factor, and in practice reduces memorability, which pushes people toward reuse and written notes. A four-word passphrase beats a nine-character scramble on both entropy and recall.',
      '## What this checker cannot tell you',
      'It does not know whether your password appeared in a breach dump. A 30-character string published in a leak is worth zero bits regardless of what the arithmetic says. Check breach exposure separately, and use a password manager so that no two accounts share a secret.',
    ],
    faq: [
      [
        'Is my password sent anywhere?',
        'No. The calculation is arithmetic on the string in this tab. You can confirm with the Network panel: typing produces no requests at all.',
      ],
      [
        'Should I trust the crack-time number?',
        'Treat it as an order of magnitude, not a forecast. It answers "is this in the thousands or the quadrillions" and nothing finer. The guess rates in the selector bracket realistic GPU performance against fast hashes.',
      ],
      [
        'Why does it say a long repeated string is weak?',
        'Because it is. <code>aaaaaaaaaaaaaaaaaaaa</code> is 20 characters but only one distinct symbol; the repeat penalty in the model reflects that the search space collapses to the number of possible repeated strings, not to 26 to the twentieth.',
      ],
    ],
  },

  {
    slug: 'hash-generator',
    name: 'Hash Generator (SHA)',
    title: 'SHA Hash Generator — SHA-1, SHA-256, SHA-384, SHA-512',
    desc: 'Compute SHA hashes of any text in your browser. Compare against a known digest, or generate one for checksums and integrity checks.',
    cat: 'security',
    catName: 'Security',
    lead: 'Text in, hex digest out. Four algorithms at once, plus a comparison field for verifying a checksum.',
    fields: [
      { k: 'text', label: 'Text', type: 'area', rows: 5, val: 'hello', ph: 'text to hash' },
      { k: 'expect', label: 'Expected digest (optional)', type: 'text', val: '', ph: 'paste a digest to compare' },
    ],
    outs: [
      { k: 'sha1', label: 'SHA-1', type: 'code' },
      { k: 'sha256', label: 'SHA-256', type: 'code' },
      { k: 'sha384', label: 'SHA-384', type: 'code' },
      { k: 'sha512', label: 'SHA-512', type: 'code' },
      { k: 'match', label: 'Comparison', type: 'big' },
    ],
    compute: async (v) => {
      const text = String(v.text || '');
      const data = new TextEncoder().encode(text);
      const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
      const out = {};
      for (const algo of ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']) {
        out[algo.replace('-', '').toLowerCase()] = hex(await crypto.subtle.digest(algo, data));
      }
      const expect = String(v.expect || '').trim().toLowerCase();
      out.match = !expect
        ? 'No digest to compare'
        : Object.values(out).includes(expect)
          ? 'Match'
          : 'No match';
      return out;
    },
    example:
      'Hashing <code>hello</code> gives SHA-256 <code>2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824</code>. Change one letter and none of the 64 hex characters survive.',
    body: [
      'A cryptographic hash maps any input to a fixed-length digest. It is one-way, deterministic, and avalanche-sensitive: flipping a single bit of input changes about half the output bits. That is what makes it useful for integrity checks — a downloaded file either matches the published digest or it does not.',
      '## Which algorithm',
      'SHA-256 is the default for integrity and signatures. SHA-384 and SHA-512 are stronger and faster on 64-bit hardware but produce longer strings. SHA-1 is included for legacy checksums and old protocols; it is broken for collision resistance, meaning two different inputs can be crafted with the same digest, so do not use it where an attacker chooses the input.',
      '## The comparison field',
      'Paste a published digest into the last field and the page tells you whether any of the four algorithms produce it. This is the practical use: verifying that a release archive matches the checksum its author published. If none match, the file is not the file the author signed.',
      '## Hashing is not encryption',
      'There is no key and no way back. Hashing a password for storage is not enough on its own either — fast hashes are the wrong tool for that, because an attacker who steals the digest can test billions of candidates per second. Password storage needs a deliberately slow, salted function such as bcrypt, scrypt or Argon2.',
    ],
    faq: [
      [
        'Why is SHA-1 still offered?',
        'Because a large amount of existing tooling publishes SHA-1 digests, and comparing against them is a legitimate task. It is labelled rather than removed, with the collision caveat above.',
      ],
      [
        'Does the text encoding matter?',
        'Yes, and it is the usual cause of a mismatch. This page hashes UTF-8. A tool that hashes UTF-16 or Latin-1 will produce a different digest for the same visible text.',
      ],
    ],
  },

  {
    slug: 'hmac-generator',
    name: 'HMAC Generator',
    title: 'HMAC Generator — SHA-256 and SHA-512 Message Authentication',
    desc: 'Compute an HMAC signature from a message and a secret key. Useful for verifying webhook signatures and API request signing.',
    cat: 'security',
    catName: 'Security',
    lead: 'Message plus shared key, out comes the signature. SHA-256 and SHA-512, computed with WebCrypto.',
    fields: [
      { k: 'msg', label: 'Message', type: 'area', rows: 5, val: '', ph: 'the exact bytes that were signed' },
      { k: 'key', label: 'Secret key', type: 'text', val: '', ph: 'shared secret' },
      { k: 'algo', label: 'Algorithm', type: 'sel', val: 'SHA-256', opts: ['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'] },
      { k: 'fmt', label: 'Output format', type: 'sel', val: 'hex', opts: [['hex', 'hex'], ['b64', 'base64']] },
    ],
    outs: [{ k: 'sig', label: 'HMAC signature', type: 'code' }],
    compute: async (v) => {
      const enc = new TextEncoder();
      if (!String(v.key || '')) throw new Error('Enter the shared secret');
      const key = await crypto.subtle.importKey(
        'raw', enc.encode(String(v.key)), { name: 'HMAC', hash: v.algo || 'SHA-256' }, false, ['sign']
      );
      const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(String(v.msg || ''))));
      const out = v.fmt === 'b64'
        ? btoa(String.fromCharCode(...sig))
        : [...sig].map((b) => b.toString(16).padStart(2, '0')).join('');
      return { sig: out };
    },
    example:
      'Webhook providers sign the raw request body, not the parsed JSON. Re-serialising the payload before verifying changes whitespace and key order, and the signature fails — a common cause of "webhook signature invalid" when the secret is actually correct.',
    body: [
      'An HMAC combines a message with a secret key so that anyone holding the key can verify the message has not been altered, and anyone without it cannot forge a valid tag. Unlike a plain hash, an attacker who can compute hashes still cannot produce the tag without the key.',
      '## Verifying a webhook signature',
      'Take the raw body exactly as received — the bytes before any JSON parsing or pretty-printing. Put it in the message box, put the shared secret in the key box, and pick the algorithm the provider documents. Compare the output against the signature header. Comparison must be case-insensitive and, in real code, constant-time.',
      '## Common mismatches',
      'Three things break HMAC verification more often than anything else: re-serialised JSON, a secret that was base64-decoded when it should be used as-is (or the reverse), and a signature that is prefixed with an algorithm name such as <code>sha256=</code> that must be stripped before comparing.',
      '## What HMAC does not give you',
      'It does not hide the message — anyone can read it. It does not prevent replay: a captured valid request stays valid forever unless the payload carries a timestamp or nonce that the receiver checks. And it offers no forward secrecy; if the key leaks, every past message can be re-signed.',
    ],
    faq: [
      [
        'Should the key be hex, base64, or raw text?',
        'Whatever the provider issued. If they show a 64-character hex string, it is usually meant to be used as text, not decoded first. When verification fails, try both before assuming the secret is wrong.',
      ],
      [
        'Why not just hash the message and the key together?',
        'Because naive concatenation is vulnerable to length-extension attacks. HMAC\'s nested construction exists specifically to close that hole.',
      ],
    ],
  },

  {
    slug: 'uuid-generator',
    name: 'UUID Generator',
    title: 'UUID Generator — Random v4 UUIDs in Bulk',
    desc: 'Generate RFC 4122 version 4 UUIDs in your browser. Any quantity, lowercase or uppercase, with or without braces. No duplicates.',
    cat: 'security',
    catName: 'Security',
    lead: 'Bulk v4 UUIDs from the browser CSPRNG. Pick a count, copy the block.',
    fields: [
      { k: 'count', label: 'How many', type: 'num', val: 10, min: 1, max: 500, step: 1 },
      { k: 'upper', label: 'Uppercase', type: 'chk', val: false },
      { k: 'braces', label: 'Wrap in braces', type: 'chk', val: false },
    ],
    outs: [{ k: 'list', label: 'UUIDs', type: 'code' }],
    compute: (v) => {
      const n = Math.max(1, Math.min(500, Math.floor(Number(v.count) || 1)));
      const out = [];
      for (let i = 0; i < n; i++) {
        const b = new Uint8Array(16);
        crypto.getRandomValues(b);
        // RFC 4122：第 7 字节高 4 位置 0100（version 4），第 9 字节高 2 位置 10（variant）
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
        let u = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        if (v.upper) u = u.toUpperCase();
        if (v.braces) u = `{${u}}`;
        out.push(u);
      }
      return { list: out.join('\n') };
    },
    example:
      'A v4 UUID carries 122 random bits. You would need to generate about 2.7 × 10<sup>18</sup> of them before a 50% chance of any collision — which is why they are safe as database keys without a central sequence.',
    body: [
      'Version 4 UUIDs are random, not derived from time or hardware. That is the point: no machine identifier leaks, no ordering is implied, and two machines can generate concurrently without coordinating. The trade-off is that they are poor database index keys — random inserts scatter across B-tree pages, where a time-ordered UUIDv7 or a ULID would append.',
      '## Where the randomness comes from',
      '<code>crypto.getRandomValues</code>, the same CSPRNG used for keys. <code>Math.random</code> is a deterministic PRNG seeded from a few bytes of state; UUIDs built from it can be predicted, and there are documented cases of exactly that being exploited.',
      '## Braces and case',
      'The RFC canonical form is lowercase with hyphens and no braces. Braces are a legacy Microsoft convention that some .NET APIs still emit. Case is meaningless for the value but some validation regexes are case-sensitive, which is the only reason the toggle exists.',
      '## Version 4 specifically',
      'The generator sets the version nibble to 4 and the variant bits to RFC 4122, so the output validates as version 4 rather than merely looking like a UUID. The other versions — v1 time-based, v5 name-based — are deliberately not offered: v1 leaks MAC addresses, and v3/v5 are for deterministic derivation, which needs a namespace and a name rather than a button.',
    ],
    faq: [
      [
        'Are these safe as primary keys?',
        'For uniqueness, yes. For write throughput on a large table, no — random keys fragment the index. Use a sequential or time-ordered identifier for the clustered key and keep the UUID for external references.',
      ],
      [
        'Can two generated UUIDs collide?',
        'Only if the CSPRNG fails. At 122 random bits, generating a billion per second for a century gives a collision probability far below hardware error rates.',
      ],
    ],
  },

  {
    slug: 'base64-encoder',
    name: 'Base64 Encoder / Decoder',
    title: 'Base64 Encoder and Decoder — UTF-8 Safe',
    desc: 'Encode text to base64 or decode it back, with correct UTF-8 handling. Supports URL-safe alphabet and data URI output.',
    cat: 'security',
    catName: 'Security',
    lead: 'UTF-8 aware both ways. Emoji and CJK survive the round trip, which is where most online converters break.',
    fields: [
      { k: 'mode', label: 'Mode', type: 'sel', val: 'enc', opts: [['enc', 'Text → Base64'], ['dec', 'Base64 → Text']] },
      { k: 'input', label: 'Input', type: 'area', rows: 6, val: 'Hello, 世界 👋' },
      { k: 'urlsafe', label: 'URL-safe alphabet (-_ instead of +/)', type: 'chk', val: false },
    ],
    outs: [{ k: 'out', label: 'Output', type: 'code' }],
    compute: (v) => {
      const s = String(v.input || '');
      if (v.mode === 'enc') {
        const bytes = new TextEncoder().encode(s);
        let bin = '';
        for (const b of bytes) bin += String.fromCharCode(b);
        let b64 = btoa(bin);
        if (v.urlsafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        return { out: b64 };
      }
      let b64 = s.trim().replace(/\s+/g, '');
      if (v.urlsafe || /[-_]/.test(b64)) b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      // 补齐 padding：缺了 atob 会直接抛
      while (b64.length % 4) b64 += '=';
      let bin;
      try {
        bin = atob(b64);
      } catch {
        throw new Error('Not valid base64 — check for stray characters or a truncated string');
      }
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return { out: new TextDecoder().decode(bytes) };
    },
    example:
      'Base64 is not encryption and not compression. It inflates data by about 33% and anyone can reverse it. It exists so binary can travel through channels that only accept text.',
    body: [
      'Base64 maps every 3 bytes to 4 printable characters. That is the whole algorithm. Its purpose is transport: email bodies, JSON fields, data URIs, HTTP basic auth, and JWT segments all need binary to survive a text-only channel.',
      '## The UTF-8 trap',
      'The browser <code>btoa()</code> function accepts only Latin-1. Pass it a string containing CJK or an emoji and it throws <code>InvalidCharacterError</code>. This page encodes to UTF-8 bytes first, so the output matches what other languages produce and decodes back to the original text. If a converter mangles accents or refuses emoji, that is the bug.',
      '## URL-safe variant',
      'Standard base64 uses <code>+</code> and <code>/</code>, both of which have meaning inside a URL or a filename. The URL-safe alphabet substitutes <code>-</code> and <code>_</code> and drops the padding. JWTs use it — a token with a <code>+</code> in it is a standard-alphabet token that will not survive a query string.',
      '## What it is not',
      'Encoding something in base64 does not hide it; the first thing anyone does with an unknown blob is decode it. Do not use it to obscure passwords, API keys or personal data.',
    ],
    faq: [
      [
        'Why does my decoded output look like mojibake?',
        'The bytes were not UTF-8 to begin with — probably Latin-1 or a Windows code page. Base64 carries bytes, not an encoding; the interpretion happens at the ends.',
      ],
      [
        'Does base64 make files bigger?',
        'Yes, by 4/3 plus padding. A 100 KB image becomes roughly 137 KB of text.',
      ],
    ],
  },

  {
    slug: 'url-encoder',
    name: 'URL Encoder / Decoder',
    title: 'URL Encoder and Decoder — Percent-Encoding Tool',
    desc: 'Percent-encode or decode text for URLs and query strings. Choose between full component encoding and query-string rules.',
    cat: 'security',
    catName: 'Security',
    lead: 'encodeURIComponent or the looser query-string rules, both ways, with the difference explained.',
    fields: [
      { k: 'mode', label: 'Mode', type: 'sel', val: 'enc', opts: [['enc', 'Encode'], ['dec', 'Decode']] },
      { k: 'input', label: 'Input', type: 'area', rows: 5, val: 'a b&c=d/中文' },
      { k: 'kind', label: 'Scope', type: 'sel', val: 'component', opts: [['component', 'Component (encode everything reserved)'], ['query', 'Query string (keep & = ? /)']] },
    ],
    outs: [{ k: 'out', label: 'Output', type: 'code' }],
    compute: (v) => {
      const s = String(v.input || '');
      if (v.mode === 'enc') {
        return { out: v.kind === 'query' ? encodeURI(s) : encodeURIComponent(s) };
      }
      try {
        return { out: decodeURIComponent(s.replace(/\+/g, ' ')) };
      } catch {
        throw new Error('Malformed percent-encoding — look for a lone % or a truncated byte like %E4');
      }
    },
    example:
      'A space becomes <code>%20</code> in a path but <code>+</code> in an <code>application/x-www-form-urlencoded</code> body. Both decode to the same character; mixing them up produces literal plus signs in submitted forms.',
    body: [
      'Percent-encoding replaces characters that are not allowed in a URL with a percent sign and two hex digits of their UTF-8 bytes. Everything else passes through. Which characters are "not allowed" depends on where in the URL the string lands, and that is where most encoding bugs come from.',
      '## Two scopes, two rules',
      '<code>encodeURIComponent</code> escapes everything except letters, digits and <code>- _ . ! ~ * \' ( )</code>. Use it for a value being placed into a single parameter — a search term, a filename, a redirect target. <code>encodeURI</code> leaves the structural characters <code>& = ? / # :</code> alone and is for encoding a whole URL you already assembled.',
      'Encoding a complete URL with <code>encodeURIComponent</code> is a classic mistake: the slashes and query separators get escaped, and the server receives one long path segment.',
      '## Double encoding',
      'If a parameter arrives with <code>%25</code> where you expect <code>%</code>, it was encoded twice — usually once by the form and once by the code that built the link. Decoding once reveals the second layer; decoding blindly in a loop is how injection payloads slip past filters, so decode exactly as many times as you encoded.',
      '## Not a security control',
      'Percent-encoding is a transport rule, not a sanitiser. Encoding user input does not make it safe to concatenate into SQL, HTML or a shell command. Those need their own escaping at their own boundary.',
    ],
    faq: [
      [
        'Why did my plus sign disappear?',
        'In query strings, <code>+</code> means space under the form-encoding rules. To send a literal plus, encode it as <code>%2B</code>.',
      ],
      [
        'Should I encode the whole URL or just the parameters?',
        'Just the parameter values. Encode each value separately, then join with <code>&</code> — that keeps the structure intact and the values unambiguous.',
      ],
    ],
  },

  {
    slug: 'jwt-decoder',
    name: 'JWT Decoder',
    title: 'JWT Decoder — Inspect Header and Payload Claims',
    desc: 'Decode a JSON Web Token to read its header and claims. Shows expiry status and flags the common "alg: none" pitfall. No signature verification.',
    cat: 'security',
    catName: 'Security',
    lead: 'Paste a token to read its header and claims. Expiry is checked against your clock; the signature is not verified.',
    fields: [{ k: 'token', label: 'Token', type: 'area', rows: 5, val: '', ph: 'eyJhbGciOi...' }],
    outs: [
      { k: 'header', label: 'Header', type: 'code' },
      { k: 'payload', label: 'Payload', type: 'code' },
      { k: 'exp', label: 'Expiry', type: 'big' },
      { k: 'warn', label: 'Notes', type: 'code' },
    ],
    compute: (v) => {
      const raw = String(v.token || '').trim().replace(/^Bearer\s+/i, '');
      if (!raw) return { header: '—', payload: '—', exp: '—', warn: 'Paste a token' };
      const parts = raw.split('.');
      if (parts.length < 2) throw new Error('A JWT has three dot-separated parts');
      const b64u = (s) => {
        let x = s.replace(/-/g, '+').replace(/_/g, '/');
        while (x.length % 4) x += '=';
        const bin = atob(x);
        return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
      };
      let header;
      let payload;
      try {
        header = JSON.parse(b64u(parts[0]));
        payload = JSON.parse(b64u(parts[1]));
      } catch {
        throw new Error('Header or payload is not valid base64url JSON');
      }
      const notes = [];
      if (parts.length === 2 || parts[2] === '') notes.push('· No signature segment — this token is unsigned.');
      if (String(header.alg).toLowerCase() === 'none') notes.push('· alg is "none". Any server that accepts this is accepting forged tokens.');
      if (!payload.exp && !payload.iat) notes.push('· No exp or iat claim — this token never expires on its own.');
      if (payload.exp && payload.exp < Date.now() / 1000) notes.push('· Token is expired.');
      const fmt = (t) => (t ? new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC' : '—');
      const exp = payload.exp
        ? `${fmt(payload.exp)} (${payload.exp < Date.now() / 1000 ? 'expired' : 'valid'})`
        : 'no exp claim';
      return {
        header: JSON.stringify(header, null, 2),
        payload: JSON.stringify(payload, null, 2),
        exp,
        warn: notes.length ? notes.join('\n') : '· Standard three-part token with a signature segment.',
      };
    },
    example:
      'Decoding is not verification. Anyone can craft a token with any claims they like; only the signature tells you the issuer actually produced it. Reading claims from an unverified token and trusting them is how "admin: true" becomes an incident.',
    body: [
      'A JWT is three base64url segments separated by dots: header, payload, signature. The first two are plain text in disguise — base64 is an encoding, not a lock. This tool shows them and stops there, because verification needs the issuer\'s key and that belongs in your server code, not in a random web page.',
      '## Reading the claims',
      '<code>exp</code> is expiry in Unix seconds, <code>iat</code> is issuance, <code>nbf</code> is not-before. <code>iss</code> and <code>aud</code> identify who issued the token and who it was meant for — a token with the right signature but the wrong audience is still an invalid token, and skipping that check is a real vulnerability class.',
      '## The traps this page flags',
      'A token with <code>alg: none</code> and no signature is the oldest JWT attack: the server is told not to verify. A token with no <code>exp</code> never expires, which means a leaked one is valid forever. Both are visible in the header and payload, and both are worth catching before the token reaches production.',
      '## Where to verify',
      'Signature verification requires the key: HMAC for symmetric, the issuer\'s public key for RS256/ES256. Do it on the server, check <code>iss</code>, <code>aud</code> and <code>exp</code> after the signature, and reject any algorithm the issuer did not publish — accepting whatever the header claims is the algorithm-confusion vulnerability.',
    ],
    faq: [
      [
        'Can I edit the payload and get a valid token?',
        'You can edit it, and the result will decode fine here, but it will fail verification unless you can sign it. If a server accepts an edited token, the server is broken.',
      ],
      [
        'Why does the expiry show my local time offset?',
        'It does not — the value is rendered in UTC. If it looks wrong, compare against UTC rather than your system clock.',
      ],
    ],
  },

  {
    slug: 'aes-encryptor',
    name: 'AES Text Encryptor',
    title: 'AES Encrypt and Decrypt Text — AES-GCM in the Browser',
    desc: 'Encrypt text with a passphrase using AES-256-GCM and PBKDF2 key derivation. Decrypt your own ciphertext. Everything happens locally.',
    cat: 'security',
    catName: 'Security',
    lead: 'AES-256-GCM with PBKDF2 key derivation. Ciphertext is base64, self-contained, and decryptable only with the same passphrase.',
    fields: [
      { k: 'mode', label: 'Mode', type: 'sel', val: 'enc', opts: [['enc', 'Encrypt'], ['dec', 'Decrypt']] },
      { k: 'text', label: 'Text or ciphertext', type: 'area', rows: 6, val: '' },
      { k: 'pw', label: 'Passphrase', type: 'text', val: '', ph: 'long passphrase, not a short password' },
    ],
    outs: [{ k: 'out', label: 'Output', type: 'code' }],
    compute: async (v) => {
      const enc = new TextEncoder();
      const dec = new TextDecoder();
      const pw = String(v.pw || '');
      if (pw.length < 8) throw new Error('Use a passphrase of at least 8 characters');
      const text = String(v.text || '');
      if (!text.trim()) return { out: '' };

      const b64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
      const unb64 = (s) => {
        let x = s.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
        while (x.length % 4) x += '=';
        const bin = atob(x);
        return Uint8Array.from(bin, (c) => c.charCodeAt(0));
      };

      const derive = async (salt) => {
        const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
        return crypto.subtle.deriveKey(
          { name: 'PBKDF2', salt, iterations: 210000, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
        );
      };

      if (v.mode === 'enc') {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await derive(salt);
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
        // 自描述格式：salt(16) + iv(12) + ciphertext，解密端不需要额外约定
        const all = new Uint8Array(salt.length + iv.length + ct.length);
        all.set(salt, 0);
        all.set(iv, salt.length);
        all.set(ct, salt.length + iv.length);
        return { out: b64(all) };
      }

      const all = unb64(text);
      if (all.length < 29) throw new Error('Ciphertext is too short to contain salt and IV');
      const salt = all.slice(0, 16);
      const iv = all.slice(16, 28);
      const ct = all.slice(28);
      const key = await derive(salt);
      try {
        const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
        return { out: dec.decode(pt) };
      } catch {
        throw new Error('Decryption failed — wrong passphrase, or the ciphertext was altered. GCM cannot tell you which.');
      }
    },
    example:
      'The same plaintext encrypted twice produces two different ciphertexts, because a fresh salt and IV are generated each time. That is correct behaviour — identical output would leak that two messages were the same.',
    body: [
      'AES-256-GCM is authenticated encryption: it protects confidentiality and detects tampering. Alter one bit of the ciphertext and decryption fails rather than returning corrupted plaintext. The passphrase is stretched with PBKDF2-SHA256 at 210,000 iterations to make brute-force guessing expensive.',
      '## The ciphertext format',
      'The output is base64 of <code>salt(16) ‖ iv(12) ‖ ciphertext+tag</code>. Everything needed to decrypt is in the blob, so you can paste it anywhere and decrypt it later as long as you still have the passphrase. There is no metadata and no server-side state.',
      '## Choosing a passphrase',
      'PBKDF2 slows guessing but does not make a weak passphrase safe. A six-character password falls to a dictionary in seconds no matter how many iterations you run through. Use four or more random words, or a generated password you store in a manager.',
      '## What this does not protect against',
      'It does not protect a compromised machine: anything running in the tab can read what you typed. It does not hide the fact that encryption happened. And if you lose the passphrase, there is no recovery — no key escrow exists here by design.',
    ],
    faq: [
      [
        'Can I decrypt something encrypted by another tool?',
        'Only if it uses the same construction: AES-256-GCM, PBKDF2-SHA256 at 210,000 iterations, and the same salt/IV layout. A different tool will almost certainly differ in at least one of those.',
      ],
      [
        'Why does decryption fail with the right passphrase?',
        'Usually a truncated paste — base64 broken across lines with a character lost. GCM also fails if even one byte of the ciphertext changed, so an email client that re-wrapped the text is enough to break it.',
      ],
    ],
  },
];
