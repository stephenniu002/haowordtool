/* Node.js 生成器 — 运行：node scripts/generate-i18n.js
   生成 de / es / ar / ru 四个语言的工具页（每语言 12 个） */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const LANGS = ["de", "es", "ar", "ru"];

/* 各语言 slug（de 与 id 相同；es/ar/ru 用本地化 slug） */
const SLUGMAP = {
  es: { "currency-converter":"conversor-de-monedas","calculator":"calculadora","mortgage-calculator":"calculadora-hipotecaria","unit-converter":"conversor-de-unidades","word-counter":"contador-de-palabras","image-compressor":"compresor-de-imagenes","resize-image":"redimensionar-imagen","qr-code-generator":"generador-qr","what-is-my-ip":"mi-direccion-ip","password-generator":"generador-de-contrasenas","bmi-calculator":"calculadora-imc","age-calculator":"calculadora-de-edad","timer":"temporizador","world-clock":"reloj-mundial" },
  ar: { "currency-converter":"muhawwil-umlat","calculator":"ala-hasiba","mortgage-calculator":"hasibat-alrahn","unit-converter":"muhawwil-wahdat","word-counter":"addad-alkalimat","image-compressor":"daghit-alsuwar","resize-image":"taghyir-hajm-alsura","qr-code-generator":"mawlid-ramz-qr","what-is-my-ip":"anawani-ip","password-generator":"mawlid-kalimat-alsir","bmi-calculator":"hasibat-muashir-kutlat-aljism","age-calculator":"hasibat-aleumr","timer":"almuaqqit","world-clock":"saat-alealam" },
  ru: { "currency-converter":"konverter-valyut","calculator":"kalkulyator","mortgage-calculator":"ipotechnyy-kalkulyator","unit-converter":"konverter-edinits","word-counter":"schetchik-slov","image-compressor":"szhatie-izobrazheniy","resize-image":"izmenit-razmer","qr-code-generator":"generator-qr","what-is-my-ip":"moy-ip","password-generator":"generator-paroley","bmi-calculator":"kalkulyator-imt","age-calculator":"kalkulyator-vozrasta","timer":"taymer","world-clock":"mirovye-chasy" }
};
function slugFor(id, lang) { const m = SLUGMAP[lang]; return m ? m[id] : id; }
function toolUrl(id, lang) {
  const s = slugFor(id, lang);
  return lang === "en" ? `https://haowordtool.com/tools/${s}.html`
                       : `https://haowordtool.com/${lang}/tools/${s}.html`;
}

/* ============ 共享头部模板 ============ */
function head({ lang, title, desc, canonical, toolId }) {
  const fontFam = lang === "ja" ? "family=Noto+Sans+JP:wght@400;500;600;700;800&"
                : lang === "ar" ? "family=Noto+Sans+Arabic:wght@400;500;600;700;800&" : "";
  const hreflangs = ["en","de","ja","es","ar","ru"].map(l =>
    `<link rel="alternate" hreflang="${l}" href="${toolUrl(toolId, l)}">`).join("\n");
  return `<!DOCTYPE html>
<html lang="${lang}"${lang === "ar" ? ' dir="rtl"' : ""}>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${canonical}">
${hreflangs}
<link rel="alternate" hreflang="x-default" href="${toolUrl(toolId, "en")}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&${fontFam}display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/tools.css">
${lang === "ja" ? "<style>body{font-family:'Noto Sans JP','Inter',system-ui,sans-serif}</style>" : ""}
</head>`;
}

function header({ lang, toolTitle, toolId }) {
  const T = {
    en: { back:"← Back to all tools", langLabel:"Language" },
    de: { back:"← Zurück zu allen Tools", langLabel:"Sprache" },
    ja: { back:"← すべてのツールに戻る", langLabel:"言語" },
    es: { back:"← Volver a todas las herramientas", langLabel:"Idioma" },
    ar: { back:"عودة إلى كل الأدوات →", langLabel:"اللغة" },
    ru: { back:"← Назад ко всем инструментам", langLabel:"Язык" }
  }[lang];
  const sw = (l, label) =>
    `<a href="${toolUrl(toolId, l).replace("https://haowordtool.com","")}"${lang===l?' class="active"':""} hreflang="${l}">${label}</a>`;
  return `<body>
<div class="bg"><div class="orb orb-1"></div><div class="orb orb-2"></div></div>
<header id="header"><div class="wrap"><nav class="nav">
  <a href="../index.html" class="logo"><span class="logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>Haowordtool Tools</a>
  <div class="nav-right"><div class="lang-switch" aria-label="${T.langLabel}">
    ${sw("en","EN")}${sw("ja","JA")}${sw("de","DE")}${sw("es","ES")}${sw("ar","AR")}${sw("ru","RU")}
  </div></div>
</nav></div></header>
<main><div class="wrap tool-page">
  <a href="../index.html" class="back">${T.back}</a>
  <h1 style="margin-top:16px">${toolTitle}</h1>`;
}

function relatedBlock() {
  return `
<div class="related-tools">
  <h2 id="relatedTitle">Related Tools</h2>
  <div class="related-grid" id="relatedGrid"></div>
</div>`;
}

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

function footer({ lang, toolId, existingIds }) {
  const T = {
    en: { copy:"© 2026 Haowordtool Tools · Free forever", a:"Privacy", b:"Terms", c:"Contact" },
    de: { copy:"© 2026 Haowordtool Tools · Alles kostenlos", a:"Datenschutz", b:"AGB", c:"Kontakt" },
    ja: { copy:"© 2026 Haowordtool Tools · すべて無料", a:"プライバシー", b:"利用規約", c:"お問い合わせ" },
    es: { copy:"© 2026 Haowordtool Tools · Todo gratis", a:"Privacidad", b:"Términos", c:"Contacto" },
    ar: { copy:"© 2026 Haowordtool Tools · مجاني بالكامل", a:"الخصوصية", b:"الشروط", c:"اتصل" },
    ru: { copy:"© 2026 Haowordtool Tools · Всё бесплатно", a:"Приватность", b:"Условия", c:"Контакты" }
  }[lang];
  /* 只链向本语言已存在的页面，避免 404 */
  const relIds = (RELATED[toolId] || []).filter(rid => existingIds.has(rid));
  return `</div></main>
<footer><div class="wrap"><div class="foot"><span>${T.copy}</span>
<div class="foot-links"><a href="#">${T.a}</a><a href="#">${T.b}</a><a href="#">${T.c}</a></div>
</div></div></footer>
<script type="application/json" id="relatedData">${JSON.stringify(relIds)}</script>
<script src="/assets/related-tools.js" defer></script>`;
}

/* ============ 语言词表 ============ */
const LANG_LABELS = {
  de: {
    amount:"Betrag", from:"Von", to:"Nach", swap:"⇅ Tauschen", convert:"Umrechnen", result:"Ergebnis", rate:"Referenzkurs",
    principal:"Darlehensbetrag", years:"Laufzeit (Jahre)", rateL:"Jahreszins (%)", monthly:"Monatliche Rate", total:"Gesamtzahlung", interest:"Gesamtzinsen",
    value:"Wert", unitFrom:"Von Einheit", unitTo:"Zu Einheit", category:"Kategorie",
    text:"Text einfügen oder tippen", chars:"Zeichen", words:"Wörter", lines:"Zeilen", readTime:"Lesezeit", min:"Min",
    selectImg:"Klicken zum Hochladen", quality:"Qualität", compress:"Komprimieren", download:"Herunterladen", compressed:"Komprimiert",
    width:"Breite", height:"Höhe", keepRatio:"Seitenverhältnis beibehalten", resize:"Größe ändern",
    pwLen:"Länge", upper:"Großbuchstaben", lower:"Kleinbuchstaben", numbers:"Zahlen", symbols:"Symbole", gen:"Neues Passwort",
    qrText:"URL oder Text", qrGen:"Generieren", qrDown:"Herunterladen",
    bmiH:"Größe (cm)", bmiW:"Gewicht (kg)", bmiCalc:"BMI berechnen",
    ageBirth:"Geburtsdatum", ageCalc:"Alter berechnen",
    calcClear:"Löschen", copy:"Kopieren", copied:"Kopiert",
    start:"Start", pause:"Pause", resume:"Weiter", reset:"Zurücksetzen",
    bmiLow:"Untergewicht (unter 18,5)", bmiNormal:"Normalgewicht (18,5 – 24,9)", bmiOver:"Übergewicht (25 – 29,9)", bmiObese:"Adipositas (ab 30)"
  },
  es: {
    amount:"Cantidad", from:"De", to:"A", swap:"⇅ Intercambiar", convert:"Convertir", result:"Resultado", rate:"Tipo de referencia",
    principal:"Importe del préstamo", years:"Plazo (años)", rateL:"Tasa anual (%)", monthly:"Cuota mensual", total:"Pago total", interest:"Intereses totales",
    value:"Valor", unitFrom:"De unidad", unitTo:"A unidad", category:"Categoría",
    text:"Pega o escribe texto", chars:"Caracteres", words:"Palabras", lines:"Líneas", readTime:"Tiempo de lectura", min:"min",
    selectImg:"Haz clic para subir", quality:"Calidad", compress:"Comprimir", download:"Descargar", compressed:"Comprimido",
    width:"Ancho", height:"Alto", keepRatio:"Mantener proporción", resize:"Redimensionar",
    pwLen:"Longitud", upper:"Mayúsculas", lower:"Minúsculas", numbers:"Números", symbols:"Símbolos", gen:"Nueva contraseña",
    qrText:"URL o texto", qrGen:"Generar", qrDown:"Descargar",
    bmiH:"Altura (cm)", bmiW:"Peso (kg)", bmiCalc:"Calcular IMC",
    ageBirth:"Fecha de nacimiento", ageCalc:"Calcular edad",
    calcClear:"Borrar", copy:"Copiar", copied:"Copiado",
    start:"Iniciar", pause:"Pausar", resume:"Continuar", reset:"Reiniciar",
    bmiLow:"Bajo peso (menos de 18,5)", bmiNormal:"Peso normal (18,5 – 24,9)", bmiOver:"Sobrepeso (25 – 29,9)", bmiObese:"Obesidad (30 o más)"
  },
  ar: {
    amount:"المبلغ", from:"من", to:"إلى", swap:"⇅ تبديل", convert:"تحويل", result:"النتيجة", rate:"سعر مرجعي",
    principal:"مبلغ القرض", years:"المدة (سنوات)", rateL:"الفائدة السنوية (%)", monthly:"القسط الشهري", total:"إجمالي السداد", interest:"إجمالي الفوائد",
    value:"القيمة", unitFrom:"من وحدة", unitTo:"إلى وحدة", category:"الفئة",
    text:"الصق أو اكتب النص", chars:"أحرف", words:"كلمات", lines:"أسطر", readTime:"وقت القراءة", min:"د",
    selectImg:"انقر لتحميل صورة", quality:"الجودة", compress:"ضغط", download:"تنزيل", compressed:"بعد الضغط",
    width:"العرض", height:"الارتفاع", keepRatio:"الاحتفاظ بالنسبة", resize:"تغيير الحجم",
    pwLen:"الطول", upper:"أحرف كبيرة", lower:"أحرف صغيرة", numbers:"أرقام", symbols:"رموز", gen:"كلمة مرور جديدة",
    qrText:"رابط أو نص", qrGen:"إنشاء", qrDown:"تنزيل",
    bmiH:"الطول (سم)", bmiW:"الوزن (كغ)", bmiCalc:"احسب كتلة الجسم",
    ageBirth:"تاريخ الميلاد", ageCalc:"احسب العمر",
    calcClear:"مسح", copy:"نسخ", copied:"تم النسخ",
    start:"بدء", pause:"إيقاف", resume:"استئناف", reset:"إعادة",
    bmiLow:"نقص في الوزن (أقل من 18.5)", bmiNormal:"وزن طبيعي (18.5 – 24.9)", bmiOver:"زيادة في الوزن (25 – 29.9)", bmiObese:"سمنة (30 أو أكثر)"
  },
  ru: {
    amount:"Сумма", from:"Из", to:"В", swap:"⇅ Поменять", convert:"Конвертировать", result:"Результат", rate:"Справочный курс",
    principal:"Сумма кредита", years:"Срок (лет)", rateL:"Годовая ставка (%)", monthly:"Ежемесячный платёж", total:"Общая сумма", interest:"Общие проценты",
    value:"Значение", unitFrom:"Из единицы", unitTo:"В единицу", category:"Категория",
    text:"Вставьте или введите текст", chars:"Символы", words:"Слова", lines:"Строки", readTime:"Время чтения", min:"мин",
    selectImg:"Нажмите, чтобы загрузить", quality:"Качество", compress:"Сжать", download:"Скачать", compressed:"Сжато",
    width:"Ширина", height:"Высота", keepRatio:"Сохранять пропорции", resize:"Изменить размер",
    pwLen:"Длина", upper:"Прописные", lower:"Строчные", numbers:"Цифры", symbols:"Символы", gen:"Новый пароль",
    qrText:"URL или текст", qrGen:"Создать", qrDown:"Скачать",
    bmiH:"Рост (см)", bmiW:"Вес (кг)", bmiCalc:"Рассчитать ИМТ",
    ageBirth:"Дата рождения", ageCalc:"Рассчитать возраст",
    calcClear:"Очистить", copy:"Копировать", copied:"Скопировано",
    start:"Старт", pause:"Пауза", resume:"Продолжить", reset:"Сброс",
    bmiLow:"Недостаточный вес (менее 18,5)", bmiNormal:"Нормальный вес (18,5 – 24,9)", bmiOver:"Избыточный вес (25 – 29,9)", bmiObese:"Ожирение (30 и выше)"
  }
};

/* 单位换算分类名（各语言） */
const UCAT = {
  de: ["Länge","Gewicht","Temperatur"],
  es: ["Longitud","Peso","Temperatura"],
  ar: ["الطول","الوزن","درجة الحرارة"],
  ru: ["Длина","Вес","Температура"]
};
/* IP 页字符串 */
const IPSTR = {
  de: { title:"Ihre öffentliche IP", loading:"Standort wird geladen…", note:"Diese Seite nutzt öffentliche APIs (ipify.org, ipapi.co). Ihre IP wird nicht gespeichert." },
  es: { title:"Tu IP pública", loading:"Cargando ubicación…", note:"Esta página usa APIs públicas (ipify.org, ipapi.co). Tu IP no se almacena." },
  ar: { title:"عنوان IP العام الخاص بك", loading:"جارٍ تحميل الموقع…", note:"تستخدم هذه الصفحة واجهات عامة (ipify.org و ipapi.co). لا يتم حفظ عنوان IP الخاص بك." },
  ru: { title:"Ваш публичный IP", loading:"Загрузка местоположения…", note:"Эта страница использует публичные API (ipify.org, ipapi.co). Ваш IP не сохраняется." }
};
/* 年龄页单位词 */
const AGEU = {
  de: { y:"Jahre", m:"Monate", d:"Tage", label:"Ihr Alter", bday:"Tage bis zum Geburtstag" },
  es: { y:"años", m:"meses", d:"días", label:"Tu edad", bday:"días hasta el cumpleaños" },
  ar: { y:"سنة", m:"شهر", d:"يوم", label:"عمرك", bday:"يوم حتى عيد الميلاد" },
  ru: { y:"лет", m:"месяцев", d:"дней", label:"Ваш возраст", bday:"дней до дня рождения" }
};
/* 计时器按钮词 */
const TIMERL = {
  de: ["Pause","Weiter","Start"],
  es: ["Pausar","Continuar","Iniciar"],
  ar: ["إيقاف","استئناف","بدء"],
  ru: ["Пауза","Продолжить","Старт"]
};
/* 世界时钟城市 */
const CITYMAP = {
  de: [["Berlin","Europe/Berlin"],["London","Europe/London"],["Paris","Europe/Paris"],["New York","America/New_York"],["Los Angeles","America/Los_Angeles"],["Tokio","Asia/Tokyo"],["Peking","Asia/Shanghai"],["Singapur","Asia/Singapore"],["Sydney","Australia/Sydney"],["Dubai","Asia/Dubai"],["São Paulo","America/Sao_Paulo"],["Mexiko-Stadt","America/Mexico_City"]],
  es: [["Madrid","Europe/Madrid"],["Londres","Europe/London"],["París","Europe/Paris"],["Berlín","Europe/Berlin"],["Nueva York","America/New_York"],["Los Ángeles","America/Los_Angeles"],["Tokio","Asia/Tokyo"],["Pekín","Asia/Shanghai"],["Singapur","Asia/Singapore"],["Sídney","Australia/Sydney"],["Dubái","Asia/Dubai"],["São Paulo","America/Sao_Paulo"],["Ciudad de México","America/Mexico_City"]],
  ar: [["دبي","Asia/Dubai"],["الرياض","Asia/Riyadh"],["القاهرة","Africa/Cairo"],["لندن","Europe/London"],["باريس","Europe/Paris"],["برلين","Europe/Berlin"],["نيويورك","America/New_York"],["لوس أنجلوس","America/Los_Angeles"],["طوكيو","Asia/Tokyo"],["بكين","Asia/Shanghai"],["سنغافورة","Asia/Singapore"],["سيدني","Australia/Sydney"],["ساو باولو","America/Sao_Paulo"]],
  ru: [["Дубай","Asia/Dubai"],["Москва","Europe/Moscow"],["Лондон","Europe/London"],["Париж","Europe/Paris"],["Берлин","Europe/Berlin"],["Нью-Йорк","America/New_York"],["Лос-Анджелес","America/Los_Angeles"],["Токио","Asia/Tokyo"],["Пекин","Asia/Shanghai"],["Сингапур","Asia/Singapore"],["Сидней","Australia/Sydney"],["Сан-Паулу","America/Sao_Paulo"],["Мехико","America/Mexico_City"]]
};
const LOCALE = { de:"de-DE", es:"es-ES", ar:"ar", ru:"ru-RU" };

/* ============ 工具元数据 ============ */
const TOOLS = [
  {
    id:"calculator",
    titles:{ de:"Taschenrechner", es:"Calculadora", ar:"آلة حاسبة", ru:"Калькулятор" },
    descs:{ de:"Kostenloser Online-Taschenrechner. Grundrechenarten mit Tastatur.", es:"Calculadora online gratis. Aritmética básica con teclado.", ar:"آلة حاسبة مجانية على الإنترنت. عمليات حسابية أساسية مع دعم لوحة المفاتيح.", ru:"Бесплатный онлайн-калькулятор. Базовые арифметические операции с поддержкой клавиатуры." },
    leads:{ de:"Grundrechenarten. Mit Buttons oder Tastatur.", es:"Aritmética básica. Con botones o teclado.", ar:"عمليات حسابية أساسية. بالأزرار أو لوحة المفاتيح.", ru:"Базовые операции. Кнопками или с клавиатуры." },
    body:(L)=>`<div class="card" style="max-width:420px">
    <div class="calc-display"><div class="expr" id="expr">&nbsp;</div><div class="val" id="val">0</div></div>
    <div class="calc-grid">
      <button class="calc-btn op" data-k="C">C</button><button class="calc-btn op" data-k="±">±</button>
      <button class="calc-btn op" data-k="%">%</button><button class="calc-btn op" data-k="/">÷</button>
      <button class="calc-btn" data-k="7">7</button><button class="calc-btn" data-k="8">8</button>
      <button class="calc-btn" data-k="9">9</button><button class="calc-btn op" data-k="*">×</button>
      <button class="calc-btn" data-k="4">4</button><button class="calc-btn" data-k="5">5</button>
      <button class="calc-btn" data-k="6">6</button><button class="calc-btn op" data-k="-">−</button>
      <button class="calc-btn" data-k="1">1</button><button class="calc-btn" data-k="2">2</button>
      <button class="calc-btn" data-k="3">3</button><button class="calc-btn op" data-k="+">+</button>
      <button class="calc-btn wide" data-k="0">0</button><button class="calc-btn" data-k=".">.</button>
      <button class="calc-btn eq" data-k="=">=</button>
    </div></div>`,
    script:`let cur="0",prev=null,op=null,reset=false;
const val=document.getElementById("val"),expr=document.getElementById("expr");
function upd(){val.textContent=cur;expr.textContent=prev!==null?prev+" "+(op||""):"\\u00A0";}
function calc(a,b,o){return o==="+"?a+b:o==="-"?a-b:o==="*"?a*b:o==="/"?a/b:0;}
function press(k){if(k==="C"){cur="0";prev=null;op=null;reset=false;}else if(k==="±")cur=cur.startsWith("-")?cur.slice(1):"-"+cur;else if(k==="%")cur=String(parseFloat(cur)/100);else if(["+","-","*","/"].includes(k)){if(op&&!reset)cur=String(calc(parseFloat(prev),parseFloat(cur),op));prev=cur;op=k;reset=true;}else if(k==="="){if(op){cur=String(calc(parseFloat(prev),parseFloat(cur),op));prev=null;op=null;reset=true;}}else if(k==="."){if(!cur.includes("."))cur+=".";}else{if(reset||cur==="0"){cur=k;reset=false;}else cur+=k;}upd();}
document.querySelectorAll(".calc-btn").forEach(b=>b.onclick=()=>press(b.dataset.k));
document.addEventListener("keydown",e=>{const k=e.key;if(/[0-9]/.test(k)||["+","-","*","/","."].includes(k)){press(k);e.preventDefault();}else if(k==="Enter"||k==="="){press("=");e.preventDefault();}else if(k==="Backspace"){cur=cur.length>1?cur.slice(0,-1):"0";upd();e.preventDefault();}else if(k==="Escape"){press("C");}});
upd();`,
    seo:{
      de:`<h2>Über den Taschenrechner</h2><p>Kostenloser Online-Taschenrechner für die Grundrechenarten. Nutzen Sie die Buttons oder Ihre Tastatur.</p><h3>Verwendung</h3><ul><li>Ziffern eingeben</li><li>Operator wählen (+, −, ×, ÷)</li><li>= für das Ergebnis</li><li>C zum Löschen, ± für Vorzeichen, % für Prozent</li></ul><h3>Häufige Fragen</h3><div class="faq-item"><h3>Funktioniert es mit der Tastatur?</h3><p>Ja, Ziffern, + − * /, Enter und Backspace werden unterstützt.</p></div><div class="faq-item"><h3>Wird der Verlauf gespeichert?</h3><p>Nein. Alles läuft im Browser.</p></div>`,
      es:`<h2>Sobre la calculadora</h2><p>Calculadora online gratuita para operaciones básicas. Usa los botones o el teclado.</p><h3>Uso</h3><ul><li>Introduce los dígitos</li><li>Elige el operador (+, −, ×, ÷)</li><li>= para el resultado</li><li>C para limpiar, ± para signo, % para porcentaje</li></ul><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Funciona con teclado?</h3><p>Sí, admite dígitos, + − * /, Enter y Retroceso.</p></div><div class="faq-item"><h3>¿Se guarda el historial?</h3><p>No. Todo ocurre en el navegador.</p></div>`,
      ar:`<h2>عن الآلة الحاسبة</h2><p>آلة حاسبة مجانية على الإنترنت للعمليات الأساسية. استخدم الأزرار أو لوحة المفاتيح.</p><h3>طريقة الاستخدام</h3><ul><li>أدخل الأرقام</li><li>اختر العملية (+، −، ×، ÷)</li><li>= للحصول على النتيجة</li><li>C للمسح، ± لعكس الإشارة، % للنسبة المئوية</li></ul><h3>أسئلة شائعة</h3><div class="faq-item"><h3>هل تعمل بلوحة المفاتيح؟</h3><p>نعم. تدعم الأرقام و + − * / ومفتاح Enter ومسافة للخلف.</p></div><div class="faq-item"><h3>هل يُحفظ سجل العمليات؟</h3><p>لا. كل شيء يعمل داخل المتصفح.</p></div>`,
      ru:`<h2>О калькуляторе</h2><p>Бесплатный онлайн-калькулятор для базовых операций. Используйте кнопки или клавиатуру.</p><h3>Как пользоваться</h3><ul><li>Введите цифры</li><li>Выберите операцию (+, −, ×, ÷)</li><li>= для результата</li><li>C — очистить, ± — смена знака, % — проценты</li></ul><h3>Частые вопросы</h3><div class="faq-item"><h3>Работает ли с клавиатуры?</h3><p>Да, поддерживаются цифры, + − * /, Enter и Backspace.</p></div><div class="faq-item"><h3>Сохраняется ли история?</h3><p>Нет. Всё работает в браузере.</p></div>`
    }
  },
  {
    id:"mortgage-calculator",
    titles:{ de:"Hypothekenrechner", es:"Calculadora Hipotecaria", ar:"حاسبة الرهن", ru:"Ипотечный калькулятор" },
    descs:{ de:"Kostenloser Hypothekenrechner. Monatliche Rate, Gesamtzahlung und Gesamtzinsen sofort berechnen.", es:"Calculadora hipotecaria gratis. Cuota mensual, pago total e intereses totales.", ar:"حاسبة رهن مجانية. احسب القسط الشهري وإجمالي السداد والفوائد فورًا.", ru:"Бесплатный ипотечный калькулятор. Ежемесячный платёж, общая сумма и проценты." },
    leads:{ de:"Monatliche Rate, Gesamtzahlung und Gesamtzinsen.", es:"Cuota mensual, pago total e intereses totales.", ar:"القسط الشهري وإجمالي السداد والفوائد.", ru:"Ежемесячный платёж, общая сумма и проценты." },
    body:(L)=>`<div class="card" style="max-width:520px">
    <div style="margin-bottom:16px"><label for="p">${L.principal}</label><input type="number" id="p" value="300000" min="0"></div>
    <div class="grid2">
      <div><label for="y">${L.years}</label><input type="number" id="y" value="30" min="1"></div>
      <div><label for="r">${L.rateL}</label><input type="number" id="r" value="5" step="0.01" min="0"></div>
    </div>
    <div class="btn-row"><button class="btn btn-primary btn-block" id="go">${L.convert}</button></div>
    <div class="result" id="out" style="display:none"><div class="result-label">${L.monthly}</div><div class="result-value" id="m"></div><div class="result-note" id="note"></div></div></div>`,
    script:`function fmt(n){return n.toLocaleString(undefined,{maximumFractionDigits:0});}
document.getElementById("go").onclick=()=>{const P=parseFloat(document.getElementById("p").value)||0;const n=(parseFloat(document.getElementById("y").value)||0)*12;const r=(parseFloat(document.getElementById("r").value)||0)/100/12;if(!P||!n)return;const m=r?P*r*Math.pow(1+r,n)/(Math.pow(1+r,n)-1):P/n;const total=m*n;document.getElementById("m").textContent=fmt(m);document.getElementById("note").textContent="Total "+fmt(total)+" · Interest "+fmt(total-P);document.getElementById("out").style.display="block";};
document.getElementById("go").click();`,
    seo:{
      de:`<h2>Über den Hypothekenrechner</h2><p>Berechnet monatliche Rate, Gesamtzahlung und Gesamtzinsen. Verwendet die Annuitätenformel.</p><h3>Formel</h3><p>Rate = Darlehen × Monatszins × (1 + Monatszins)^n ÷ ((1 + Monatszins)^n − 1)</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Was ist eine Annuität?</h3><p>Bei der Annuität bleibt die Rate über die Laufzeit gleich, während sich Zins- und Tilgungsanteil verschieben.</p></div><div class="faq-item"><h3>Sind Nebenkosten enthalten?</h3><p>Nein. Notar-, Grundbuch- und Versicherungskosten sind nicht berücksichtigt.</p></div>`,
      es:`<h2>Sobre la calculadora hipotecaria</h2><p>Calcula cuota mensual, pago total e intereses totales. Usa la fórmula de amortización francesa.</p><h3>Fórmula</h3><p>Cuota = Préstamo × Tipo mensual × (1 + Tipo mensual)^n ÷ ((1 + Tipo mensual)^n − 1)</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Qué es una cuota francesa?</h3><p>Es una cuota constante durante toda la vida del préstamo. Cambia la proporción entre interés y capital.</p></div><div class="faq-item"><h3>¿Incluye gastos?</h3><p>No. Notaría, registro y seguros no se incluyen.</p></div>`,
      ar:`<h2>عن حاسبة الرهن</h2><p>تحسب القسط الشهري وإجمالي السداد وإجمالي الفوائد باستخدام صيغة القسط الثابت.</p><h3>الصيغة</h3><p>القسط = القرض × الفائدة الشهرية × (1 + الفائدة الشهرية)^n ÷ ((1 + الفائدة الشهرية)^n − 1)</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>ما هو القسط الثابت؟</h3><p>قسط شهري ثابت طوال مدة القرض، تتغير فيه نسبة الفائدة إلى أصل الدين مع الوقت.</p></div><div class="faq-item"><h3>هل تشمل الرسوم الإضافية؟</h3><p>لا. رسوم التوثيق والتسجيل والتأمين غير مشمولة.</p></div>`,
      ru:`<h2>Об ипотечном калькуляторе</h2><p>Рассчитывает ежемесячный платёж, общую сумму и общие проценты по формуле аннуитета.</p><h3>Формула</h3><p>Платёж = Кредит × Месячная ставка × (1 + Месячная ставка)^n ÷ ((1 + Месячная ставка)^n − 1)</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Что такое аннуитетный платёж?</h3><p>Платёж остаётся одинаковым весь срок кредита, меняется лишь доля процентов и основного долга.</p></div><div class="faq-item"><h3>Учтены ли дополнительные расходы?</h3><p>Нет. Нотариус, регистрация и страховка не включены.</p></div>`
    }
  },
  {
    id:"unit-converter",
    titles:{ de:"Einheitenrechner", es:"Conversor de Unidades", ar:"محول الوحدات", ru:"Конвертер единиц" },
    descs:{ de:"Kostenloser Einheitenrechner. Länge, Gewicht, Temperatur sofort umrechnen.", es:"Conversor de unidades gratis. Longitud, peso y temperatura al instante.", ar:"محول وحدات مجاني. حوّل الطول والوزن ودرجة الحرارة فورًا.", ru:"Бесплатный конвертер единиц. Длина, вес и температура мгновенно." },
    leads:{ de:"Länge, Gewicht, Temperatur.", es:"Longitud, peso, temperatura.", ar:"الطول والوزن ودرجة الحرارة.", ru:"Длина, вес, температура." },
    body:(L,lang)=>`<div class="card" style="max-width:520px">
    <div style="margin-bottom:16px"><label for="cat">${L.category}</label><select id="cat">
      <option value="length">${UCAT[lang][0]}</option>
      <option value="weight">${UCAT[lang][1]}</option>
      <option value="temp">${UCAT[lang][2]}</option>
    </select></div>
    <div style="margin-bottom:16px"><label for="v">${L.value}</label><input type="number" id="v" value="1" step="any"></div>
    <div class="grid2">
      <div><label for="from">${L.unitFrom}</label><select id="from"></select></div>
      <div><label for="to">${L.unitTo}</label><select id="to"></select></div>
    </div>
    <div class="btn-row"><button class="btn btn-primary btn-block" id="go">${L.convert}</button></div>
    <div class="result" id="out" style="display:none"><div class="result-label">${L.result}</div><div class="result-value" id="res"></div></div></div>`,
    script:`const units={length:{m:1,km:1000,cm:.01,mm:.001,mi:1609.344,yd:.9144,ft:.3048,in:.0254},weight:{kg:1,g:.001,mg:1e-6,t:1000,lb:.45359237,oz:.028349523},temp:{c:1,f:1,k:1}};
const labels={length:{m:"m",km:"km",cm:"cm",mm:"mm",mi:"mi",yd:"yd",ft:"ft",in:"in"},weight:{kg:"kg",g:"g",mg:"mg",t:"t",lb:"lb",oz:"oz"},temp:{c:"°C",f:"°F",k:"K"}};
const cat=document.getElementById("cat"),from=document.getElementById("from"),to=document.getElementById("to");
function fill(){from.innerHTML="";to.innerHTML="";Object.keys(units[cat.value]).forEach(k=>{from.innerHTML+='<option value="'+k+'">'+labels[cat.value][k]+'</option>';to.innerHTML+='<option value="'+k+'">'+labels[cat.value][k]+'</option>';});from.selectedIndex=0;to.selectedIndex=1;}
cat.onchange=fill;fill();
document.getElementById("go").onclick=()=>{const v=parseFloat(document.getElementById("v").value)||0;let res;if(cat.value==="temp"){const c=from.value==="c"?v:from.value==="f"?(v-32)*5/9:v-273.15;res=to.value==="c"?c:to.value==="f"?c*9/5+32:c+273.15;}else{res=v*units[cat.value][from.value]/units[cat.value][to.value];}document.getElementById("res").textContent=res.toFixed(6).replace(/\\.?0+$/,"")+" "+labels[cat.value][to.value];document.getElementById("out").style.display="block";};`,
    seo:{
      de:`<h2>Über den Einheitenrechner</h2><p>Rechnet Länge (m, km, cm, mm, mi, yd, ft, in), Gewicht (kg, g, mg, t, lb, oz) und Temperatur (°C, °F, K) um.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Welche Einheiten werden unterstützt?</h3><p>Länge: 8 Einheiten. Gewicht: 6 Einheiten. Temperatur: 3 Einheiten.</p></div><div class="faq-item"><h3>Wie genau ist die Umrechnung?</h3><p>Bis zu 6 Dezimalstellen.</p></div>`,
      es:`<h2>Sobre el conversor de unidades</h2><p>Convierte longitud (m, km, cm, mm, mi, yd, ft, in), peso (kg, g, mg, t, lb, oz) y temperatura (°C, °F, K).</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Qué unidades admite?</h3><p>Longitud: 8 unidades. Peso: 6 unidades. Temperatura: 3 unidades.</p></div><div class="faq-item"><h3>¿Con qué precisión?</h3><p>Hasta 6 decimales.</p></div>`,
      ar:`<h2>عن محول الوحدات</h2><p>يحوّل الطول (م، كم، سم، مم، ميل، ياردة، قدم، بوصة) والوزن (كغ، غ، ملغ، طن، رطل، أونصة) ودرجة الحرارة (°م، °ف، كلفن).</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>ما الوحدات المدعومة؟</h3><p>الطول: 8 وحدات. الوزن: 6 وحدات. درجة الحرارة: 3 وحدات.</p></div><div class="faq-item"><h3>ما دقة التحويل؟</h3><p>حتى 6 منازل عشرية.</p></div>`,
      ru:`<h2>О конвертере единиц</h2><p>Конвертирует длину (м, км, см, мм, мили, ярды, футы, дюймы), вес (кг, г, мг, т, фунты, унции) и температуру (°C, °F, K).</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Какие единицы поддерживаются?</h3><p>Длина: 8 единиц. Вес: 6 единиц. Температура: 3 единицы.</p></div><div class="faq-item"><h3>Какая точность?</h3><p>До 6 знаков после запятой.</p></div>`
    }
  },
  {
    id:"word-counter",
    titles:{ de:"Wortzähler", es:"Contador de Palabras", ar:"عداد الكلمات", ru:"Счётчик слов" },
    descs:{ de:"Kostenloser Wortzähler. Zeichen, Wörter, Zeilen und Lesezeit in Echtzeit.", es:"Contador de palabras gratis. Caracteres, palabras, líneas y tiempo de lectura en tiempo real.", ar:"عداد كلمات مجاني. الأحرف والكلمات والأسطر ووقت القراءة لحظيًا.", ru:"Бесплатный счётчик слов. Символы, слова, строки и время чтения в реальном времени." },
    leads:{ de:"Zeichen, Wörter, Zeilen und Lesezeit in Echtzeit.", es:"Caracteres, palabras, líneas y tiempo de lectura.", ar:"الأحرف والكلمات والأسطر ووقت القراءة لحظيًا.", ru:"Символы, слова, строки и время чтения." },
    body:(L)=>`<div class="card"><label for="text">${L.text}</label>
    <textarea id="text" placeholder="..." style="min-height:200px"></textarea>
    <div class="grid4" style="margin-top:18px">
      <div style="text-align:center;padding:16px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.02)"><div id="chars" style="font-family:var(--mono);font-size:24px;font-weight:700">0</div><div style="font-size:11.5px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-top:4px">${L.chars}</div></div>
      <div style="text-align:center;padding:16px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.02)"><div id="words" style="font-family:var(--mono);font-size:24px;font-weight:700">0</div><div style="font-size:11.5px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-top:4px">${L.words}</div></div>
      <div style="text-align:center;padding:16px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.02)"><div id="lines" style="font-family:var(--mono);font-size:24px;font-weight:700">0</div><div style="font-size:11.5px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-top:4px">${L.lines}</div></div>
      <div style="text-align:center;padding:16px;border:1px solid var(--border);border-radius:12px;background:rgba(255,255,255,.02)"><div id="time" style="font-family:var(--mono);font-size:24px;font-weight:700">0</div><div style="font-size:11.5px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-top:4px">${L.readTime} (${L.min})</div></div>
    </div></div>`,
    script:`const t=document.getElementById("text");function upd(){const v=t.value;document.getElementById("chars").textContent=v.length;document.getElementById("words").textContent=v.trim()?v.trim().split(/\\s+/).length:0;document.getElementById("lines").textContent=v?v.split(/\\n/).length:0;document.getElementById("time").textContent=Math.max(0,Math.ceil((v.trim()?v.trim().split(/\\s+/).length:0)/200));}t.oninput=upd;upd();`,
    seo:{
      de:`<h2>Über den Wortzähler</h2><p>Zählt Zeichen, Wörter, Zeilen und schätzt die Lesezeit. Ideal für Blogartikel, SEO und Social Media.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Wie wird die Lesezeit berechnet?</h3><p>Basierend auf ~200 Wörtern pro Minute.</p></div><div class="faq-item"><h3>Werden die Daten gespeichert?</h3><p>Nein, alles läuft im Browser.</p></div>`,
      es:`<h2>Sobre el contador de palabras</h2><p>Cuenta caracteres, palabras, líneas y estima el tiempo de lectura. Ideal para blogs, SEO y redes sociales.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Cómo se estima el tiempo?</h3><p>A ~200 palabras por minuto.</p></div><div class="faq-item"><h3>¿Se guardan los datos?</h3><p>No, todo ocurre en el navegador.</p></div>`,
      ar:`<h2>عن عداد الكلمات</h2><p>يحسب الأحرف والكلمات والأسطر ويقدّر وقت القراءة. مثالي للمقالات وتحسين محركات البحث ووسائل التواصل.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>كيف يُحسب وقت القراءة؟</h3><p>بمعدل ~200 كلمة في الدقيقة.</p></div><div class="faq-item"><h3>هل تُحفظ البيانات؟</h3><p>لا، كل شيء يعمل داخل المتصفح.</p></div>`,
      ru:`<h2>О счётчике слов</h2><p>Считает символы, слова, строки и оценивает время чтения. Идеально для блогов, SEO и соцсетей.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Как оценивается время чтения?</h3><p>Из расчёта ~200 слов в минуту.</p></div><div class="faq-item"><h3>Сохраняются ли данные?</h3><p>Нет, всё работает в браузере.</p></div>`
    }
  },
  {
    id:"image-compressor",
    titles:{ de:"Bildkomprimierung", es:"Compresor de Imágenes", ar:"ضغط الصور", ru:"Сжатие изображений" },
    descs:{ de:"Kostenlose Bildkomprimierung. JPG, PNG und WebP im Browser verkleinern. Kein Upload.", es:"Compresor de imágenes gratis. Reduce JPG, PNG y WebP en el navegador. Sin subidas.", ar:"ضغط الصور مجانًا. صغّر JPG وPNG وWebP في المتصفح. بدون رفع.", ru:"Бесплатное сжатие изображений. Уменьшайте JPG, PNG и WebP в браузере. Без загрузки на сервер." },
    leads:{ de:"Komprimiert JPG, PNG, WebP. Alles im Browser.", es:"Comprime JPG, PNG, WebP. Todo en el navegador.", ar:"يضغط JPG وPNG وWebP. كل شيء في المتصفح.", ru:"Сжимает JPG, PNG, WebP. Всё в браузере." },
    body:(L)=>`<div class="card" style="max-width:640px">
    <div id="area" style="border:2px dashed var(--border-strong);border-radius:14px;padding:40px 20px;text-align:center;cursor:pointer;background:rgba(255,255,255,.015)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:36px;height:36px;color:var(--muted-2);margin:0 auto 12px;display:block"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
      <div style="font-size:14.5px;font-weight:600">${L.selectImg}</div>
      <div style="font-size:12.5px;color:var(--muted-2)">JPG · PNG · WebP</div>
    </div>
    <input type="file" id="file" accept="image/*" style="display:none">
    <img id="preview" style="display:none;max-width:100%;max-height:300px;border-radius:12px;margin-top:18px;border:1px solid var(--border)">
    <div style="margin-top:20px"><label>${L.quality}: <span id="qv">70</span>%</label><input type="range" id="q" min="10" max="100" value="70"></div>
    <div class="btn-row"><button class="btn btn-primary" id="go" style="display:none">${L.compress}</button><a id="dl" class="btn btn-ghost" style="display:none" download="compressed.jpg">${L.download}</a></div>
    <div class="result" id="out" style="display:none"><div class="result-label">${L.compressed}</div><div class="result-value" id="info"></div></div></div>`,
    script:`const area=document.getElementById("area"),file=document.getElementById("file"),preview=document.getElementById("preview"),q=document.getElementById("q"),qv=document.getElementById("qv"),go=document.getElementById("go"),dl=document.getElementById("dl"),out=document.getElementById("out");let img=null,origKB=0;
area.onclick=()=>file.click();
file.onchange=()=>{const f=file.files[0];if(!f)return;origKB=f.size/1024;const r=new FileReader();r.onload=e=>{img=new Image();img.onload=()=>{preview.src=e.target.result;preview.style.display="block";go.style.display="inline-flex";area.style.display="none";};img.src=e.target.result;};r.readAsDataURL(f);};
q.oninput=()=>qv.textContent=q.value;
go.onclick=()=>{if(!img)return;const c=document.createElement("canvas");c.width=img.width;c.height=img.height;const ctx=c.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,0,0);c.toBlob(b=>{dl.href=URL.createObjectURL(b);dl.style.display="inline-flex";const n=b.size/1024;const r=Math.round((1-n/origKB)*100);document.getElementById("info").textContent=origKB.toFixed(0)+" KB → "+n.toFixed(0)+" KB (−"+r+"%)";out.style.display="block";},"image/jpeg",q.value/100);};`,
    seo:{
      de:`<h2>Über die Bildkomprimierung</h2><p>Verkleinert JPG, PNG und WebP direkt im Browser. Ihre Bilder werden nie hochgeladen.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Verliere ich Qualität?</h3><p>Bei 70–80% ist der Unterschied meist unsichtbar.</p></div><div class="faq-item"><h3>Mehrere Dateien gleichzeitig?</h3><p>Aktuell eine Datei pro Vorgang.</p></div>`,
      es:`<h2>Sobre el compresor de imágenes</h2><p>Reduce JPG, PNG y WebP directamente en el navegador. Tus imágenes nunca se suben.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Pierdo calidad?</h3><p>Con 70–80% la diferencia suele ser invisible.</p></div><div class="faq-item"><h3>¿Varios archivos a la vez?</h3><p>Actualmente uno por operación.</p></div>`,
      ar:`<h2>عن ضغط الصور</h2><p>يصغّر JPG وPNG وWebP مباشرة في المتصفح. لا تُرفع صورك أبدًا.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>هل أفقد الجودة؟</h3><p>عند 70–80% يكون الفرق غير ملحوظ عادة.</p></div><div class="faq-item"><h3>هل يمكن ضغط عدة ملفات معًا؟</h3><p>حاليًا ملف واحد في كل مرة.</p></div>`,
      ru:`<h2>О сжатии изображений</h2><p>Уменьшает JPG, PNG и WebP прямо в браузере. Ваши изображения никуда не загружаются.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Потеряю ли я качество?</h3><p>При 70–80% разница обычно незаметна.</p></div><div class="faq-item"><h3>Можно ли сжать несколько файлов сразу?</h3><p>Пока один файл за раз.</p></div>`
    }
  },
  {
    id:"resize-image",
    titles:{ de:"Bildgröße ändern", es:"Redimensionar Imagen", ar:"تغيير حجم الصورة", ru:"Изменить размер" },
    descs:{ de:"Kostenlos Bilder in der Größe ändern. Breite, Höhe und Seitenverhältnis anpassen.", es:"Redimensiona imágenes gratis. Ancho, alto y proporción.", ar:"غيّر حجم الصور مجانًا. العرض والارتفاع مع الحفاظ على النسبة.", ru:"Бесплатное изменение размера изображений. Ширина, высота и пропорции." },
    leads:{ de:"Breite und Höhe ändern, Seitenverhältnis optional.", es:"Cambia ancho y alto, proporción opcional.", ar:"غيّر العرض والارتفاع، مع خيار الحفاظ على النسبة.", ru:"Меняйте ширину и высоту, пропорции — по желанию." },
    body:(L)=>`<div class="card" style="max-width:640px">
    <div id="area" style="border:2px dashed var(--border-strong);border-radius:14px;padding:40px 20px;text-align:center;cursor:pointer;background:rgba(255,255,255,.015)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:36px;height:36px;color:var(--muted-2);margin:0 auto 12px;display:block"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 3v18M3 9h18"/></svg>
      <div style="font-size:14.5px;font-weight:600">${L.selectImg}</div>
      <div style="font-size:12.5px;color:var(--muted-2)">JPG · PNG · WebP</div>
    </div>
    <input type="file" id="file" accept="image/*" style="display:none">
    <img id="preview" style="display:none;max-width:100%;max-height:280px;border-radius:12px;margin-top:18px;border:1px solid var(--border)">
    <div class="grid2" style="margin-top:20px"><div><label>${L.width}</label><input type="number" id="w"></div><div><label>${L.height}</label><input type="number" id="h"></div></div>
    <label class="check-row" style="margin-top:12px;display:inline-flex"><input type="checkbox" id="ratio" checked> ${L.keepRatio}</label>
    <div class="btn-row"><a id="dl" class="btn btn-primary" style="display:none" download="resized.png">${L.resize}</a></div></div>`,
    script:`const area=document.getElementById("area"),file=document.getElementById("file"),preview=document.getElementById("preview"),w=document.getElementById("w"),h=document.getElementById("h"),ratio=document.getElementById("ratio"),dl=document.getElementById("dl");let img=null,aspect=1;
area.onclick=()=>file.click();
file.onchange=()=>{const f=file.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{img=new Image();img.onload=()=>{preview.src=e.target.result;preview.style.display="block";w.value=img.width;h.value=img.height;aspect=img.width/img.height;area.style.display="none";dl.style.display="inline-flex";};img.src=e.target.result;};r.readAsDataURL(f);};
w.oninput=()=>{if(ratio.checked&&aspect)h.value=Math.round(w.value/aspect);};
h.oninput=()=>{if(ratio.checked&&aspect)w.value=Math.round(h.value*aspect);};
dl.onclick=()=>{if(!img)return;const c=document.createElement("canvas");c.width=parseInt(w.value)||img.width;c.height=parseInt(h.value)||img.height;c.getContext("2d").drawImage(img,0,0,c.width,c.height);c.toBlob(b=>{dl.href=URL.createObjectURL(b);});};`,
    seo:{
      de:`<h2>Über die Bildgrößenänderung</h2><p>Ändert Breite und Höhe Ihrer Bilder. Die Option Seitenverhältnis beibehalten verhindert Verzerrungen.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Wie behalte ich die Proportionen?</h3><p>Aktivieren Sie Seitenverhältnis beibehalten.</p></div><div class="faq-item"><h3>Welche Formate?</h3><p>JPG, PNG, WebP. Ausgabe als PNG.</p></div>`,
      es:`<h2>Sobre redimensionar imágenes</h2><p>Cambia ancho y alto. La opción Mantener proporción evita distorsiones.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Cómo mantengo la proporción?</h3><p>Marca Mantener proporción.</p></div><div class="faq-item"><h3>¿Qué formatos?</h3><p>JPG, PNG, WebP. Salida en PNG.</p></div>`,
      ar:`<h2>عن تغيير حجم الصورة</h2><p>يغيّر عرض الصور وارتفاعها. خيار الاحتفاظ بالنسبة يمنع التشوه.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>كيف أحافظ على النسبة؟</h3><p>فعّل خيار الاحتفاظ بالنسبة.</p></div><div class="faq-item"><h3>ما الصيغ المدعومة؟</h3><p>JPG وPNG وWebP. الإخراج بصيغة PNG.</p></div>`,
      ru:`<h2>Об изменении размера</h2><p>Меняет ширину и высоту изображений. Опция сохранения пропорций предотвращает искажения.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Как сохранить пропорции?</h3><p>Включите «Сохранять пропорции».</p></div><div class="faq-item"><h3>Какие форматы?</h3><p>JPG, PNG, WebP. Результат — в PNG.</p></div>`
    }
  },
  {
    id:"qr-code-generator",
    titles:{ de:"QR-Code-Generator", es:"Generador de QR", ar:"مولّد رمز QR", ru:"Генератор QR" },
    descs:{ de:"Kostenloser QR-Code-Generator. URL oder Text als QR-Code, als PNG herunterladen.", es:"Generador de QR gratis. URL o texto a código QR, descarga en PNG.", ar:"مولّد رمز QR مجاني. حوّل الرابط أو النص إلى رمز QR ونزّله PNG.", ru:"Бесплатный генератор QR-кодов. URL или текст в QR-код, скачивание в PNG." },
    leads:{ de:"URL oder Text als QR-Code zum Download.", es:"URL o texto a QR descargable.", ar:"الرابط أو النص إلى رمز QR قابل للتنزيل.", ru:"URL или текст в QR-код для скачивания." },
    body:(L)=>`<div class="card" style="max-width:480px;text-align:center">
    <div style="margin-bottom:16px;text-align:left"><label for="qrtext">${L.qrText}</label><input type="text" id="qrtext" placeholder="https://"></div>
    <div class="btn-row" style="justify-content:center"><button class="btn btn-primary" id="go">${L.qrGen}</button></div>
    <img id="qr" style="display:none;max-width:260px;margin:20px auto;border:1px solid var(--border);border-radius:12px;padding:12px;background:#fff">
    <div class="btn-row" style="justify-content:center"><a id="dl" class="btn btn-ghost" style="display:none" download="qr.png">${L.qrDown}</a></div></div>`,
    script:`document.getElementById("go").onclick=()=>{const v=document.getElementById("qrtext").value.trim();if(!v)return;const qr=document.getElementById("qr");qr.src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data="+encodeURIComponent(v);qr.style.display="block";const dl=document.getElementById("dl");dl.href=qr.src;dl.style.display="inline-flex";};`,
    seo:{
      de:`<h2>Über den QR-Code-Generator</h2><p>Wandelt URLs oder Text in QR-Codes um. Als PNG herunterladen und überall verwenden.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Kann ich die Größe ändern?</h3><p>Der Download ist 260×260 px und lässt sich verlustfrei skalieren.</p></div><div class="faq-item"><h3>Läuft der Code ab?</h3><p>Nein. QR-Codes enthalten die Daten direkt und laufen nicht ab.</p></div>`,
      es:`<h2>Sobre el generador de QR</h2><p>Convierte URL o texto en códigos QR. Descarga en PNG y úsalo donde quieras.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Puedo cambiar el tamaño?</h3><p>La descarga es de 260×260 px y escala sin pérdida.</p></div><div class="faq-item"><h3>¿Caduca el código?</h3><p>No. Los QR contienen los datos y no caducan.</p></div>`,
      ar:`<h2>عن مولّد رمز QR</h2><p>يحوّل الرابط أو النص إلى رمز QR. نزّله PNG واستخدمه في أي مكان.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>هل يمكن تغيير الحجم؟</h3><p>التنزيل بحجم 260×260 بكسل ويمكن تكبيره دون فقدان الجودة.</p></div><div class="faq-item"><h3>هل تنتهي صلاحية الرمز؟</h3><p>لا. رموز QR تحتوي البيانات مباشرة ولا تنتهي صلاحيتها.</p></div>`,
      ru:`<h2>О генераторе QR</h2><p>Превращает URL или текст в QR-коды. Скачайте в PNG и используйте где угодно.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Можно ли изменить размер?</h3><p>Скачивание — 260×260 px, масштабируется без потерь.</p></div><div class="faq-item"><h3>Код устаревает?</h3><p>Нет. QR-коды содержат данные напрямую и не имеют срока действия.</p></div>`
    }
  },
  {
    id:"what-is-my-ip",
    titles:{ de:"Meine IP-Adresse", es:"Mi Dirección IP", ar:"عنوان IP", ru:"Мой IP" },
    descs:{ de:"Kostenlos IP prüfen. Öffentliche IP, Standort und Anbieter. Keine Anmeldung.", es:"Consulta tu IP gratis. IP pública, ubicación e ISP. Sin registro.", ar:"اعرف عنوان IP العام وموقعك ومزود الخدمة. مجاني وبدون تسجيل.", ru:"Узнайте свой IP бесплатно. Публичный IP, местоположение и провайдер. Без регистрации." },
    leads:{ de:"Öffentliche IP, Standort und Anbieter.", es:"IP pública, ubicación e ISP.", ar:"عنوان IP العام والموقع والمزود.", ru:"Публичный IP, местоположение и провайдер." },
    body:(L,lang)=>`<div class="card" style="max-width:560px">
    <div style="text-align:center;padding:8px 0 4px"><div style="font-size:12px;color:var(--muted-2);text-transform:uppercase;letter-spacing:.08em;font-weight:600">${IPSTR[lang].title}</div>
    <div id="ip" class="result-value" style="margin-top:8px">…</div></div>
    <div class="grid2" style="margin-top:20px">
      <div class="stat-box"><div class="stat-label">City</div><div class="stat-num" id="city">–</div></div>
      <div class="stat-box"><div class="stat-label">ISP</div><div class="stat-num" id="isp" style="font-size:15px">–</div></div>
    </div>
    <p class="result-note" style="margin-top:18px">${IPSTR[lang].note}</p></div>`,
    script:(L,lang)=>`fetch("https://api.ipify.org?format=json").then(r=>r.json()).then(d=>{document.getElementById("ip").textContent=d.ip;}).catch(()=>{document.getElementById("ip").textContent="n/a";});
fetch("https://ipapi.co/json/").then(r=>r.json()).then(d=>{document.getElementById("city").textContent=(d.city||"–")+", "+(d.country_name||"");document.getElementById("isp").textContent=d.org||"–";}).catch(()=>{});`,
    seo:{
      de:`<h2>Über Meine IP-Adresse</h2><p>Zeigt Ihre öffentliche IP-Adresse, den ungefähren Standort und den Internetanbieter.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Was verrät meine IP?</h3><p>Ungefährer Standort und Anbieter. Keine exakte Adresse.</p></div><div class="faq-item"><h3>Ändert sich meine IP?</h3><p>Bei den meisten Anschlüssen ja, regelmäßig.</p></div>`,
      es:`<h2>Sobre Mi dirección IP</h2><p>Muestra tu IP pública, ubicación aproximada y proveedor de internet.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Qué revela mi IP?</h3><p>Ubicación aproximada y proveedor. No una dirección exacta.</p></div><div class="faq-item"><h3>¿Cambia mi IP?</h3><p>En la mayoría de conexiones, sí, periódicamente.</p></div>`,
      ar:`<h2>عن صفحة عنوان IP</h2><p>تعرض عنوان IP العام والموقع التقريبي ومزود خدمة الإنترنت.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>ماذا يكشف عنوان IP؟</h3><p>الموقع التقريبي ومزود الخدمة. وليس العنوان الدقيق.</p></div><div class="faq-item"><h3>هل يتغير عنوان IP؟</h3><p>في معظم الاتصالات نعم، بشكل دوري.</p></div>`,
      ru:`<h2>О странице «Мой IP»</h2><p>Показывает ваш публичный IP-адрес, примерное местоположение и интернет-провайдера.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Что раскрывает мой IP?</h3><p>Примерное местоположение и провайдера. Не точный адрес.</p></div><div class="faq-item"><h3>Мой IP меняется?</h3><p>У большинства подключений — да, периодически.</p></div>`
    }
  },
  {
    id:"password-generator",
    titles:{ de:"Passwort-Generator", es:"Generador de Contraseñas", ar:"مولّد كلمات المرور", ru:"Генератор паролей" },
    descs:{ de:"Kostenloser Passwort-Generator. Starke Passwörter beliebiger Länge, lokal erzeugt.", es:"Generador de contraseñas gratis. Contraseñas seguras de cualquier longitud, generadas localmente.", ar:"مولّد كلمات مرور مجاني. كلمات قوية بطول مخصص، تُنشأ محليًا.", ru:"Бесплатный генератор паролей. Надёжные пароли любой длины, создаются локально." },
    leads:{ de:"Starke Passwörter, lokal erzeugt.", es:"Contraseñas seguras, generadas localmente.", ar:"كلمات مرور قوية، تُنشأ محليًا.", ru:"Надёжные пароли, создаются локально." },
    body:(L)=>`<div class="card" style="max-width:520px">
    <div class="pw-output" id="pw">••••••••••••</div>
    <div class="btn-row"><button class="btn btn-primary" id="go">${L.gen}</button><button class="btn btn-ghost" id="cp">${L.copy}</button></div>
    <div style="margin-top:18px"><label>${L.pwLen}: <span id="lv">16</span></label><input type="range" id="len" min="8" max="64" value="16"></div>
    <div style="margin-top:12px;display:grid;gap:10px">
      <label class="check-row"><input type="checkbox" id="u" checked> ${L.upper}</label>
      <label class="check-row"><input type="checkbox" id="l" checked> ${L.lower}</label>
      <label class="check-row"><input type="checkbox" id="n" checked> ${L.numbers}</label>
      <label class="check-row"><input type="checkbox" id="s" checked> ${L.symbols}</label>
    </div></div>`,
    script:(L)=>`const pw=document.getElementById("pw"),len=document.getElementById("len"),lv=document.getElementById("lv");
len.oninput=()=>lv.textContent=len.value;
function gen(){let pool="";if(document.getElementById("u").checked)pool+="ABCDEFGHIJKLMNOPQRSTUVWXYZ";if(document.getElementById("l").checked)pool+="abcdefghijklmnopqrstuvwxyz";if(document.getElementById("n").checked)pool+="0123456789";if(document.getElementById("s").checked)pool+="!@#$%^&*()-_=+[]{};:,.<>?";if(!pool)return;const a=new Uint32Array(len.value);crypto.getRandomValues(a);pw.textContent=[...a].map(x=>pool[x%pool.length]).join("");}
document.getElementById("go").onclick=gen;
document.getElementById("cp").onclick=()=>{navigator.clipboard.writeText(pw.textContent).then(()=>{const b=document.getElementById("cp");b.textContent="${L.copied}";setTimeout(()=>b.textContent="${L.copy}",1500);});};
gen();`,
    seo:{
      de:`<h2>Über den Passwort-Generator</h2><p>Erzeugt starke Passwörter mit kryptografisch sicherem Zufall. Nichts verlässt Ihren Browser.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Welche Länge ist sicher?</h3><p>Mindestens 16 Zeichen für wichtige Konten.</p></div><div class="faq-item"><h3>Werden Passwörter gespeichert?</h3><p>Nein. Sie werden lokal erzeugt und nie übertragen.</p></div>`,
      es:`<h2>Sobre el generador de contraseñas</h2><p>Crea contraseñas seguras con aleatoriedad criptográfica. Nada sale de tu navegador.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Qué longitud es segura?</h3><p>Al menos 16 caracteres para cuentas importantes.</p></div><div class="faq-item"><h3>¿Se guardan las contraseñas?</h3><p>No. Se generan localmente y nunca se transmiten.</p></div>`,
      ar:`<h2>عن مولّد كلمات المرور</h2><p>ينشئ كلمات مرور قوية بعشوائية آمنة تشفيريًا. لا يغادر شيء متصفحك.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>ما الطول الآمن؟</h3><p>16 حرفًا على الأقل للحسابات المهمة.</p></div><div class="faq-item"><h3>هل تُحفظ كلمات المرور؟</h3><p>لا. تُنشأ محليًا ولا تُنقل أبدًا.</p></div>`,
      ru:`<h2>О генераторе паролей</h2><p>Создаёт надёжные пароли с криптографической случайностью. Ничего не покидает ваш браузер.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Какая длина безопасна?</h3><p>Минимум 16 символов для важных аккаунтов.</p></div><div class="faq-item"><h3>Пароли сохраняются?</h3><p>Нет. Они создаются локально и никуда не передаются.</p></div>`
    }
  },
  {
    id:"age-calculator",
    titles:{ de:"Altersrechner", es:"Calculadora de Edad", ar:"حاسبة العمر", ru:"Калькулятор возраста" },
    descs:{ de:"Kostenloser Altersrechner. Genaues Alter in Jahren, Monaten und Tagen plus Countdown zum Geburtstag.", es:"Calculadora de edad gratis. Edad exacta en años, meses y días, más cuenta atrás del cumpleaños.", ar:"حاسبة عمر مجانية. العمر الدقيق بالسنوات والأشهر والأيام مع العد التنازلي لعيد الميلاد.", ru:"Бесплатный калькулятор возраста. Точный возраст в годах, месяцах и днях плюс обратный отсчёт до дня рождения." },
    leads:{ de:"Genaues Alter in Jahren, Monaten und Tagen.", es:"Edad exacta en años, meses y días.", ar:"العمر الدقيق بالسنوات والأشهر والأيام.", ru:"Точный возраст в годах, месяцах и днях." },
    body:(L)=>`<div class="card" style="max-width:480px">
    <div style="margin-bottom:16px"><label for="b">${L.ageBirth}</label><input type="date" id="b"></div>
    <div class="btn-row"><button class="btn btn-primary btn-block" id="go">${L.ageCalc}</button></div>
    <div class="result" id="out" style="display:none"><div class="result-label" id="lbl"></div><div class="result-value" id="res"></div><div class="result-note" id="note"></div></div></div>`,
    script:(L,lang)=>{const U=AGEU[lang];return `document.getElementById("go").onclick=()=>{const b=new Date(document.getElementById("b").value);if(isNaN(b))return;const n=new Date();let y=n.getFullYear()-b.getFullYear(),m=n.getMonth()-b.getMonth(),d=n.getDate()-b.getDate();if(d<0){m--;d+=new Date(n.getFullYear(),n.getMonth(),0).getDate();}if(m<0){y--;m+=12;}document.getElementById("lbl").textContent="${U.label}";document.getElementById("res").textContent=y+" ${U.y} · "+m+" ${U.m} · "+d+" ${U.d}";let nb=new Date(n.getFullYear(),b.getMonth(),b.getDate());if(nb<n)nb=new Date(n.getFullYear()+1,b.getMonth(),b.getDate());const days=Math.ceil((nb-n)/86400000);document.getElementById("note").textContent=days+" ${U.bday}";document.getElementById("out").style.display="block";};`;},
    seo:{
      de:`<h2>Über den Altersrechner</h2><p>Berechnet das genaue Alter in Jahren, Monaten und Tagen und zählt die Tage bis zum nächsten Geburtstag.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Werden Schaltjahre berücksichtigt?</h3><p>Ja, die Berechnung nutzt echte Kalenderdaten.</p></div><div class="faq-item"><h3>Werden Daten gespeichert?</h3><p>Nein, alles läuft im Browser.</p></div>`,
      es:`<h2>Sobre la calculadora de edad</h2><p>Calcula la edad exacta en años, meses y días, y los días hasta el próximo cumpleaños.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Se consideran los años bisiestos?</h3><p>Sí, el cálculo usa fechas reales del calendario.</p></div><div class="faq-item"><h3>¿Se guardan los datos?</h3><p>No, todo ocurre en el navegador.</p></div>`,
      ar:`<h2>عن حاسبة العمر</h2><p>تحسب العمر الدقيق بالسنوات والأشهر والأيام، وعدد الأيام حتى عيد الميلاد القادم.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>هل تُراعى السنوات الكبيسة؟</h3><p>نعم، يستخدم الحساب تواريخ تقويمية حقيقية.</p></div><div class="faq-item"><h3>هل تُحفظ البيانات؟</h3><p>لا، كل شيء يعمل داخل المتصفح.</p></div>`,
      ru:`<h2>О калькуляторе возраста</h2><p>Рассчитывает точный возраст в годах, месяцах и днях, а также дни до следующего дня рождения.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Учитываются ли високосные годы?</h3><p>Да, расчёт использует реальные календарные даты.</p></div><div class="faq-item"><h3>Данные сохраняются?</h3><p>Нет, всё работает в браузере.</p></div>`
    }
  },
  {
    id:"timer",
    titles:{ de:"Timer / Stoppuhr", es:"Temporizador", ar:"المؤقت", ru:"Таймер" },
    descs:{ de:"Kostenloser Timer und Stoppuhr online. 1/100-Sekunden-Genauigkeit. Keine Anmeldung.", es:"Temporizador y cronómetro online gratis. Precisión de 1/100 s. Sin registro.", ar:"مؤقت وساعة إيقاف مجانية على الإنترنت. دقة 1/100 ثانية. بدون تسجيل.", ru:"Бесплатный онлайн-таймер и секундомер. Точность 1/100 с. Без регистрации." },
    leads:{ de:"Stoppuhr mit 1/100-Sekunden-Genauigkeit.", es:"Cronómetro con precisión de 1/100 s.", ar:"ساعة إيقاف دقيقة حتى 1/100 ثانية.", ru:"Секундомер с точностью 1/100 с." },
    body:(L)=>`<div class="card" style="max-width:440px;text-align:center">
    <div class="timer-display" id="disp">00:00<span style="font-size:.45em;color:var(--muted-2)">.00</span></div>
    <div class="btn-row" style="justify-content:center;margin-top:20px">
      <button class="btn btn-primary" id="start">${L.start}</button>
      <button class="btn btn-ghost" id="reset">${L.reset}</button>
    </div></div>`,
    script:(L,lang)=>{const T=TIMERL[lang];return `let t0=0,el=0,run=false,raf;const disp=document.getElementById("disp"),sb=document.getElementById("start");
function fmt(ms){const m=Math.floor(ms/60000),s=Math.floor(ms%60000/1000),c=Math.floor(ms%1000/10);return String(m).padStart(2,"0")+":"+String(s).padStart(2,"0")+'<span style="font-size:.45em;color:var(--muted-2)">.'+String(c).padStart(2,"0")+"</span>";}
function tick(){disp.innerHTML=fmt(el+(run?Date.now()-t0:0));if(run)raf=requestAnimationFrame(tick);}
sb.onclick=()=>{if(run){el+=Date.now()-t0;run=false;cancelAnimationFrame(raf);sb.textContent="${T[1]}";}else{t0=Date.now();run=true;sb.textContent="${T[0]}";tick();}};
document.getElementById("reset").onclick=()=>{el=0;run=false;cancelAnimationFrame(raf);sb.textContent="${T[2]}";disp.innerHTML=fmt(0);};`;},
    seo:{
      de:`<h2>Über Timer / Stoppuhr</h2><p>Präzise Stoppuhr mit 1/100-Sekunden-Anzeige. Start, Pause und Zurücksetzen.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Kann ich pausieren?</h3><p>Ja, die Zeit läuft nach Weiter exakt weiter.</p></div><div class="faq-item"><h3>Läuft sie im Hintergrund?</h3><p>Beim Tabwechsel kann die Anzeige pausieren.</p></div>`,
      es:`<h2>Sobre el temporizador</h2><p>Cronómetro preciso con centésimas de segundo. Iniciar, pausar y reiniciar.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Puedo pausar?</h3><p>Sí, el tiempo continúa exactamente al reanudar.</p></div><div class="faq-item"><h3>¿Funciona en segundo plano?</h3><p>Al cambiar de pestaña la visualización puede pausarse.</p></div>`,
      ar:`<h2>عن المؤقت</h2><p>ساعة إيقاف دقيقة تعرض 1/100 ثانية. بدء وإيقاف مؤقت وإعادة.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>هل يمكن الإيقاف المؤقت؟</h3><p>نعم، يستأنف الوقت بدقة عند المتابعة.</p></div><div class="faq-item"><h3>هل يعمل في الخلفية؟</h3><p>عند تبديل التبويب قد يتوقف العرض مؤقتًا.</p></div>`,
      ru:`<h2>О таймере</h2><p>Точный секундомер с сотыми долями секунды. Старт, пауза и сброс.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Можно ли поставить на паузу?</h3><p>Да, время продолжится точно с того же места.</p></div><div class="faq-item"><h3>Работает ли в фоне?</h3><p>При переключении вкладки отображение может остановиться.</p></div>`
    }
  },
  {
    id:"world-clock",
    titles:{ de:"Weltuhr", es:"Reloj Mundial", ar:"ساعة عالمية", ru:"Мировые часы" },
    descs:{ de:"Kostenlose Weltuhr. Aktuelle Uhrzeit in den Metropolen der Welt, live.", es:"Reloj mundial gratis. Hora actual en las grandes ciudades, en vivo.", ar:"اعرف الوقت الحالي في كبرى مدن العالم. مجاني ومباشر.", ru:"Бесплатные мировые часы. Текущее время в крупных городах мира." },
    leads:{ de:"Aktuelle Uhrzeit in den Metropolen der Welt.", es:"Hora actual en las grandes ciudades.", ar:"الوقت الحالي في كبرى مدن العالم.", ru:"Текущее время в крупных городах мира." },
    body:()=>`<div class="card"><div class="clock-grid" id="clocks"></div></div>`,
    script:(L,lang)=>{const cities=CITYMAP[lang];const loc=LOCALE[lang];
      return `const cities=${JSON.stringify(cities)};
function tick(){const now=new Date();document.getElementById("clocks").innerHTML=cities.map(c=>{try{const t=new Intl.DateTimeFormat("${loc}",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false,timeZone:c[1]}).format(now);const d=new Intl.DateTimeFormat("${loc}",{weekday:"short",day:"numeric",month:"short",timeZone:c[1]}).format(now);return '<div class="clock-item"><div class="city">'+c[0]+'</div><div class="time">'+t+'</div><div class="date">'+d+"</div></div>";}catch(e){return "";}}).join("");}
tick();setInterval(tick,1000);`;},
    seo:{
      de:`<h2>Über die Weltuhr</h2><p>Zeigt die aktuelle Uhrzeit in den wichtigsten Metropolen der Welt. Aktualisiert jede Sekunde.</p><h3>Häufige Fragen</h3><div class="faq-item"><h3>Wird die Sommerzeit berücksichtigt?</h3><p>Ja, über die Intl-API des Browsers.</p></div><div class="faq-item"><h3>Wie genau ist die Zeit?</h3><p>Sie nutzt die Uhr Ihres Geräts.</p></div>`,
      es:`<h2>Sobre el reloj mundial</h2><p>Muestra la hora actual en las principales ciudades del mundo. Se actualiza cada segundo.</p><h3>Preguntas frecuentes</h3><div class="faq-item"><h3>¿Se considera el horario de verano?</h3><p>Sí, a través de la API Intl del navegador.</p></div><div class="faq-item"><h3>¿Qué tan exacta es?</h3><p>Usa el reloj de tu dispositivo.</p></div>`,
      ar:`<h2>عن الساعة العالمية</h2><p>تعرض الوقت الحالي في أهم مدن العالم. تتحدث كل ثانية.</p><h3>أسئلة شائعة</h3><div class="faq-item"><h3>هل يُراعى التوقيت الصيفي؟</h3><p>نعم، عبر واجهة Intl في المتصفح.</p></div><div class="faq-item"><h3>ما مدى دقة الوقت؟</h3><p>يستخدم ساعة جهازك.</p></div>`,
      ru:`<h2>О мировых часах</h2><p>Показывают текущее время в крупнейших городах мира. Обновляются каждую секунду.</p><h3>Частые вопросы</h3><div class="faq-item"><h3>Учитывается ли летнее время?</h3><p>Да, через Intl API браузера.</p></div><div class="faq-item"><h3>Насколько точно время?</h3><p>Используются часы вашего устройства.</p></div>`
    }
  }
];

/* ============ 生成 ============ */
const existingIds = new Set(TOOLS.map(t => t.id));
let count = 0;

for (const lang of LANGS) {
  const L = LANG_LABELS[lang];
  for (const t of TOOLS) {
    const slug = slugFor(t.id, lang);
    const canonical = toolUrl(t.id, lang);
    const bodyHtml = t.body(L, lang);
    const js = typeof t.script === "function" ? t.script(L, lang) : t.script;
    const html =
      head({ lang, title: t.titles[lang], desc: t.descs[lang], canonical, toolId: t.id }) +
      header({ lang, toolTitle: t.titles[lang], toolId: t.id }) +
      `<p class="lead">${t.leads[lang]}</p>` +
      bodyHtml +
      `<div class="seo-content">${t.seo[lang]}</div>` +
      relatedBlock() +
      footer({ lang, toolId: t.id, existingIds }) +
      `<script>${js}</script>
</body>
</html>`;
    const dir = path.join(ROOT, lang, "tools");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, slug + ".html"), html);
    count++;
    console.log("✓", lang + "/tools/" + slug + ".html");
  }
}
console.log("\n共生成 " + count + " 个文件（" + LANGS.length + " 语言 × " + TOOLS.length + " 工具）");
