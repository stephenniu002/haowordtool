/**
 * 图片与颜色类。
 *
 * 这一类全部走 canvas / FileReader，文件不离开浏览器——这不是营销话术，
 * 是这批工具唯一存在的理由：把图片传给陌生服务器做压缩，本身是件不该做的事。
 *
 * 这些 compute 在 Node 里跑不了（没有 canvas），所以 probe:false，
 * 由页面自己验证。
 */

export default [
  {
    slug: 'image-to-base64',
    name: 'Image to Base64',
    title: 'Image to Base64 Converter — Data URI Generator',
    desc: 'Convert an image to a base64 data URI for embedding in CSS or HTML. Shows the encoded size and the ready-to-paste string.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'Drop an image, get a data URI you can paste into a stylesheet or an <code>img src</code>. File never leaves the tab.',
    fields: [{ k: 'file', label: 'Image file', type: 'file', accept: 'image/*' }],
    outs: [
      { k: 'uri', label: 'Data URI', type: 'code' },
      { k: 'size', label: 'Encoded size', type: 'big' },
      { k: 'raw', label: 'Original size', type: 'big' },
      { k: 'preview', label: 'Preview', type: 'img' },
    ],
    compute: async (v) => {
      if (!v.file) return { uri: 'Choose an image first', size: '—', raw: '—', preview: '' };
      const b64 = String(v.file).split(',')[1] || '';
      const rawBytes = Math.round((b64.length * 3) / 4);
      return {
        uri: v.file,
        size: `${(v.file.length / 1024).toFixed(1)} KB as text`,
        raw: `${(rawBytes / 1024).toFixed(1)} KB`,
        preview: v.file,
      };
    },
    example:
      'Base64 adds about 33% to the file size, and the resulting string cannot be cached separately from the document it lives in. Worth it below roughly 2 KB; a net loss above about 10 KB.',
    body: [
      'A data URI inlines the file into the document. That removes one HTTP request per image, which matters for tiny icons on a cold cache, and it makes the file impossible to cache independently, which hurts everything else.',
      '## When inlining is the right call',
      'Icons under a couple of kilobytes, images that must render before any network round trip, and email templates where external images are blocked by default. For photographs and anything reused across pages, a separate file with a long cache lifetime is faster overall.',
    ],
    faq: [
      ['Why is the text so much bigger than the file?', 'Base64 encodes 3 bytes as 4 characters, so it adds a third. Gzip on the wire recovers some of that, but the DOM still holds the inflated string.'],
    ],
  },

  {
    slug: 'base64-to-image',
    name: 'Base64 to Image',
    title: 'Base64 to Image — Decode a Data URI',
    desc: 'Paste a base64 data URI and see the image, plus its format and decoded size. Useful for debugging stored avatars and inline assets.',
    cat: 'media',
    catName: 'Image',
    lead: 'Paste a data URI to see what it actually contains.',
    fields: [{ k: 'input', label: 'Data URI or bare base64', type: 'area', rows: 6, val: '' }],
    outs: [
      { k: 'img', label: 'Decoded image', type: 'img' },
      { k: 'info', label: 'Format and size', type: 'big' },
    ],
    compute: (v) => {
      let s = String(v.input || '').trim();
      if (!s) return { img: '', info: 'Paste a data URI' };
      if (!s.startsWith('data:')) {
        // 只有裸 base64 时补一个前缀，让浏览器自己认格式
        s = 'data:image/png;base64,' + s.replace(/\s+/g, '');
      }
      const m = /^data:([^;,]+)(;base64)?,/.exec(s);
      if (!m) throw new Error('Not a data URI');
      const b64 = s.split(',')[1] || '';
      const bytes = Math.round((b64.length * 3) / 4);
      return { img: s, info: `${m[1]} · ${(bytes / 1024).toFixed(1)} KB` };
    },
    example:
      'A data URI starts with the MIME type, then an optional <code>;base64</code> marker, then the payload. Without the prefix, the browser has to guess and usually guesses wrong.',
    body: [
      'Data URIs turn up in stored avatars, inline SVG in CSS, and API responses that return an image as a JSON string. Decoding one by eye is impossible, so the practical question is always "what is this and how big is it".',
      '## Where they break',
      'A line-wrapped base64 payload fails because the newlines are part of the string. Some systems store the payload without the <code>data:</code> prefix, which is why this accepts both.',
    ],
    faq: [
      ['Can I save the decoded image?', 'Right-click the preview and save. The browser handles it as a normal image once it is in the DOM.'],
    ],
  },

  {
    slug: 'image-grayscale',
    name: 'Grayscale Image Converter',
    title: 'Convert Image to Grayscale Online',
    desc: 'Turn an image black and white in the browser. Adjustable desaturation amount, with a downloadable PNG result.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'A canvas filter with an adjustable amount, from slight desaturation to full black and white.',
    fields: [
      { k: 'file', label: 'Image', type: 'file' },
      { k: 'amount', label: 'Desaturation % (100 = full grayscale)', type: 'num', val: 100, min: 0, max: 100, step: 1 },
    ],
    outs: [
      { k: 'out', label: 'Result', type: 'img' },
      { k: 'meta', label: 'Output', type: 'big' },
    ],
    compute: async (v) => {
      if (!v.file) return { out: '', meta: 'Choose an image' };
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That file is not a readable image'));
        i.src = v.file;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      ctx.filter = `grayscale(${Math.max(0, Math.min(100, Number(v.amount) || 0))}%)`;
      ctx.drawImage(img, 0, 0);
      return {
        out: c.toDataURL('image/png'),
        meta: `${c.width} × ${c.height} px · PNG`,
      };
    },
    example:
      'Canvas filters are applied at draw time, not after. Setting the filter before <code>drawImage</code> is what makes it work; setting it afterwards has no effect on already-drawn pixels.',
    body: [
      'Grayscale conversion uses the luminance of each pixel rather than a simple average of red, green and blue — the eye is far more sensitive to green than to blue, so an equal average makes skin tones look wrong.',
      '## Partial desaturation',
      'Anything below 100% mutes colour without removing it. That is useful for pushing an image behind text on a hero section while keeping it recognisable.',
    ],
    faq: [
      ['Does it lose quality?', 'The output is a PNG, so it is lossless. The original JPEG compression artefacts are already baked in and stay, but nothing new is added.'],
    ],
  },

  {
    slug: 'image-rotate',
    name: 'Rotate Image',
    title: 'Rotate an Image Online — Any Angle',
    desc: 'Rotate an image by 90, 180, 270 degrees or any custom angle. Canvas output with transparency preserved, downloadable as PNG.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'Right angles or arbitrary angles. Non-right angles expand the canvas so nothing is clipped.',
    fields: [
      { k: 'file', label: 'Image', type: 'file' },
      { k: 'angle', label: 'Angle (degrees, clockwise)', type: 'num', val: 90, step: 1 },
    ],
    outs: [
      { k: 'out', label: 'Result', type: 'img' },
      { k: 'meta', label: 'Output', type: 'big' },
    ],
    compute: async (v) => {
      if (!v.file) return { out: '', meta: 'Choose an image' };
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That file is not a readable image'));
        i.src = v.file;
      });
      const deg = Number(v.angle) || 0;
      const rad = (deg * Math.PI) / 180;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      // 非直角要按旋转后的外接矩形开画布，否则四角被切掉
      const cw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
      const ch = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
      const c = document.createElement('canvas');
      c.width = Math.round(cw);
      c.height = Math.round(ch);
      const ctx = c.getContext('2d');
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(rad);
      ctx.drawImage(img, -w / 2, -h / 2);
      return { out: c.toDataURL('image/png'), meta: `${c.width} × ${c.height} px · ${deg}° clockwise` };
    },
    example:
      'Rotating a 400×200 image by 90° gives 200×400. Rotating it by 45° gives roughly 424×424, because the corners sweep out a larger bounding box.',
    body: [
      'Straightening a photo is the usual reason to rotate by a fractional angle: a scanned page or a hand-held shot is rarely level, and a two-degree correction makes the whole page look intentional.',
      '## Why the canvas grows',
      'A rotated rectangle does not fit inside its original bounding box. Either the corners get clipped or the canvas expands — expanding is the correct behaviour, and it is why the output dimensions differ from the input.',
    ],
    faq: [
      ['Does rotation blur the image?', 'Any rotation that is not a multiple of 90° resamples pixels, so yes, slightly. The effect is invisible at small angles and accumulates if you rotate repeatedly — always rotate from the original.'],
    ],
  },

  {
    slug: 'image-flip',
    name: 'Flip Image',
    title: 'Flip an Image — Mirror Horizontally or Vertically',
    desc: 'Mirror an image horizontally or vertically in the browser. Useful for correcting selfies and fixing mirrored text.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'Horizontal or vertical mirror, drawn on a canvas.',
    fields: [
      { k: 'file', label: 'Image', type: 'file' },
      { k: 'dir', label: 'Direction', type: 'sel', val: 'h', opts: [['h', 'Horizontal (mirror)'], ['v', 'Vertical (flip)']] },
    ],
    outs: [
      { k: 'out', label: 'Result', type: 'img' },
      { k: 'meta', label: 'Output', type: 'big' },
    ],
    compute: async (v) => {
      if (!v.file) return { out: '', meta: 'Choose an image' };
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That file is not a readable image'));
        i.src = v.file;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      if (v.dir === 'v') {
        ctx.translate(0, c.height);
        ctx.scale(1, -1);
      } else {
        ctx.translate(c.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(img, 0, 0);
      return { out: c.toDataURL('image/png'), meta: `${c.width} × ${c.height} px · mirrored ${v.dir === 'v' ? 'vertically' : 'horizontally'}` };
    },
    example:
      'Front cameras save an unmirrored image but the preview is mirrored, which is why selfies often look "wrong" compared to what you saw. A horizontal flip restores the preview view.',
    body: [
      'Mirroring is done by scaling the canvas by −1 on one axis and translating to compensate. Without the translate, the image draws off-canvas and the output is blank — a mistake that produces a silent empty result rather than an error.',
      '## Horizontal versus vertical',
      'Horizontal is a mirror: text becomes unreadable, faces look like the person you know from photographs. Vertical is a flip: useful for correcting upside-down scans and reflections in water.',
    ],
    faq: [
      ['Does flipping change the file size?', 'The output is re-encoded as PNG, so yes. A flipped JPEG saved as PNG will usually be much larger than the original.'],
    ],
  },

  {
    slug: 'image-format-converter',
    name: 'Image Format Converter',
    title: 'Convert Images to WebP, JPEG or PNG',
    desc: 'Convert an image to WebP, JPEG or PNG in the browser. Adjustable quality for lossy formats, with the resulting file size shown.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'WebP, JPEG or PNG, with a quality slider for the lossy ones. Shows the output size so the trade-off is visible.',
    fields: [
      { k: 'file', label: 'Image', type: 'file' },
      { k: 'fmt', label: 'Output format', type: 'sel', val: 'image/webp', opts: [['image/webp', 'WebP'], ['image/jpeg', 'JPEG'], ['image/png', 'PNG']] },
      { k: 'q', label: 'Quality (lossy formats)', type: 'num', val: 0.82, min: 0.1, max: 1, step: 0.02 },
    ],
    outs: [
      { k: 'out', label: 'Result', type: 'img' },
      { k: 'meta', label: 'Output', type: 'big' },
      { k: 'ratio', label: 'Size vs original', type: 'big' },
    ],
    compute: async (v) => {
      if (!v.file) return { out: '', meta: 'Choose an image', ratio: '—' };
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That file is not a readable image'));
        i.src = v.file;
      });
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      const ctx = c.getContext('2d');
      // JPEG 不支持透明，先铺白底，否则透明区会变黑
      if (v.fmt === 'image/jpeg') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(img, 0, 0);
      const out = c.toDataURL(v.fmt, Number(v.q) || 0.82);
      const origBytes = (String(v.file).length * 3) / 4;
      const outBytes = (out.length * 3) / 4;
      return {
        out,
        meta: `${c.width} × ${c.height} · ${(outBytes / 1024).toFixed(1)} KB`,
        ratio: `${Math.round((outBytes / origBytes) * 100)}% of original`,
      };
    },
    example:
      'WebP at quality 0.82 is typically 25–35% smaller than JPEG at the same visual quality. Below about quality 0.7, artefacts become visible on gradients and skin.',
    body: [
      'Format choice matters more than quality setting for most images. WebP wins on size for photographic content and supports transparency; PNG is for anything with sharp edges, text or few colours; JPEG is for photographs when compatibility with old software matters.',
      '## The transparency trap',
      'JPEG has no alpha channel. Converting a transparent PNG to JPEG without filling the background first produces black where the transparency was — visible immediately on a dark page and invisible on a white one.',
    ],
    faq: [
      ['Why did my PNG get larger?', 'Re-encoding an already-compressed image does not recover quality, and PNG stores raw pixel data. A photograph saved as PNG is always much bigger than the same photograph as JPEG.'],
    ],
  },

  {
    slug: 'color-converter',
    name: 'Color Converter',
    title: 'Color Converter — HEX, RGB, HSL and HSV',
    desc: 'Convert colours between HEX, RGB, HSL and HSV. Includes a live swatch, luminance and a contrast check against white and black.',
    cat: 'media',
    catName: 'Color',
    lead: 'HEX, RGB, HSL and HSV from one value, with the WCAG contrast ratio against white and black.',
    fields: [
      { k: 'mode', label: 'Input format', type: 'sel', val: 'hex', opts: [['hex', 'HEX'], ['rgb', 'RGB'], ['hsl', 'HSL']] },
      { k: 'v1', label: 'Value 1', type: 'text', val: '#4fd1c5', ph: '#4fd1c5 or 79,209,197 or 172,66%,57%' },
    ],
    outs: [
      { k: 'hex', label: 'HEX', type: 'big' },
      { k: 'rgb', label: 'RGB', type: 'big' },
      { k: 'hsl', label: 'HSL', type: 'big' },
      { k: 'hsv', label: 'HSV', type: 'big' },
      { k: 'contrast', label: 'Contrast vs white / black', type: 'big' },
      { k: 'swatch', label: 'Preview', type: 'img' },
    ],
    compute: (v) => {
      const parse = () => {
        const s = String(v.v1 || '').trim();
        if (v.mode === 'hex' || /^#?[0-9a-f]{3,8}$/i.test(s)) {
          let h = s.replace('#', '');
          if (h.length === 3) h = [...h].map((c) => c + c).join('');
          if (h.length !== 6) throw new Error('HEX must be 3 or 6 digits');
          return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
        }
        const nums = s.split(/[,%\s]+/).filter(Boolean).map(Number);
        if (nums.length < 3 || nums.some((n) => !isFinite(n))) throw new Error('Need three numbers');
        if (v.mode === 'rgb') return nums.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(n))));
        // HSL → RGB
        const [h, sat, l] = [nums[0] / 360, nums[1] / 100, nums[2] / 100];
        const k = (n) => (n + h * 12) % 12;
        const a = sat * Math.min(l, 1 - l);
        const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [f(0), f(8), f(4)].map((x) => Math.round(x * 255));
      };
      const rgb = parse();
      const [r, g, b] = rgb;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2 / 255;
      const d = max - min;
      const sat = d === 0 ? 0 : d / 255 / (1 - Math.abs(2 * l - 1));
      let hue = 0;
      if (d !== 0) {
        if (max === r) hue = 60 * (((g - b) / d) % 6);
        else if (max === g) hue = 60 * ((b - r) / d + 2);
        else hue = 60 * ((r - g) / d + 4);
      }
      if (hue < 0) hue += 360;
      const v2 = max / 255;
      const s2 = max === 0 ? 0 : d / max;
      const lum = (() => {
        const f = (c) => {
          const x = c / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      })();
      const ratio = (a, bx) => ((Math.max(a, bx) + 0.05) / (Math.min(a, bx) + 0.05)).toFixed(2);
      const hex = '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
      return {
        hex: hex.toUpperCase(),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: `hsl(${Math.round(hue)}, ${Math.round(sat * 100)}%, ${Math.round(l * 100)}%)`,
        hsv: `hsv(${Math.round(hue)}, ${Math.round(s2 * 100)}%, ${Math.round(v2 * 100)}%)`,
        contrast: `white ${ratio(lum, 1)}:1 · black ${ratio(lum, 0)}:1`,
        swatch: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="64"><rect width="200" height="64" fill="${hex}"/></svg>`)}`,
      };
    },
    example:
      '#4FD1C5 is rgb(79, 209, 197), hsl(172, 59%, 56%). Against white its contrast ratio is 1.9:1 — well below the 4.5:1 needed for body text, and the reason this colour works as an accent but not as a text colour.',
    body: [
      'HEX and RGB describe the same thing in different units; HSL describes it in the terms people actually think in — hue, saturation, lightness. Changing the lightness of an HSL colour keeps the hue, which is why design systems are usually authored in HSL and shipped in HEX.',
      '## Contrast is the measurement that matters',
      'WCAG requires 4.5:1 for body text and 3:1 for large text. A colour that looks fine on your monitor can fail badly for someone reading on a phone in daylight, and the ratio is the only way to know without testing.',
    ],
    faq: [
      ['Why does my HSL look different after conversion?', 'Because HSL and RGB do not map one-to-one at the edges — some HSL values round to the same RGB triple. Converting back can shift the numbers by a degree or a percent.'],
    ],
  },

  {
    slug: 'gradient-generator',
    name: 'CSS Gradient Generator',
    title: 'CSS Gradient Generator — Linear and Radial',
    desc: 'Build a CSS gradient with two or three colour stops, adjustable angle, and copy the ready CSS. Live preview included.',
    cat: 'media',
    catName: 'Color',
    lead: 'Two or three stops, any angle, and the CSS to paste. Preview updates as you type.',
    fields: [
      { k: 'type', label: 'Type', type: 'sel', val: 'linear', opts: [['linear', 'Linear'], ['radial', 'Radial']] },
      { k: 'angle', label: 'Angle (degrees)', type: 'num', val: 135, step: 5 },
      { k: 'c1', label: 'Start colour', type: 'text', val: '#4fd1c5' },
      { k: 'c2', label: 'End colour', type: 'text', val: '#1a202c' },
      { k: 'c3', label: 'Middle colour (blank to skip)', type: 'text', val: '' },
    ],
    outs: [
      { k: 'css', label: 'CSS', type: 'code' },
      { k: 'preview', label: 'Preview', type: 'img' },
    ],
    compute: (v) => {
      const c = [v.c1, v.c3, v.c2].filter((x) => String(x || '').trim());
      const stops = c.join(', ');
      const css = v.type === 'radial'
        ? `background: radial-gradient(circle at 50% 50%, ${stops});`
        : `background: linear-gradient(${Number(v.angle) || 0}deg, ${stops});`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${c.map((col, i) => `<stop offset="${(i / Math.max(1, c.length - 1)) * 100}%" stop-color="${col}"/>`).join('')}</linearGradient></defs><rect width="320" height="120" fill="url(#g)"/></svg>`;
      return { css, preview: `data:image/svg+xml,${encodeURIComponent(svg)}` };
    },
    example:
      '135deg runs from the top-left corner toward the bottom-right. Two colours at the same position produce a hard edge; that is how you get stripes without a repeating gradient.',
    body: [
      'Gradients are cheap visually and expensive to tune by hand — the interpolation happens in sRGB by default, which is why a gradient from blue to yellow passes through a muddy grey rather than a clean transition.',
      '## Avoiding the grey middle',
      'Choose endpoints that share a hue, or add a middle stop to steer the path. Interpolating in oklab produces perceptually even transitions, but browser support for <code>in oklab</code> is still uneven enough that most production CSS adds a third stop instead.',
    ],
    faq: [
      ['Why does my gradient band?', 'Eight-bit colour gives 256 steps per channel. Long, subtle gradients across a large area show the steps; adding very slight noise or dithering hides it.'],
    ],
  },

  {
    slug: 'color-palette',
    name: 'Image Color Palette Extractor',
    title: 'Extract a Colour Palette from an Image',
    desc: 'Pull the dominant colours out of an image, with hex codes. Useful for matching a design to a photograph.',
    cat: 'media',
    catName: 'Color',
    probe: false,
    lead: 'Quantises the image down to eight dominant colours and lists them with hex values.',
    fields: [
      { k: 'file', label: 'Image', type: 'file' },
      { k: 'n', label: 'Number of colours', type: 'num', val: 8, min: 3, max: 16, step: 1 },
    ],
    outs: [
      { k: 'list', label: 'Palette', type: 'code' },
      { k: 'preview', label: 'Swatches', type: 'img' },
    ],
    compute: async (v) => {
      if (!v.file) return { list: 'Choose an image', preview: '' };
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That file is not a readable image'));
        i.src = v.file;
      });
      // 缩到 120px 再统计：颜色分布不变，像素量降到千级
      const scale = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * scale));
      c.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      const buckets = new Map();
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        // 每通道降到 5 位，把相近颜色并到一桶
        const r = data[i] >> 3;
        const g = data[i + 1] >> 3;
        const b = data[i + 2] >> 3;
        const k = (r << 10) | (g << 5) | b;
        buckets.set(k, (buckets.get(k) || 0) + 1);
      }
      const n = Math.max(3, Math.min(16, Number(v.n) || 8));
      const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
      const total = [...buckets.values()].reduce((a, b) => a + b, 0);
      const hex = (k) => {
        const r = ((k >> 10) & 31) << 3;
        const g = ((k >> 5) & 31) << 3;
        const b = (k & 31) << 3;
        return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      };
      const list = top.map(([k, cnt], i) => `${String(i + 1).padStart(2)}. ${hex(k)}  ${((cnt / total) * 100).toFixed(1)}%`).join('\n');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${top.length * 48}" height="48">${top.map(([k], i) => `<rect x="${i * 48}" y="0" width="48" height="48" fill="${hex(k)}"/>`).join('')}</svg>`;
      return { list, preview: `data:image/svg+xml,${encodeURIComponent(svg)}` };
    },
    example:
      'The percentages are shares of sampled pixels, not of visual importance. A large area of sky will dominate the list even if the photograph is about the subject.',
    body: [
      'Palette extraction counts pixels in colour buckets and returns the largest. That is why the result often looks duller than the image feels: the dominant colour of a landscape photograph is usually sky or foliage, not the thing you noticed.',
      '## Getting a useful palette',
      'Crop to the region whose colour you want before uploading. A tight crop of a subject gives a palette about that subject; the full frame gives a palette about the scene.',
    ],
    faq: [
      ['Why are there near-duplicate colours?', 'Because the bucket size allows similar shades to survive separately when an image has a smooth gradient. Lower the number of colours to merge them.'],
    ],
  },

  {
    slug: 'favicon-generator',
    name: 'Favicon Generator',
    title: 'Favicon Generator — PNG Sizes and HTML Tags',
    desc: 'Generate favicons at 16, 32, 180 and 192 pixels from one image, with the link tags to paste into your head.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'Resize one image to the four sizes that actually get used, and get the link tags.',
    fields: [
      { k: 'file', label: 'Square image (PNG or JPG)', type: 'file' },
      { k: 'sizes', label: 'Sizes (comma separated)', type: 'text', val: '16,32,180,192' },
    ],
    outs: [
      { k: 'html', label: 'HTML to paste', type: 'code' },
      { k: 'p180', label: '180 px preview (Apple touch icon)', type: 'img' },
    ],
    compute: async (v) => {
      if (!v.file) return { html: 'Choose an image', p180: '' };
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('That file is not a readable image'));
        i.src = v.file;
      });
      const sizes = String(v.sizes || '16,32,180,192').split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => n > 0 && n <= 512);
      if (!sizes.length) throw new Error('No valid sizes');
      const out = [];
      let p180 = '';
      for (const s of sizes) {
        const c = document.createElement('canvas');
        c.width = s;
        c.height = s;
        const ctx = c.getContext('2d');
        // 图片不是正方形时居中裁切，拉伸会让图标变形
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, s, s);
        const uri = c.toDataURL('image/png');
        if (s === 180) p180 = uri;
        out.push(`<!-- ${s}×${s} -->\n<link rel="icon" type="image/png" sizes="${s}x${s}" href="favicon-${s}.png">`);
        if (s === 180) out.push('<link rel="apple-touch-icon" sizes="180x180" href="favicon-180.png">');
      }
      return { html: out.join('\n') + '\n\n<!-- save each "Result" preview as favicon-<size>.png -->', p180 };
    },
    example:
      'Four sizes cover everything that matters: 16 for browser tabs, 32 for bookmarks and taskbar, 180 for iOS home screen, 192 for Android. Anything beyond that is unused weight.',
    body: [
      'A favicon is 16 pixels wide. Detail disappears at that size, so the source image should be a simple mark with strong contrast rather than a full logo with text.',
      '## Square or it gets cropped',
      'The canvas crops to the centre square before scaling. A wide logo will lose its edges — that is better than squashing it, but the real fix is to upload a square source.',
    ],
    faq: [
      ['Do I still need favicon.ico?', 'Only for very old browsers and some desktop shortcuts. Modern targets accept PNG; a single 32 px PNG named favicon.ico also works if you need the legacy path.'],
    ],
  },

  {
    slug: 'svg-to-png',
    name: 'SVG to PNG Converter',
    title: 'Convert SVG to PNG Online',
    desc: 'Rasterise an SVG to PNG at a chosen size. Paste the SVG markup, get a downloadable PNG with transparent background.',
    cat: 'media',
    catName: 'Image',
    probe: false,
    lead: 'Paste SVG markup, choose a width, get a PNG. Transparency is preserved.',
    fields: [
      { k: 'svg', label: 'SVG markup', type: 'area', rows: 8, val: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="44" fill="#4fd1c5"/></svg>' },
      { k: 'w', label: 'Output width (px)', type: 'num', val: 512, min: 16, max: 4096, step: 16 },
      { k: 'bg', label: 'Background (blank = transparent)', type: 'text', val: '' },
    ],
    outs: [
      { k: 'out', label: 'PNG', type: 'img' },
      { k: 'meta', label: 'Output', type: 'big' },
    ],
    compute: async (v) => {
      const src = String(v.svg || '').trim();
      if (!src) return { out: '', meta: 'Paste SVG markup' };
      if (!/^<svg[\s>]/i.test(src)) throw new Error('Input must start with <svg');
      // 走 data URI 而不是 blob：blob URL 在部分浏览器里会污染 canvas
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src);
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error('The SVG could not be rendered — check for missing xmlns'));
        i.src = url;
      });
      const w = Math.max(16, Math.min(4096, Number(v.w) || 512));
      const ratio = img.naturalHeight / img.naturalWidth || 1;
      const c = document.createElement('canvas');
      c.width = w;
      c.height = Math.round(w * ratio);
      const ctx = c.getContext('2d');
      if (String(v.bg || '').trim()) {
        ctx.fillStyle = v.bg;
        ctx.fillRect(0, 0, c.width, c.height);
      }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      return { out: c.toDataURL('image/png'), meta: `${c.width} × ${c.height} px` };
    },
    example:
      'An SVG without an <code>xmlns</code> attribute renders fine in HTML and fails when loaded as an image. That single missing attribute is the most common reason an SVG-to-PNG conversion produces a blank canvas.',
    body: [
      'SVG is resolution-independent until it has to become pixels. Rasterising at 512 px and scaling down in CSS gives a crisp result on every display; rasterising at 100 px and scaling up gives a blurred one, which is how most bad logo exports happen.',
      '## Sizing',
      'Export at the largest size you will ever display, at 2× for high-density screens. A 32 px icon should be exported at 64 or 96 px.',
    ],
    faq: [
      ['Why is my output blank?', 'Either the SVG has no xmlns, or it references external fonts and images that cannot load inside an image context. Inline everything.'],
    ],
  },

  {
    slug: 'file-hash',
    name: 'File Hash Checker',
    title: 'File Hash Checker — SHA-256 Checksum',
    desc: 'Compute the SHA-256 hash of a file in your browser to verify a download. Nothing is uploaded.',
    cat: 'media',
    catName: 'Files',
    probe: false,
    lead: 'Reads the file locally and computes SHA-256. Paste a published checksum to compare.',
    fields: [
      { k: 'file', label: 'File', type: 'file', accept: '*' },
      { k: 'expect', label: 'Expected hash (optional)', type: 'text', val: '' },
    ],
    outs: [
      { k: 'hash', label: 'SHA-256', type: 'code' },
      { k: 'match', label: 'Comparison', type: 'big' },
      { k: 'meta', label: 'File', type: 'big' },
    ],
    compute: async (v) => {
      if (!v.file) return { hash: 'Choose a file', match: '—', meta: '—' };
      const bin = await (await fetch(v.file)).arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', bin);
      const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
      const expect = String(v.expect || '').trim().toLowerCase();
      return {
        hash: hex,
        match: !expect ? 'No checksum supplied' : expect === hex ? 'Match' : 'No match',
        meta: `${(bin.byteLength / 1048576).toFixed(2)} MB`,
      };
    },
    example:
      'A checksum verifies that a download completed without corruption or tampering. It only proves anything if the published hash came from a source you trust independently of the file itself.',
    body: [
      'Verifying a download means comparing the hash you compute against the hash the publisher listed. Both halves matter: computing the hash is easy, knowing which hash to trust is the actual security question.',
      '## Why the file never uploads',
      'The file is read through a data URL and hashed with WebCrypto in the tab. For a 1 GB file this will be slow and memory-hungry — a command-line tool is the right instrument past a few hundred megabytes.',
    ],
    faq: [
      ['Does a matching hash mean the file is safe?', 'No. It means the file matches the hash you compared against. If the hash was published by the same compromised source as the file, both are wrong together.'],
    ],
  },
];
