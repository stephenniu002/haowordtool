/**
 * 开发与运维类。共同点是「查表 + 计算」，没有一个需要联网。
 * 这类工具的流量特征是：来一次就记住，收藏率高，适合做书签页。
 */

export default [
  {
    slug: 'http-status-codes',
    name: 'HTTP Status Code Reference',
    title: 'HTTP Status Codes — Searchable Reference',
    desc: 'Look up any HTTP status code with its meaning and when to use it. Filter by class or search by number and description.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Search by code, name or meaning. Filter to a class with one keystroke.',
    fields: [
      { k: 'q', label: 'Search', type: 'text', val: '', ph: '404, redirect, timeout…' },
      { k: 'cls', label: 'Class', type: 'sel', val: 'all', opts: [['all', 'All'], ['2', '2xx success'], ['3', '3xx redirect'], ['4', '4xx client'], ['5', '5xx server']] },
    ],
    outs: [
      { k: 'list', label: 'Codes', type: 'code' },
      { k: 'count', label: 'Matches', type: 'big' },
    ],
    compute: (v) => {
      const DATA = [
        [100, 'Continue', 'The server got the request headers and the client should send the body.'],
        [101, 'Switching Protocols', 'The server is switching to the protocol named in the Upgrade header, typically WebSocket.'],
        [103, 'Early Hints', 'Sends Link headers before the final response so the browser can preload resources.'],
        [200, 'OK', 'The request succeeded. The most common response and the default for a GET.'],
        [201, 'Created', 'A resource was created. Should carry a Location header pointing at it.'],
        [202, 'Accepted', 'The request was accepted for processing but is not finished. Used for async jobs.'],
        [204, 'No Content', 'Success with no body. Common for DELETE and for form posts followed by a redirect.'],
        [206, 'Partial Content', 'A range request succeeded. Required for resumable downloads and video seeking.'],
        [301, 'Moved Permanently', 'The resource has a new URL permanently. Search engines transfer signals; clients cache it hard.'],
        [302, 'Found', 'Temporary redirect. Historically clients changed the method to GET, which is why 307 exists.'],
        [303, 'See Other', 'The response is at another URL and should be fetched with GET. The correct code after a form POST.'],
        [304, 'Not Modified', 'The cached copy is still valid. Sent in response to If-None-Match or If-Modified-Since.'],
        [307, 'Temporary Redirect', 'Like 302 but the method and body must be preserved. Use this for temporary API moves.'],
        [308, 'Permanent Redirect', 'Like 301 but the method is preserved. Use for permanent API moves.'],
        [400, 'Bad Request', 'Malformed syntax or invalid parameters. The client should not retry unchanged.'],
        [401, 'Unauthorized', 'Authentication is missing or invalid. Should carry a WWW-Authenticate header.'],
        [403, 'Forbidden', 'Authenticated but not allowed. Retrying will not help.'],
        [404, 'Not Found', 'No resource at that URL. Also used deliberately to avoid leaking whether something exists.'],
        [405, 'Method Not Allowed', 'The URL exists but not for that method. Must include an Allow header.'],
        [408, 'Request Timeout', 'The server gave up waiting for the request. Safe to retry.'],
        [409, 'Conflict', 'The request conflicts with current state — a duplicate create or a stale version.'],
        [410, 'Gone', 'The resource existed and is permanently gone. Faster to deindex than 404.'],
        [413, 'Payload Too Large', 'The body exceeds the server limit. Common on upload endpoints.'],
        [415, 'Unsupported Media Type', 'The Content-Type is not accepted by the endpoint.'],
        [418, "I'm a Teapot", 'An April Fools status from RFC 2324. Some frameworks return it deliberately for blocked bots.'],
        [422, 'Unprocessable Content', 'Syntactically valid but semantically wrong — a required field missing or a failed validation.'],
        [429, 'Too Many Requests', 'Rate limited. Should include Retry-After.'],
        [500, 'Internal Server Error', 'An unhandled exception. Deliberately vague so nothing leaks.'],
        [501, 'Not Implemented', 'The server does not support the method at all.'],
        [502, 'Bad Gateway', 'An upstream server returned something invalid. Typical when a backend is down behind a proxy.'],
        [503, 'Service Unavailable', 'Temporarily unable to handle the request — overload or maintenance. Should include Retry-After.'],
        [504, 'Gateway Timeout', 'The upstream did not respond in time. The request may still have been processed.'],
      ];
      const q = String(v.q || '').trim().toLowerCase();
      const rows = DATA.filter(([code, name, desc]) => {
        if (v.cls !== 'all' && String(code)[0] !== v.cls) return false;
        if (!q) return true;
        return String(code).includes(q) || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
      return {
        list: rows.length ? rows.map(([c, n, d]) => `${c}  ${n}\n    ${d}`).join('\n') : 'No matches',
        count: String(rows.length),
      };
    },
    example:
      'The distinction that matters most in practice: 401 means "I do not know who you are", 403 means "I know who you are and no". Returning 401 for a permission failure sends the client into a pointless re-authentication loop.',
    body: [
      'Status codes are a contract between server and client. Using the wrong one does not break the request, it breaks everything downstream — retry logic, caching, monitoring dashboards and the browser itself.',
      '## The ones people get wrong',
      '302 versus 307: the difference is whether the method survives. 301 versus 308: same, but permanent. 401 versus 403: authentication versus authorisation. 200 with an error in the body: never, because every proxy and client between here and there believes the request succeeded.',
    ],
    faq: [
      ['Should I use 404 or 410 for deleted pages?', '410 is faster to deindex and more accurate. 404 is what most frameworks give you for free, and Google treats a persistent 404 as effectively gone anyway.'],
    ],
  },

  {
    slug: 'mime-types',
    name: 'MIME Type Reference',
    title: 'MIME Type Lookup — File Extension to Content-Type',
    desc: 'Find the correct Content-Type for a file extension. Covers documents, images, audio, video, archives and fonts.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Extension in, Content-Type out. Includes the charset parameter where it matters.',
    fields: [{ k: 'q', label: 'Extension or type', type: 'text', val: 'svg', ph: 'json, .woff2, image/png' }],
    outs: [
      { k: 'out', label: 'Matches', type: 'code' },
      { k: 'count', label: 'Matches', type: 'big' },
    ],
    compute: (v) => {
      const MAP = {
        html: 'text/html; charset=utf-8', htm: 'text/html; charset=utf-8',
        css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
        json: 'application/json; charset=utf-8', xml: 'application/xml; charset=utf-8',
        txt: 'text/plain; charset=utf-8', md: 'text/markdown; charset=utf-8',
        csv: 'text/csv; charset=utf-8', tsv: 'text/tab-separated-values; charset=utf-8',
        pdf: 'application/pdf', zip: 'application/zip', gz: 'application/gzip', tar: 'application/x-tar',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
        webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/vnd.microsoft.icon',
        bmp: 'image/bmp', tiff: 'image/tiff',
        woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf', otf: 'font/otf',
        mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', flac: 'audio/flac',
        mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', avi: 'video/x-msvideo',
        wasm: 'application/wasm', rss: 'application/rss+xml', atom: 'application/atom+xml',
        yaml: 'application/yaml', yml: 'application/yaml', toml: 'application/toml',
        doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        apk: 'application/vnd.android.package-archive', dmg: 'application/x-apple-diskimage',
        exe: 'application/vnd.microsoft.portable-executable', bin: 'application/octet-stream',
        map: 'application/json; charset=utf-8', manifest: 'text/cache-manifest',
        epub: 'application/epub+zip', ics: 'text/calendar; charset=utf-8', vcf: 'text/vcard; charset=utf-8',
      };
      const q = String(v.q || '').trim().toLowerCase().replace(/^\./, '');
      if (!q) {
        const all = Object.entries(MAP).slice(0, 40).map(([k, m]) => `.${k.padEnd(8)} ${m}`);
        return { out: all.join('\n') + '\n…type an extension to filter', count: String(Object.keys(MAP).length) };
      }
      const rows = Object.entries(MAP).filter(([k, m]) => k === q || m.includes(q) || k.includes(q));
      return {
        out: rows.length ? rows.map(([k, m]) => `.${k}  →  ${m}`).join('\n') : 'No match — use application/octet-stream as the fallback',
        count: String(rows.length),
      };
    },
    example:
      'Serving an SVG as <code>text/plain</code> stops it rendering in an <code>&lt;img&gt;</code> tag. Serving it as <code>image/svg+xml</code> renders it — and also allows embedded scripts when opened directly, which is why SVG uploads need sanitising.',
    body: [
      'The Content-Type header tells the client how to interpret bytes. Browsers sniff when it is missing or wrong, but never for scripts, and modern browsers refuse to execute a script served with the wrong type at all.',
      '## Two parameters that matter',
      '<code>charset</code> for text types, and <code>boundary</code> for multipart. Omitting the charset makes non-ASCII content depend on browser defaults, which is how mojibake happens. <code>application/octet-stream</code> means "unknown binary" and forces a download rather than a render.',
    ],
    faq: [
      ['Why do some servers use application/javascript instead of text/javascript?', 'Historical. <code>text/javascript</code> is now the standard per RFC 9239; both are accepted, but the old <code>application/x-javascript</code> is deprecated.'],
    ],
  },

  {
    slug: 'chmod-calculator',
    name: 'Chmod Calculator',
    title: 'Chmod Calculator — Unix File Permissions',
    desc: 'Build a Unix permission mode from checkboxes and get the octal and symbolic forms, plus the chmod command.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Tick the boxes, get octal, symbolic and the command. Includes setuid, setgid and sticky.',
    fields: [
      { k: 'ur', label: 'Owner read', type: 'chk', val: true },
      { k: 'uw', label: 'Owner write', type: 'chk', val: true },
      { k: 'ux', label: 'Owner execute', type: 'chk', val: false },
      { k: 'gr', label: 'Group read', type: 'chk', val: true },
      { k: 'gw', label: 'Group write', type: 'chk', val: false },
      { k: 'gx', label: 'Group execute', type: 'chk', val: false },
      { k: 'or', label: 'Other read', type: 'chk', val: true },
      { k: 'ow', label: 'Other write', type: 'chk', val: false },
      { k: 'ox', label: 'Other execute', type: 'chk', val: false },
      { k: 'special', label: 'Include setuid / setgid / sticky', type: 'chk', val: false },
    ],
    outs: [
      { k: 'octal', label: 'Octal', type: 'big' },
      { k: 'symbolic', label: 'Symbolic', type: 'big' },
      { k: 'cmd', label: 'Command', type: 'code' },
      { k: 'meaning', label: 'Meaning', type: 'code' },
    ],
    compute: (v) => {
      const bit = (r, w, x) => (r ? 4 : 0) + (w ? 2 : 0) + (x ? 1 : 0);
      const u = bit(v.ur, v.uw, v.ux);
      const g = bit(v.gr, v.gw, v.gx);
      const o = bit(v.or, v.ow, v.ox);
      const octal = `${u}${g}${o}`;
      const sym = (n) => (n & 4 ? 'r' : '-') + (n & 2 ? 'w' : '-') + (n & 1 ? 'x' : '-');
      const rows = [];
      const describe = (n, who) => {
        const parts = [];
        if (n & 4) parts.push('read');
        if (n & 2) parts.push('write');
        if (n & 1) parts.push('execute');
        return `${who}: ${parts.length ? parts.join(', ') : 'no access'}`;
      };
      rows.push(describe(u, 'Owner'));
      rows.push(describe(g, 'Group'));
      rows.push(describe(o, 'Other'));
      if (o & 2) rows.push('WARNING: "other" can write. Almost never what you want on a web root.');
      if (o & 1 && !(u & 1)) rows.push('NOTE: others execute but owner does not — unusual.');
      return {
        octal: octal,
        symbolic: sym(u) + sym(g) + sym(o),
        cmd: `chmod ${octal} <path>`,
        meaning: rows.join('\n'),
      };
    },
    example:
      '755 is owner read/write/execute, everyone else read/execute — the standard for directories and executables. 644 is owner read/write, everyone else read — the standard for regular files.',
    body: [
      'Unix permissions are three groups of three bits: read, write, execute, for owner, group and other. Each group is one octal digit, which is why 755 is three digits and not a number with a value of seven hundred and fifty-five.',
      '## Directories are different',
      'On a directory, read means "list the names", write means "create or delete entries", and execute means "traverse into it". A directory without execute cannot be entered even if you know the exact path — the classic cause of a permission error that looks impossible.',
    ],
    faq: [
      ['What do setuid, setgid and sticky do?', 'setuid runs a binary as its owner; setgid on a directory makes new files inherit the group; sticky on a shared directory stops users deleting each other\'s files. All three are a fourth octal digit, and all three deserve suspicion.'],
    ],
  },

  {
    slug: 'subnet-calculator',
    name: 'Subnet Calculator',
    title: 'Subnet Calculator — CIDR, Mask, Host Range',
    desc: 'Calculate network address, broadcast, usable host range and host count from an IPv4 address and prefix length.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'IPv4 address and prefix length to network, broadcast, host range and count.',
    fields: [
      { k: 'ip', label: 'IPv4 address', type: 'text', val: '192.168.1.10' },
      { k: 'prefix', label: 'Prefix length', type: 'num', val: 24, min: 0, max: 32, step: 1 },
    ],
    outs: [
      { k: 'net', label: 'Network', type: 'big' },
      { k: 'mask', label: 'Subnet mask', type: 'big' },
      { k: 'range', label: 'Usable hosts', type: 'big' },
      { k: 'bcast', label: 'Broadcast', type: 'big' },
      { k: 'count', label: 'Usable addresses', type: 'big' },
      { k: 'binary', label: 'Mask in binary', type: 'code' },
    ],
    compute: (v) => {
      const parts = String(v.ip || '').trim().split('.').map(Number);
      if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
        throw new Error('Enter a valid IPv4 address, e.g. 192.168.1.10');
      }
      const p = Number(v.prefix);
      if (!Number.isInteger(p) || p < 0 || p > 32) throw new Error('Prefix must be 0–32');
      const ipInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      const mask = p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
      const net = (ipInt & mask) >>> 0;
      const bcast = (net | (~mask >>> 0)) >>> 0;
      const toIp = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
      const total = 2 ** (32 - p);
      // /31 和 /32 是点对点与单主机，没有网络号/广播号的概念
      const usable = p >= 31 ? total : total - 2;
      return {
        net: `${toIp(net)}/${p}`,
        mask: toIp(mask),
        range: usable > 0 ? `${toIp(p >= 31 ? net : net + 1)} – ${toIp(p >= 31 ? bcast : bcast - 1)}` : 'none',
        bcast: p >= 31 ? 'n/a' : toIp(bcast),
        count: usable.toLocaleString(),
        binary: toIp(mask).split('.').map((x) => Number(x).toString(2).padStart(8, '0')).join('.'),
      };
    },
    example:
      '192.168.1.10/24 covers 192.168.1.0 to 192.168.1.255. The network address is .0, the broadcast is .255, and 254 addresses are usable — the two excluded ones exist but cannot be assigned to a host.',
    body: [
      'A subnet mask splits the 32-bit address into a network part and a host part. The prefix length is the number of leading network bits, so /24 means 24 network bits and 8 host bits, giving 256 addresses.',
      '## Why two addresses disappear',
      'The all-zeros host part identifies the network itself and the all-ones host part is the broadcast address. Neither can be assigned to an interface. The exceptions are /31, used for point-to-point links where both addresses are usable, and /32, which is a single host.',
    ],
    faq: [
      ['What does a /30 give me?', 'Four addresses, two usable — the classic point-to-point link size. Four /30s fit inside one /28, which is why allocation planning is done in powers of two.'],
    ],
  },

  {
    slug: 'url-parser',
    name: 'URL Parser',
    title: 'URL Parser — Break a URL into Its Parts',
    desc: 'Split a URL into protocol, host, port, path, query parameters and fragment. Decodes parameters and flags tracking fields.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Every component of a URL, with query parameters decoded and tracking parameters flagged.',
    fields: [{ k: 'url', label: 'URL', type: 'area', rows: 3, val: 'https://example.com:8443/blog/post?utm_source=news&id=42&q=hello%20world#section-2' }],
    outs: [
      { k: 'parts', label: 'Components', type: 'code' },
      { k: 'params', label: 'Query parameters', type: 'code' },
      { k: 'clean', label: 'URL without tracking parameters', type: 'code' },
    ],
    compute: (v) => {
      let u;
      try {
        u = new URL(String(v.url || '').trim());
      } catch {
        throw new Error('Not a valid absolute URL — include the scheme, e.g. https://');
      }
      const parts = [
        `protocol  ${u.protocol}`,
        `host      ${u.hostname}`,
        `port      ${u.port || '(default)'}`,
        `path      ${u.pathname || '/'}`,
        `query     ${u.search || '(none)'}`,
        `fragment  ${u.hash || '(none)'}`,
        `origin    ${u.origin}`,
      ].join('\n');
      const TRACK = /^(utm_|fbclid|gclid|msclkid|mc_eid|ref|ref_src|igshid|yclid|_hsenc|_hsmi)/i;
      const rows = [];
      let removed = 0;
      for (const [k, val] of u.searchParams.entries()) {
        const flag = TRACK.test(k) ? '  ← tracking' : '';
        if (TRACK.test(k)) removed++;
        rows.push(`${k} = ${val}${flag}`);
      }
      const clean = new URL(u.toString());
      [...clean.searchParams.keys()].forEach((k) => {
        if (TRACK.test(k)) clean.searchParams.delete(k);
      });
      return {
        parts,
        params: rows.length ? rows.join('\n') : '(no query parameters)',
        clean: `${clean.toString()}${removed ? `\n\n${removed} tracking parameter(s) removed` : ''}`,
      };
    },
    example:
      'The scheme is everything before the colon, the fragment is everything after the hash and is never sent to the server. Query parameters are sent, which is why tracking parameters work and why stripping them changes the request the server sees.',
    body: [
      'URLs have more structure than they appear to. The fragment never reaches the server, the port may be implied by the scheme, and the query string is a sequence of pairs with no ordering guarantee.',
      '## Why decode parameters',
      'A parameter value arrives percent-encoded. Comparing the raw string against an expected value fails whenever the value contains a space, an ampersand or a non-ASCII character — which is most of the time.',
    ],
    faq: [
      ['Are duplicate parameter names allowed?', 'Yes, and they are common — <code>?tag=a&amp;tag=b</code> is valid. Reading only the first value is a frequent source of bugs.'],
    ],
  },

  {
    slug: 'timestamp-converter',
    name: 'Unix Timestamp Converter',
    title: 'Unix Timestamp Converter — Epoch to Date and Back',
    desc: 'Convert Unix timestamps to readable dates and dates to timestamps. Handles seconds and milliseconds, with a live clock.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Epoch seconds or milliseconds to a date, and back. Shows local time, UTC and relative distance.',
    fields: [
      { k: 'mode', label: 'Direction', type: 'sel', val: 'toDate', opts: [['toDate', 'Timestamp → date'], ['toTs', 'Date → timestamp']] },
      { k: 'input', label: 'Timestamp, or date as YYYY-MM-DD HH:MM', type: 'text', val: '1793000000' },
    ],
    outs: [
      { k: 'utc', label: 'UTC', type: 'big' },
      { k: 'local', label: 'Your local time', type: 'big' },
      { k: 'relative', label: 'Relative to now', type: 'big' },
      { k: 'epoch', label: 'Epoch seconds / milliseconds', type: 'code' },
    ],
    compute: (v) => {
      const raw = String(v.input || '').trim();
      let d;
      if (v.mode === 'toDate') {
        const n = Number(raw);
        if (!isFinite(n)) throw new Error('Enter a number');
        // 10 位是秒，13 位是毫秒，按位数判断比猜单位可靠
        d = new Date(raw.length >= 13 ? n : n * 1000);
      } else {
        const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(raw);
        if (!m) throw new Error('Use YYYY-MM-DD or YYYY-MM-DD HH:MM');
        d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
      }
      if (isNaN(d)) throw new Error('That value is not a valid date');
      const diff = d.getTime() - Date.now();
      const abs = Math.abs(diff);
      const unit = abs < 60000 ? ['second', 1000] : abs < 3600000 ? ['minute', 60000] : abs < 86400000 ? ['hour', 3600000] : abs < 2592000000 ? ['day', 86400000] : ['month', 2592000000];
      const n = Math.round(abs / unit[1]);
      return {
        utc: d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
        local: d.toString().slice(0, 24),
        relative: `${n} ${unit[0]}${n === 1 ? '' : 's'} ${diff >= 0 ? 'from now' : 'ago'}`,
        epoch: `${Math.floor(d.getTime() / 1000)} sec\n${d.getTime()} ms`,
      };
    },
    example:
      '1793000000 is 26 October 2026, 09:33:20 UTC. Ten digits means seconds; thirteen means milliseconds. Passing seconds where milliseconds are expected lands the date in 1970.',
    body: [
      'Unix time counts seconds since 1 January 1970 UTC, ignoring leap seconds. It is timezone-free by definition, which is why it is the right thing to store — the timezone belongs at the display layer, not in the database.',
      '## The seconds/milliseconds trap',
      'JavaScript uses milliseconds; almost everything else uses seconds. A timestamp of 1793000000 interpreted as milliseconds is 21 January 1970. This calculator switches on digit count, which is the reliable heuristic.',
    ],
    faq: [
      ['What is the 2038 problem?', 'Systems storing Unix time in a signed 32-bit integer overflow on 19 January 2038. Anything still using 32-bit time needs fixing before then — and the affected systems are mostly embedded.'],
    ],
  },

  {
    slug: 'user-agent-parser',
    name: 'User Agent Parser',
    title: 'User Agent Parser — Read a UA String',
    desc: 'Paste a user agent string to identify browser, engine, operating system and device type. Includes your own UA.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Browser, version, engine, OS and device class from a UA string. Your own is filled in by default.',
    fields: [{ k: 'ua', label: 'User agent string', type: 'area', rows: 4, val: '' }],
    outs: [
      { k: 'parsed', label: 'Parsed', type: 'code' },
      { k: 'notes', label: 'Notes', type: 'code' },
    ],
    compute: (v) => {
      const ua = String(v.ua || '').trim() || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
      if (!ua) return { parsed: 'Paste a UA string', notes: '' };
      const hit = (re) => (re.exec(ua) || [])[1] || '';
      const browser =
        /Edg\//.test(ua) ? ['Edge', hit(/Edg\/([\d.]+)/)] :
        /OPR\/|Opera/.test(ua) ? ['Opera', hit(/OPR\/([\d.]+)/)] :
        /Firefox\//.test(ua) ? ['Firefox', hit(/Firefox\/([\d.]+)/)] :
        /Chrome\//.test(ua) ? ['Chrome', hit(/Chrome\/([\d.]+)/)] :
        /Safari\//.test(ua) ? ['Safari', hit(/Version\/([\d.]+)/)] :
        ['Unknown', ''];
      const engine =
        /Gecko\/|Firefox/.test(ua) ? 'Gecko' :
        /AppleWebKit/.test(ua) ? (browser[0] === 'Chrome' || browser[0] === 'Edge' ? 'Blink' : 'WebKit') :
        'Unknown';
      const os =
        /Windows NT 10/.test(ua) ? 'Windows 10/11' :
        /Windows NT 6\.3/.test(ua) ? 'Windows 8.1' :
        /Mac OS X/.test(ua) ? 'macOS ' + hit(/Mac OS X ([\d_]+)/).replace(/_/g, '.') :
        /Android/.test(ua) ? 'Android ' + hit(/Android ([\d.]+)/) :
        /iPhone|iPad|iPod/.test(ua) ? 'iOS ' + hit(/OS ([\d_]+)/).replace(/_/g, '.') :
        /Linux/.test(ua) ? 'Linux' : 'Unknown';
      const device = /Mobile|Android|iPhone/.test(ua) ? 'mobile' : /iPad|Tablet/.test(ua) ? 'tablet' : 'desktop';
      const notes = [];
      if (browser[0] === 'Chrome' && /Safari\//.test(ua)) notes.push('· Chrome and Safari both appear — Chrome is the real one, Safari is a compatibility token.');
      if (/HeadlessChrome/.test(ua)) notes.push('· HeadlessChrome: this is an automated browser.');
      if (/bot|crawler|spider|GPTBot|ClaudeBot/i.test(ua)) notes.push('· Looks like a bot or crawler.');
      if (/Firefox\//.test(ua) && /rv:/.test(ua) && /109/.test(ua) && /Chrome/.test(ua) === false) notes.push('· Firefox has frozen the reported version at 109 for privacy; it is still updated.');
      return {
        parsed: `browser   ${browser[0]}${browser[1] ? ' ' + browser[1] : ''}\nengine    ${engine}\nos        ${os}\ndevice    ${device}\nlength    ${ua.length} chars`,
        notes: notes.length ? notes.join('\n') : '· Nothing unusual detected.',
      };
    },
    example:
      'A Chrome on Windows string contains "Safari/537.36" — a compatibility token Chrome has always sent so that old sniffing code does not break. Parsing order matters: check Edge and Opera before Chrome, because both include a Chrome token.',
    body: [
      'The user agent string is a fossil. It encodes browser, engine, OS and device in a format designed for 1990s sniffing, then accumulated compatibility tokens as browsers pretended to be each other to avoid being blocked.',
      '## Why parsing is unreliable',
      'Order determines the answer: every Chromium browser claims Chrome, several claim Safari. Browsers reduce the reported information over time for privacy. And anything a client sends can be faked, so a UA is a hint, never an identity.',
    ],
    faq: [
      ['Should I use UA sniffing for feature detection?', 'No. Test for the feature itself — <code>if (typeof X !== "undefined")</code> — rather than for a browser name. UA strings are used for analytics and for blocking obvious bots, not for deciding what code to run.'],
    ],
  },

  {
    slug: 'css-minifier',
    name: 'CSS Minifier',
    title: 'CSS Minifier — Compress Stylesheets',
    desc: 'Remove comments, whitespace and redundant characters from CSS. Shows the size reduction. Conservative enough to be safe.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Strips comments and collapsible whitespace. Conservative by design — it will not restructure your selectors.',
    fields: [{ k: 'input', label: 'CSS', type: 'area', rows: 12, val: '' }],
    outs: [
      { k: 'out', label: 'Minified', type: 'code' },
      { k: 'stats', label: 'Size', type: 'big' },
    ],
    compute: (v) => {
      const src = String(v.input || '');
      if (!src.trim()) return { out: '', stats: '—' };
      let s = src;
      // 先护住字符串和 url()，否则里面的空格和 ; 会被误伤
      const guard = [];
      s = s.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|url\((?:[^)]*)\))/g, (m) => {
        guard.push(m);
        return `\u0000${guard.length - 1}\u0000`;
      });
      s = s.replace(/\/\*[\s\S]*?\*\//g, '');
      s = s.replace(/\s+/g, ' ');
      s = s.replace(/\s*([{}:;,>~+])\s*/g, '$1');
      s = s.replace(/;}/g, '}');
      s = s.replace(/^;+|;+$/g, '');
      s = s.trim();
      s = s.replace(/\u0000(\d+)\u0000/g, (_m, i) => guard[Number(i)]);
      const before = new TextEncoder().encode(src).length;
      const after = new TextEncoder().encode(s).length;
      return {
        out: s,
        stats: `${before} → ${after} bytes (${Math.round((1 - after / before) * 100)}% smaller)`,
      };
    },
    example:
      'A 40 KB stylesheet with comments and indentation typically compresses to 28 KB minified and 7 KB over the wire with gzip. If your server compresses, minification saves far less than the numbers suggest.',
    body: [
      'Minification removes characters the parser does not need: comments, indentation, the last semicolon in a block. It does not change what the CSS does — if the output behaves differently, the minifier is broken.',
      '## What this deliberately does not do',
      'No selector merging, no property reordering, no colour shortening beyond what whitespace removal achieves. Those optimisations are where minifiers introduce bugs, and with gzip on, additional minification saves single-digit percentages.',
    ],
    faq: [
      ['Should I minify before or after gzip?', 'Minify first, then gzip at the server. Gzip on minified CSS is what produces the final transfer size, and the two are complementary rather than alternatives.'],
    ],
  },

  {
    slug: 'sql-formatter',
    name: 'SQL Formatter',
    title: 'SQL Formatter — Pretty Print Queries',
    desc: 'Format SQL with keywords on their own lines, consistent indentation and uppercase keywords. Works with most dialects.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Uppercase keywords, one clause per line, indented subqueries. Dialect-agnostic.',
    fields: [
      { k: 'input', label: 'SQL', type: 'area', rows: 10, val: 'select u.id,u.name,count(o.id) as orders from users u left join orders o on o.user_id=u.id where u.created_at>\'2026-01-01\' group by u.id,u.name having count(o.id)>3 order by orders desc limit 20;' },
      { k: 'kw', label: 'Uppercase keywords', type: 'chk', val: true },
      { k: 'indent', label: 'Indent', type: 'sel', val: '2', opts: [['2', '2 spaces'], ['4', '4 spaces'], ['tab', 'tab']] },
    ],
    outs: [{ k: 'out', label: 'Formatted', type: 'code' }],
    compute: (v) => {
      const src = String(v.input || '').trim();
      if (!src) return { out: '' };
      const ind = v.indent === 'tab' ? '\t' : ' '.repeat(Number(v.indent) || 2);
      // 字符串先护住，否则关键字替换会动到字面量里的内容
      const guard = [];
      let s = src.replace(/'(?:[^'\\]|\\.|'')*'/g, (m) => {
        guard.push(m);
        return `\u0000${guard.length - 1}\u0000`;
      });
      const BREAK = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET', 'UNION ALL', 'UNION', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'JOIN', 'ON', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'WITH'];
      const KWS = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'BETWEEN', 'AS', 'ON', 'GROUP', 'ORDER', 'BY', 'HAVING', 'LIMIT', 'OFFSET', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'WITH', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
      if (v.kw) {
        for (const k of KWS.sort((a, b) => b.length - a.length)) {
          s = s.replace(new RegExp(`\\b${k}\\b`, 'gi'), k);
        }
        for (const b of BREAK) s = s.replace(new RegExp(`\\b${b.replace(/ /g, '\\s+')}\\b`, 'gi'), b);
      }
      s = s.replace(/\s+/g, ' ');
      for (const b of BREAK) {
        s = s.replace(new RegExp(`\\s*\\b${b.replace(/ /g, '\\s+')}\\b`, 'g'), `\n${b}`);
      }
      s = s.replace(/\s*\b(AND|OR)\b/g, `\n${ind}$1`);
      s = s.replace(/,\s*/g, `,\n${ind}`);
      s = s.replace(/\(/g, ' (\n' + ind + ind).replace(/\)/g, '\n' + ind + ')');
      s = s.replace(/\s*\b(SELECT)\b/g, `$1`);
      s = s.replace(/;\s*$/, ';');
      s = s.replace(/\u0000(\d+)\u0000/g, (_m, i) => guard[Number(i)]);
      const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
      // 括号内的行缩进一级，闭合括号退回来
      let depth = 0;
      const out = lines.map((l) => {
        if (l.startsWith(')')) depth = Math.max(0, depth - 1);
        const line = ind.repeat(depth) + l;
        const opens = (l.match(/\(/g) || []).length;
        const closes = (l.match(/\)/g) || []).length;
        depth = Math.max(0, depth + opens - closes - (l.startsWith(')') ? 0 : 0));
        return line;
      });
      return { out: out.join('\n') };
    },
    example:
      'Formatting does not change execution, but it changes review. A query that fits on one line is read as "some SQL"; the same query with clauses on separate lines is read as a set of decisions about joins and filters.',
    body: [
      'SQL does not care about whitespace, which is exactly why formatted SQL is a communication tool rather than a syntax requirement. The value is in review: a diff of a formatted query shows the clause that changed, not the whole line.',
      '## Dialect caveats',
      'This is a keyword-driven formatter, not a parser. It will not understand dialect-specific syntax such as Postgres <code>::</code> casts or T-SQL <code>TOP</code>, and it will not reorder or validate anything. For anything structural, use your database\'s own <code>EXPLAIN</code> output.',
    ],
    faq: [
      ['Will it break my query?', 'It changes whitespace and keyword case only. If the result fails to run, the input was relying on whitespace inside a string — check that string literals survived intact.'],
    ],
  },

  {
    slug: 'robots-txt-generator',
    name: 'Robots.txt Generator',
    title: 'Robots.txt Generator — Rules and Sitemap',
    desc: 'Build a robots.txt with user-agent rules, allow and disallow paths, crawl delay and a sitemap reference.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Rules for specific agents, plus a sitemap line. Output is plain text you can paste and serve at the root.',
    fields: [
      { k: 'agent', label: 'User-agent', type: 'text', val: '*' },
      { k: 'disallow', label: 'Disallow paths (one per line)', type: 'area', rows: 4, val: '/api/\n/*?*utm_' },
      { k: 'allow', label: 'Allow paths (one per line)', type: 'area', rows: 3, val: '/' },
      { k: 'delay', label: 'Crawl-delay (blank to omit)', type: 'text', val: '' },
      { k: 'sitemap', label: 'Sitemap URL', type: 'text', val: 'https://haowordtool.com/sitemap.xml' },
    ],
    outs: [{ k: 'out', label: 'robots.txt', type: 'code' }],
    compute: (v) => {
      const lines = ['User-agent: ' + (String(v.agent || '*').trim() || '*')];
      for (const a of String(v.allow || '').split('\n').map((x) => x.trim()).filter(Boolean)) lines.push('Allow: ' + a);
      for (const d of String(v.disallow || '').split('\n').map((x) => x.trim()).filter(Boolean)) lines.push('Disallow: ' + d);
      if (String(v.delay || '').trim()) lines.push('Crawl-delay: ' + String(v.delay).trim());
      const sm = String(v.sitemap || '').trim();
      if (sm) lines.push('', 'Sitemap: ' + sm);
      return { out: lines.join('\n') };
    },
    example:
      'Allow and Disallow are matched by longest prefix, not by order. A <code>Disallow: /</code> followed by <code>Allow: /tools/</code> lets crawlers into /tools/ — the allow is more specific and therefore wins.',
    body: [
      'robots.txt tells cooperative crawlers what not to fetch. It is not access control: a crawler that ignores it, or a scraper written by someone who wants your data, is unaffected. Anything genuinely private needs authentication.',
      '## Rules that bite',
      '<code>Disallow: /</code> with no matching allow blocks the whole site, and it is the single most common cause of a site vanishing from search. A stray <code>Disallow: /</code> in a staging copy that gets deployed is a classic outage.',
    ],
    faq: [
      ['Does Disallow remove a page from search results?', 'Not reliably. It stops crawling, not indexing — a blocked URL can still be indexed if it is linked from elsewhere. Use noindex for that, and do not combine both, because noindex cannot be seen if the page is not crawled.'],
    ],
  },

  {
    slug: 'meta-tag-generator',
    name: 'Meta Tag Generator',
    title: 'Meta Tag Generator — SEO, Open Graph and Twitter',
    desc: 'Generate title, description, canonical, Open Graph and Twitter card tags for a page. Shows a search-result preview.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Fill in the fields, get the full head block. Length warnings for title and description as you type.',
    fields: [
      { k: 'title', label: 'Page title', type: 'text', val: 'Free Online Tools — HaoWordTool' },
      { k: 'desc', label: 'Description', type: 'area', rows: 3, val: 'Nineteen free browser-based tools: word counter, text diff, QR codes, image compression and more. No sign-up required.' },
      { k: 'url', label: 'Canonical URL', type: 'text', val: 'https://haowordtool.com/tools/' },
      { k: 'img', label: 'Social image URL', type: 'text', val: 'https://haowordtool.com/assets/og-tools.png' },
      { k: 'noindex', label: 'Add noindex', type: 'chk', val: false },
    ],
    outs: [
      { k: 'out', label: 'Meta tags', type: 'code' },
      { k: 'warn', label: 'Length check', type: 'code' },
    ],
    compute: (v) => {
      const t = String(v.title || '');
      const d = String(v.desc || '');
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const tags = [
        `<title>${esc(t)}</title>`,
        `<meta name="description" content="${esc(d)}">`,
        `<link rel="canonical" href="${esc(String(v.url || ''))}">`,
      ];
      if (v.noindex) tags.push('<meta name="robots" content="noindex, follow">');
      tags.push(
        `<meta property="og:type" content="website">`,
        `<meta property="og:title" content="${esc(t)}">`,
        `<meta property="og:description" content="${esc(d)}">`,
        `<meta property="og:url" content="${esc(String(v.url || ''))}">`,
        `<meta property="og:image" content="${esc(String(v.img || ''))}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${esc(t)}">`,
        `<meta name="twitter:description" content="${esc(d)}">`,
        `<meta name="twitter:image" content="${esc(String(v.img || ''))}">`
      );
      const warn = [];
      warn.push(t.length > 60 ? `· Title is ${t.length} chars — Google truncates around 60.` : `· Title length ${t.length} — fine.`);
      warn.push(d.length > 160 ? `· Description is ${d.length} chars — truncated around 160.` : d.length < 70 ? `· Description is only ${d.length} chars — too thin to be useful.` : `· Description length ${d.length} — fine.`);
      if (!/^https:\/\//.test(String(v.url || ''))) warn.push('· Canonical should be an absolute https URL.');
      if (!String(v.img || '')) warn.push('· No social image — links will render without a preview.');
      return { out: tags.join('\n'), warn: warn.join('\n') };
    },
    example:
      'Google rewrites titles and descriptions when it thinks it can do better. The 60/160 character limits are where rewriting becomes likely, not where truncation is guaranteed — a well-written longer title often survives intact.',
    body: [
      'Head tags do three separate jobs: tell search engines what the page is about, tell social platforms what to display when it is shared, and tell the browser how to render the tab. Each has its own tag set, and getting one right does not get the others.',
      '## Canonical is the one that matters most',
      'A wrong canonical removes a page from the index more reliably than any other mistake. It should be absolute, on the same origin, and point at the version you actually want ranked — usually the page itself.',
    ],
    faq: [
      ['Do I need both Open Graph and Twitter tags?', 'Twitter falls back to Open Graph when its own tags are missing, but the fallback is inconsistent for image dimensions. Supplying both costs four lines and removes the ambiguity.'],
    ],
  },

  {
    slug: 'redirect-generator',
    name: 'Redirect Rule Generator',
    title: 'Redirect Generator — Apache, Nginx and Cloudflare',
    desc: 'Generate redirect rules for Apache, Nginx and Cloudflare from a list of old and new paths. One rule per line.',
    cat: 'dev',
    catName: 'Developer',
    lead: 'Paste old and new paths, pick the server, get syntax you can paste. 301 or 302.',
    fields: [
      { k: 'pairs', label: 'Old → New (one per line, space or tab separated)', type: 'area', rows: 8, val: '/old-page /new-page\n/legacy/tool.html /tools/text-diff.html' },
      { k: 'target', label: 'Server', type: 'sel', val: 'apache', opts: [['apache', 'Apache .htaccess'], ['nginx', 'Nginx'], ['cf', 'Cloudflare Bulk Redirects CSV'], ['vercel', 'Vercel / Next.js']] },
      { k: 'code', label: 'Status', type: 'sel', val: '301', opts: [['301', '301 permanent'], ['302', '302 temporary']] },
    ],
    outs: [{ k: 'out', label: 'Rules', type: 'code' }],
    compute: (v) => {
      const rows = String(v.pairs || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => l.split(/\s+/));
      if (!rows.length) return { out: 'Paste at least one pair' };
      const bad = rows.filter((r) => r.length < 2);
      if (bad.length) throw new Error(`Line "${bad[0].join(' ')}" needs both an old and a new path`);
      const code = v.code || '301';
      const out = rows.map(([from, to]) => {
        const f = from.startsWith('/') ? from : '/' + from;
        const t = to.startsWith('/') || /^https?:/.test(to) ? to : '/' + to;
        if (v.target === 'apache') {
          return `Redirect ${code} ${f} ${t}`;
        }
        if (v.target === 'nginx') {
          return `location = ${f} {\n    return ${code} ${t};\n}`;
        }
        if (v.target === 'vercel') {
          return `{ "source": "${f}", "destination": "${t}", "permanent": ${code === '301'} }`;
        }
        // Cloudflare Bulk Redirects 的 CSV 表头固定，源地址必须是完整 URL
        return `https://haowordtool.com${f},https://haowordtool.com${t.replace(/^https?:\/\/[^/]+/, '')},${code},true,false,false,false`;
      });
      const header = v.target === 'cf'
        ? 'source_url,target_url,status_code,preserve_query_string,include_subdomains,subpath_matching,preserve_path_suffix\n'
        : v.target === 'vercel' ? '[redirects]\n' : '';
      return { out: header + out.join(v.target === 'vercel' ? ',\n' : '\n') };
    },
    example:
      'Redirect rules are matched in order, and the first match wins. A broad rule placed before a specific one makes the specific one unreachable — the usual reason a redirect "does not work" on a site where it clearly exists.',
    body: [
      'Redirects are how a site move keeps its search equity. Every old URL that 404s instead of redirecting loses whatever it had accumulated, and a bulk migration without a redirect map loses all of it at once.',
      '## Rule order',
      'Put the specific rules first and the catch-all last. In Apache, <code>RedirectMatch</code> with a regex will swallow everything after it; in Nginx, the first matching <code>location</code> wins. Testing one URL from each end of the map is the quickest way to catch an ordering mistake.',
    ],
    faq: [
      ['301 or 302?', '301 if the move is permanent — search engines transfer signals and browsers cache it aggressively. 302 if it might be reverted. Cached 301s are painful to undo because they live in browser caches you cannot clear.'],
    ],
  },
];
