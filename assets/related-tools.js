/* Related Tools — 自动检测语言和当前页面，渲染内链（6 语言版） */
(function () {
  const path = location.pathname;
  let lang = "en", base = "/tools/";
  if (path.startsWith("/ja/")) { lang = "ja"; base = "/ja/tools/"; }
  else if (path.startsWith("/de/")) { lang = "de"; base = "/de/tools/"; }
  else if (path.startsWith("/es/")) { lang = "es"; base = "/es/tools/"; }
  else if (path.startsWith("/ar/")) { lang = "ar"; base = "/ar/tools/"; }
  else if (path.startsWith("/ru/")) { lang = "ru"; base = "/ru/tools/"; }

  const slug = path.split("/").pop().replace(".html", "");
  const SLUG_TO_ID = {
    "conversor-de-monedas": "currency-converter", "calculadora": "calculator",
    "calculadora-hipotecaria": "mortgage-calculator", "conversor-de-unidades": "unit-converter",
    "contador-de-palabras": "word-counter", "compresor-de-imagenes": "image-compressor",
    "redimensionar-imagen": "resize-image", "generador-qr": "qr-code-generator",
    "mi-direccion-ip": "what-is-my-ip", "generador-de-contrasenas": "password-generator",
    "calculadora-imc": "bmi-calculator", "calculadora-de-edad": "age-calculator",
    "temporizador": "timer", "reloj-mundial": "world-clock",
    "konverter-valyut": "currency-converter", "kalkulyator": "calculator",
    "ipotechnyy-kalkulyator": "mortgage-calculator", "konverter-edinits": "unit-converter",
    "schetchik-slov": "word-counter", "szhatie-izobrazheniy": "image-compressor",
    "izmenit-razmer": "resize-image", "generator-qr": "qr-code-generator",
    "moy-ip": "what-is-my-ip", "generator-paroley": "password-generator",
    "kalkulyator-imt": "bmi-calculator", "kalkulyator-vozrasta": "age-calculator",
    "taymer": "timer", "mirovye-chasy": "world-clock",
    "muhawwil-umlat": "currency-converter", "ala-hasiba": "calculator",
    "hasibat-alrahn": "mortgage-calculator", "muhawwil-wahdat": "unit-converter",
    "addad-alkalimat": "word-counter", "daghit-alsuwar": "image-compressor",
    "taghyir-hajm-alsura": "resize-image", "mawlid-ramz-qr": "qr-code-generator",
    "anawani-ip": "what-is-my-ip", "mawlid-kalimat-alsir": "password-generator",
    "hasibat-muashir-kutlat-aljism": "bmi-calculator", "hasibat-aleumr": "age-calculator",
    "almuaqqit": "timer", "saat-alealam": "world-clock"
  };
  const id = SLUG_TO_ID[slug] || slug;

  const RELATED = {
    "currency-converter": ["calculator","mortgage-calculator","unit-converter"],
    "calculator": ["currency-converter","mortgage-calculator","unit-converter"],
    "mortgage-calculator": ["calculator","currency-converter","bmi-calculator"],
    "unit-converter": ["currency-converter","calculator","word-counter"],
    "word-counter": ["calculator","bmi-calculator","age-calculator"],
    "image-compressor": ["resize-image","qr-code-generator","password-generator"],
    "resize-image": ["image-compressor","qr-code-generator","world-clock"],
    "qr-code-generator": ["image-compressor","password-generator","resize-image"],
    "what-is-my-ip": ["password-generator","world-clock","qr-code-generator"],
    "password-generator": ["what-is-my-ip","qr-code-generator","image-compressor"],
    "bmi-calculator": ["age-calculator","word-counter","timer"],
    "age-calculator": ["bmi-calculator","world-clock","timer"],
    "timer": ["world-clock","age-calculator","bmi-calculator"],
    "world-clock": ["timer","age-calculator","what-is-my-ip"]
  };

  /* 页面可通过 <script type="application/json" id="relatedData">["id1","id2"]</script>
     覆盖默认内链（用于某语言下目标页面尚未上线时避免 404） */
  let relIds = RELATED[id] || [];
  try {
    const ov = document.getElementById("relatedData");
    if (ov) { const p = JSON.parse(ov.textContent); if (Array.isArray(p) && p.length) relIds = p; }
  } catch (e) {}

  const NAMES = {
    "currency-converter": { en:"Currency Converter", de:"Währungsrechner", ja:"通貨換算", es:"Conversor de Monedas", ar:"محول العملات", ru:"Конвертер валют" },
    "calculator":         { en:"Calculator",         de:"Taschenrechner", ja:"電卓",       es:"Calculadora", ar:"آلة حاسبة", ru:"Калькулятор" },
    "mortgage-calculator":{ en:"Mortgage Calculator",de:"Hypothekenrechner", ja:"住宅ローン計算", es:"Calculadora Hipotecaria", ar:"حاسبة الرهن", ru:"Ипотечный калькулятор" },
    "unit-converter":     { en:"Unit Converter",     de:"Einheitenrechner", ja:"単位換算",   es:"Conversor de Unidades", ar:"محول الوحدات", ru:"Конвертер единиц" },
    "word-counter":       { en:"Word Counter",       de:"Wortzähler",       ja:"文字数カウント", es:"Contador de Palabras", ar:"عداد الكلمات", ru:"Счётчик слов" },
    "image-compressor":   { en:"Image Compressor",   de:"Bildkomprimierung",ja:"画像圧縮",   es:"Compresor de Imágenes", ar:"ضغط الصور", ru:"Сжатие изображений" },
    "resize-image":       { en:"Resize Image",       de:"Bildgröße ändern", ja:"画像リサイズ", es:"Redimensionar Imagen", ar:"تغيير حجم الصورة", ru:"Изменить размер" },
    "qr-code-generator":  { en:"QR Code Generator",  de:"QR-Code-Generator",ja:"QR コード生成", es:"Generador de QR", ar:"مولّد رمز QR", ru:"Генератор QR" },
    "what-is-my-ip":      { en:"What Is My IP",      de:"Meine IP-Adresse", ja:"IP アドレス確認", es:"Mi Dirección IP", ar:"عنوان IP", ru:"Мой IP" },
    "password-generator": { en:"Password Generator", de:"Passwort-Generator",ja:"パスワード生成", es:"Generador de Contraseñas", ar:"مولّد كلمات المرور", ru:"Генератор паролей" },
    "bmi-calculator":     { en:"BMI Calculator",     de:"BMI-Rechner",      ja:"BMI 計算",   es:"Calculadora IMC", ar:"حاسبة كتلة الجسم", ru:"Калькулятор ИМТ" },
    "age-calculator":     { en:"Age Calculator",     de:"Altersrechner",    ja:"年齢計算",   es:"Calculadora de Edad", ar:"حاسبة العمر", ru:"Калькулятор возраста" },
    "timer":              { en:"Timer / Stopwatch",  de:"Timer / Stoppuhr", ja:"タイマー",   es:"Temporizador", ar:"المؤقت", ru:"Таймер" },
    "world-clock":        { en:"World Clock",        de:"Weltuhr",          ja:"世界時計",   es:"Reloj Mundial", ar:"ساعة عالمية", ru:"Мировые часы" }
  };

  const EN_SLUGS = { "currency-converter":"currency-converter","calculator":"calculator","mortgage-calculator":"mortgage-calculator","unit-converter":"unit-converter","word-counter":"word-counter","image-compressor":"image-compressor","resize-image":"resize-image","qr-code-generator":"qr-code-generator","what-is-my-ip":"what-is-my-ip","password-generator":"password-generator","bmi-calculator":"bmi-calculator","age-calculator":"age-calculator","timer":"timer","world-clock":"world-clock" };
  const SLUGS = {
    en: EN_SLUGS, de: EN_SLUGS, ja: EN_SLUGS,
    es: { "currency-converter":"conversor-de-monedas","calculator":"calculadora","mortgage-calculator":"calculadora-hipotecaria","unit-converter":"conversor-de-unidades","word-counter":"contador-de-palabras","image-compressor":"compresor-de-imagenes","resize-image":"redimensionar-imagen","qr-code-generator":"generador-qr","what-is-my-ip":"mi-direccion-ip","password-generator":"generador-de-contrasenas","bmi-calculator":"calculadora-imc","age-calculator":"calculadora-de-edad","timer":"temporizador","world-clock":"reloj-mundial" },
    ar: { "currency-converter":"muhawwil-umlat","calculator":"ala-hasiba","mortgage-calculator":"hasibat-alrahn","unit-converter":"muhawwil-wahdat","word-counter":"addad-alkalimat","image-compressor":"daghit-alsuwar","resize-image":"taghyir-hajm-alsura","qr-code-generator":"mawlid-ramz-qr","what-is-my-ip":"anawani-ip","password-generator":"mawlid-kalimat-alsir","bmi-calculator":"hasibat-muashir-kutlat-aljism","age-calculator":"hasibat-aleumr","timer":"almuaqqit","world-clock":"saat-alealam" },
    ru: { "currency-converter":"konverter-valyut","calculator":"kalkulyator","mortgage-calculator":"ipotechnyy-kalkulyator","unit-converter":"konverter-edinits","word-counter":"schetchik-slov","image-compressor":"szhatie-izobrazheniy","resize-image":"izmenit-razmer","qr-code-generator":"generator-qr","what-is-my-ip":"moy-ip","password-generator":"generator-paroley","bmi-calculator":"kalkulyator-imt","age-calculator":"kalkulyator-vozrasta","timer":"taymer","world-clock":"mirovye-chasy" }
  };

  const ICONS = {
    "currency-converter":'<circle cx="12" cy="12" r="10"/><path d="M12 6v12M15 9h-4.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H9"/>',
    "calculator":'<rect x="4" y="2" width="16" height="20" rx="2"/>',
    "mortgage-calculator":'<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    "unit-converter":'<path d="M2 12h20"/>',
    "word-counter":'<path d="M4 7h16M4 12h10M4 17h7"/>',
    "image-compressor":'<rect x="3" y="3" width="18" height="18" rx="3"/>',
    "resize-image":'<rect x="3" y="3" width="18" height="18" rx="3"/>',
    "qr-code-generator":'<rect x="3" y="3" width="7" height="7" rx="1"/>',
    "what-is-my-ip":'<circle cx="12" cy="12" r="10"/>',
    "password-generator":'<rect x="3" y="11" width="18" height="11" rx="2"/>',
    "bmi-calculator":'<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67"/>',
    "age-calculator":'<rect x="3" y="4" width="18" height="18" rx="2"/>',
    "timer":'<circle cx="12" cy="13" r="8"/>',
    "world-clock":'<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'
  };

  const TITLE = { en:"Related Tools", de:"Verwandte Tools", ja:"関連ツール", es:"Herramientas relacionadas", ar:"أدوات ذات صلة", ru:"Похожие инструменты" };
  const OPEN = { en:"Open tool", de:"Tool öffnen", ja:"ツールを開く", es:"Abrir herramienta", ar:"افتح الأداة", ru:"Открыть инструмент" };

  const titleEl = document.getElementById("relatedTitle");
  const gridEl = document.getElementById("relatedGrid");
  if (!titleEl || !gridEl) return;

  titleEl.textContent = TITLE[lang];
  gridEl.innerHTML = relIds.map(rid => `
    <a href="${base}${SLUGS[lang][rid]}.html" class="related-card">
      <span class="r-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[rid]}</svg></span>
      <div><b>${NAMES[rid][lang]}</b><span>${OPEN[lang]}</span></div>
    </a>
  `).join("");
})();
