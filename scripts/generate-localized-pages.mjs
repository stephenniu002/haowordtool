import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = 'https://haowordtool.com';
const languages = ['zh', 'en', 'ja', 'fr', 'es'];
const suffix = {zh:'中文', en:'English', ja:'日本語', fr:'français', es:'español'};
const languageNames = {
  zh: {zh:'中文', en:'英语', ja:'日语', fr:'法语', es:'西班牙语'},
  en: {zh:'Chinese', en:'English', ja:'Japanese', fr:'French', es:'Spanish'},
  ja: {zh:'中国語', en:'英語', ja:'日本語', fr:'フランス語', es:'スペイン語'},
  fr: {zh:'chinois', en:'anglais', ja:'japonais', fr:'français', es:'espagnol'},
  es: {zh:'chino', en:'inglés', ja:'japonés', fr:'francés', es:'español'}
};

const ui = {
  zh: {
    lang: 'zh-CN',
    nav: ['首页','价格','模板','多平台发布','联系'],
    label: '对应页面',
    intro: '这是当前语言版本的对应页面。核心页面、功能入口和服务说明会保持同一套结构，避免切换语言后找不到相同内容。',
    actions: ['打开当前语言首页','查看主页面','联系支持'],
    sections: ['页面内容','交付状态','语言切换'],
    notes: [
      '本页保留与主页面相同的主题和入口，便于不同语言用户访问同一项功能。',
      '如果某项服务需要人工确认，价格、范围和交付方式会在付款前书面确认。',
      '页面导航已按当前语言生成；品牌名、平台名和技术缩写会按原名显示。'
    ],
    footer: 'HaoWord Studio 多语言页面'
  },
  en: {
    lang: 'en',
    nav: ['Home','Pricing','Templates','Social Publisher','Contact'],
    label: 'Matching Page',
    intro: 'This is the matching page for the selected language. Core pages, feature entries and service notes keep the same structure so users do not lose context after switching languages.',
    actions: ['Open language home','View main page','Contact support'],
    sections: ['Page Content','Delivery Status','Language Switch'],
    notes: [
      'This page keeps the same topic and entry point as the main page for consistent multilingual navigation.',
      'When a service needs manual confirmation, price, scope and delivery details are confirmed in writing before payment.',
      'Navigation is generated for the current language. Brand names, platform names and technical abbreviations keep their original names.'
    ],
    footer: 'HaoWord Studio multilingual pages'
  },
  ja: {
    lang: 'ja',
    nav: ['ホーム','料金','テンプレート','ソーシャル配信','連絡'],
    label: '対応ページ',
    intro: 'これは選択された言語に対応するページです。主要ページ、機能入口、サービス説明は同じ構造を保ち、言語を切り替えても同じ内容に戻れます。',
    actions: ['この言語のホームへ','メインページを見る','サポートへ連絡'],
    sections: ['ページ内容','提供状況','言語切り替え'],
    notes: [
      'このページはメインページと同じテーマと入口を保ち、多言語ナビゲーションをそろえます。',
      '手動確認が必要なサービスでは、支払い前に価格、範囲、提供方法を書面で確認します。',
      'ナビゲーションは現在の言語で生成されます。ブランド名、プラットフォーム名、技術略語は原名を使用します。'
    ],
    footer: 'HaoWord Studio 多言語ページ'
  },
  fr: {
    lang: 'fr',
    nav: ['Accueil','Tarifs','Modèles','Publication sociale','Contact'],
    label: 'Page correspondante',
    intro: 'Voici la page correspondante pour la langue choisie. Les pages principales, les accès aux fonctions et les notes de service gardent la même structure afin que le changement de langue reste clair.',
    actions: ['Ouvrir l’accueil','Voir la page principale','Contacter le support'],
    sections: ['Contenu de la page','État de livraison','Changement de langue'],
    notes: [
      'Cette page garde le même sujet et le même point d’entrée que la page principale pour une navigation multilingue cohérente.',
      'Lorsqu’un service exige une confirmation manuelle, le prix, le périmètre et la livraison sont confirmés par écrit avant paiement.',
      'La navigation est générée dans la langue actuelle. Les noms de marque, de plateformes et les abréviations techniques conservent leur forme d’origine.'
    ],
    footer: 'Pages multilingues HaoWord Studio'
  },
  es: {
    lang: 'es',
    nav: ['Inicio','Precios','Plantillas','Publicación social','Contacto'],
    label: 'Página correspondiente',
    intro: 'Esta es la página correspondiente para el idioma elegido. Las páginas principales, las entradas de funciones y las notas de servicio mantienen la misma estructura para no perder contexto al cambiar de idioma.',
    actions: ['Abrir inicio','Ver página principal','Contactar soporte'],
    sections: ['Contenido de la página','Estado de entrega','Cambio de idioma'],
    notes: [
      'Esta página mantiene el mismo tema y punto de entrada que la página principal para una navegación multilingüe coherente.',
      'Cuando un servicio requiere confirmación manual, el precio, el alcance y la entrega se confirman por escrito antes del pago.',
      'La navegación se genera en el idioma actual. Los nombres de marca, plataformas y abreviaturas técnicas conservan su forma original.'
    ],
    footer: 'Páginas multilingües de HaoWord Studio'
  }
};

const pages = [
  ['about.html', {
    zh: ['关于 HaoWord Studio', '了解网站目的、编辑标准、服务边界和联系方式。'],
    en: ['About HaoWord Studio', 'Understand the site purpose, editorial standards, service boundaries and contact paths.'],
    ja: ['HaoWord Studio について', 'サイトの目的、編集基準、サービス範囲、連絡方法を確認できます。'],
    fr: ['À propos de HaoWord Studio', 'Comprendre l’objectif du site, les règles éditoriales, les limites de service et les contacts.'],
    es: ['Acerca de HaoWord Studio', 'Conoce el propósito del sitio, los estándares editoriales, los límites del servicio y las vías de contacto.']
  }],
  ['ai-companion.html', {
    zh: ['AI 伴侣', '查看角色设定、聊天入口和当前功能状态。'],
    en: ['AI Companion', 'Review character settings, chat entry points and the current feature status.'],
    ja: ['AI コンパニオン', 'キャラクター設定、チャット入口、現在の機能状態を確認できます。'],
    fr: ['Compagnon IA', 'Consulter les personnages, les accès de discussion et l’état actuel de la fonction.'],
    es: ['Compañero IA', 'Consulta personajes, accesos al chat y el estado actual de la función.']
  }],
  ['app-builder.html', {
    zh: ['应用工作台', '编辑 HTML、CSS 和 JavaScript，预览并导出静态项目。'],
    en: ['App Studio', 'Edit HTML, CSS and JavaScript, preview and export a static project.'],
    ja: ['アプリ作成ワークスペース', 'HTML、CSS、JavaScript を編集し、静的プロジェクトをプレビューして書き出します。'],
    fr: ['Atelier d’application', 'Modifier HTML, CSS et JavaScript, prévisualiser et exporter un projet statique.'],
    es: ['Estudio de aplicaciones', 'Edita HTML, CSS y JavaScript, previsualiza y exporta un proyecto estático.']
  }],
  ['blog.html', {
    zh: ['学习指南', '阅读单词、拼写、网页制作和工具使用的实践指南。'],
    en: ['Learning Guides', 'Read practical guides for words, spelling, web creation and tool workflows.'],
    ja: ['学習ガイド', '単語、スペル、Web 制作、ツール操作の実用ガイドを読めます。'],
    fr: ['Guides pratiques', 'Lire des guides pratiques sur les mots, l’orthographe, le Web et les outils.'],
    es: ['Guías prácticas', 'Lee guías prácticas sobre palabras, ortografía, creación web y herramientas.']
  }],
  ['contact.html', {
    zh: ['联系支持', '发送纠错、服务咨询、隐私请求或交付问题。'],
    en: ['Contact Support', 'Send corrections, service questions, privacy requests or delivery issues.'],
    ja: ['サポートへ連絡', '修正依頼、サービス相談、プライバシー依頼、提供に関する問題を送れます。'],
    fr: ['Contacter le support', 'Envoyer une correction, une question de service, une demande de confidentialité ou un problème de livraison.'],
    es: ['Contactar soporte', 'Envía correcciones, consultas de servicio, solicitudes de privacidad o problemas de entrega.']
  }],
  ['custom-web-design.html', {
    zh: ['定制网站服务', '提交定制网页需求，付款前确认范围、价格和交付方式。'],
    en: ['Custom Website Service', 'Submit a custom website request with scope, price and delivery confirmed before payment.'],
    ja: ['カスタムサイト制作', '支払い前に範囲、価格、提供方法を確認してサイト制作を依頼できます。'],
    fr: ['Service de site personnalisé', 'Demander un site avec périmètre, prix et livraison confirmés avant paiement.'],
    es: ['Servicio web personalizado', 'Solicita un sitio con alcance, precio y entrega confirmados antes del pago.']
  }],
  ['editorial-standards.html', {
    zh: ['编辑标准', '查看内容审核、事实边界、更新和纠错原则。'],
    en: ['Editorial Standards', 'Review content checks, factual boundaries, updates and correction principles.'],
    ja: ['編集基準', '内容確認、事実範囲、更新、修正方針を確認できます。'],
    fr: ['Règles éditoriales', 'Consulter les contrôles de contenu, limites factuelles, mises à jour et corrections.'],
    es: ['Estándares editoriales', 'Revisa controles de contenido, límites factuales, actualizaciones y correcciones.']
  }],
  ['faq.html', {
    zh: ['常见问题', '查看功能、付款、交付、隐私和使用限制的简短说明。'],
    en: ['Frequently Asked Questions', 'Find short answers about features, payment, delivery, privacy and limits.'],
    ja: ['よくある質問', '機能、支払い、提供、プライバシー、制限について確認できます。'],
    fr: ['Questions fréquentes', 'Réponses courtes sur les fonctions, paiement, livraison, confidentialité et limites.'],
    es: ['Preguntas frecuentes', 'Respuestas breves sobre funciones, pago, entrega, privacidad y límites.']
  }],
  ['how-it-works.html', {
    zh: ['工作原理', '了解工具匹配、数据来源、隐私和限制。'],
    en: ['How It Works', 'Understand tool matching, data sources, privacy and limits.'],
    ja: ['仕組み', 'ツールの照合、データ元、プライバシー、制限を理解できます。'],
    fr: ['Fonctionnement', 'Comprendre la correspondance, les sources de données, la confidentialité et les limites.'],
    es: ['Cómo funciona', 'Entiende coincidencias, fuentes de datos, privacidad y límites.']
  }],
  ['ielts-course.html', {
    zh: ['IELTS 英语课程', '查看课程购买、Google Drive 交付和人工确认流程。'],
    en: ['IELTS English Course', 'Review course purchase, Google Drive delivery and manual confirmation.'],
    ja: ['IELTS 英語コース', 'コース購入、Google Drive 提供、手動確認の流れを確認できます。'],
    fr: ['Cours d’anglais IELTS', 'Voir l’achat du cours, la livraison Google Drive et la confirmation manuelle.'],
    es: ['Curso de inglés IELTS', 'Consulta compra del curso, entrega por Google Drive y confirmación manual.']
  }],
  ['local-ai.html', {
    zh: ['企业本地 AI', '了解企业本地 AI 部署、数据边界和咨询流程。'],
    en: ['Local AI for Business', 'Review local AI deployment, data boundaries and consultation flow.'],
    ja: ['企業向けローカル AI', 'ローカル AI 導入、データ境界、相談手順を確認できます。'],
    fr: ['IA locale pour entreprise', 'Examiner le déploiement local, les limites de données et la consultation.'],
    es: ['IA local para empresas', 'Revisa despliegue local, límites de datos y consulta.']
  }],
  ['media-downloader.html', {
    zh: ['媒体下载工具', '查看媒体下载入口、适用范围和使用限制。'],
    en: ['Media Downloader', 'Review media download entry points, scope and usage limits.'],
    ja: ['メディアダウンロードツール', 'ダウンロード入口、適用範囲、利用制限を確認できます。'],
    fr: ['Téléchargeur média', 'Consulter les accès, le périmètre et les limites d’utilisation.'],
    es: ['Descargador de medios', 'Consulta accesos, alcance y límites de uso.']
  }],
  ['order.html', {
    zh: ['订单请求', '提交人工订单请求，付款前确认产品、价格和交付。'],
    en: ['Order Request', 'Submit a manual order request with product, price and delivery confirmed before payment.'],
    ja: ['注文リクエスト', '支払い前に商品、価格、提供内容を確認して手動注文できます。'],
    fr: ['Demande de commande', 'Envoyer une demande avec produit, prix et livraison confirmés avant paiement.'],
    es: ['Solicitud de pedido', 'Envía una solicitud con producto, precio y entrega confirmados antes del pago.']
  }],
  ['pricing.html', {
    zh: ['价格与服务', '查看免费工具、模板包、课程、定制网站和发布服务价格。'],
    en: ['Pricing and Services', 'Review free tools, template packs, courses, custom websites and publishing service prices.'],
    ja: ['料金とサービス', '無料ツール、テンプレート、コース、制作、配信サービスの料金を確認できます。'],
    fr: ['Tarifs et services', 'Voir outils gratuits, modèles, cours, sites personnalisés et service de publication.'],
    es: ['Precios y servicios', 'Consulta herramientas gratis, plantillas, cursos, sitios personalizados y publicación.']
  }],
  ['privacy.html', {
    zh: ['隐私政策', '了解本地草稿、浏览器数据、邮件和广告相关处理。'],
    en: ['Privacy Policy', 'Understand local drafts, browser data, email and advertising-related processing.'],
    ja: ['プライバシーポリシー', 'ローカル下書き、ブラウザデータ、メール、広告関連処理を確認できます。'],
    fr: ['Politique de confidentialité', 'Comprendre brouillons locaux, données navigateur, e-mails et publicité.'],
    es: ['Política de privacidad', 'Entiende borradores locales, datos del navegador, correo y publicidad.']
  }],
  ['publisher.html', {
    zh: ['发布工作台', '登录后管理已配置账号、上传素材并创建发布请求。'],
    en: ['Publishing Workspace', 'Manage configured accounts, upload assets and create publishing requests after login.'],
    ja: ['配信ワークスペース', 'ログイン後、設定済みアカウント、素材、配信依頼を管理できます。'],
    fr: ['Espace de publication', 'Gérer comptes configurés, fichiers et demandes de publication après connexion.'],
    es: ['Espacio de publicación', 'Gestiona cuentas configuradas, archivos y solicitudes tras iniciar sesión.']
  }],
  ['share.html', {
    zh: ['分享页面', '查看项目分享入口和访问说明。'],
    en: ['Share Page', 'Review project sharing entry points and access notes.'],
    ja: ['共有ページ', 'プロジェクト共有入口とアクセス説明を確認できます。'],
    fr: ['Page de partage', 'Voir les accès de partage et les notes d’accès.'],
    es: ['Página para compartir', 'Consulta accesos de uso compartido y notas de acceso.']
  }],
  ['social-publisher.html', {
    zh: ['多平台发布服务', '申请抖音、TikTok、小红书、B站、YouTube 等平台的发布流程配置。'],
    en: ['Social Publisher Service', 'Request publishing workflow setup for Douyin, TikTok, Xiaohongshu, Bilibili, YouTube and more.'],
    ja: ['ソーシャル配信サービス', 'Douyin、TikTok、Xiaohongshu、Bilibili、YouTube などの配信設定を依頼できます。'],
    fr: ['Service de publication sociale', 'Demander une configuration pour Douyin, TikTok, Xiaohongshu, Bilibili, YouTube et plus.'],
    es: ['Servicio de publicación social', 'Solicita configuración para Douyin, TikTok, Xiaohongshu, Bilibili, YouTube y más.']
  }],
  ['templates.html', {
    zh: ['网页模板包', '查看可编辑 HTML、CSS 和 JavaScript 模板包与交付方式。'],
    en: ['Website Template Packs', 'Review editable HTML, CSS and JavaScript template packs and delivery.'],
    ja: ['Web テンプレート集', '編集可能な HTML、CSS、JavaScript テンプレートと提供方法を確認できます。'],
    fr: ['Packs de modèles Web', 'Voir les modèles HTML, CSS et JavaScript modifiables et leur livraison.'],
    es: ['Paquetes de plantillas web', 'Consulta plantillas editables HTML, CSS y JavaScript y su entrega.']
  }],
  ['terms.html', {
    zh: ['使用条款', '查看使用限制、付款、交付、退款和责任说明。'],
    en: ['Terms of Use', 'Review usage limits, payment, delivery, refunds and liability notes.'],
    ja: ['利用規約', '利用制限、支払い、提供、返金、責任範囲を確認できます。'],
    fr: ['Conditions d’utilisation', 'Consulter les limites d’usage, paiement, livraison, remboursements et responsabilité.'],
    es: ['Términos de uso', 'Revisa límites de uso, pago, entrega, reembolsos y responsabilidad.']
  }],
  ['unscrambler.html', {
    zh: ['英文单词解谜工具', '输入字母查找可组成的英文单词，并了解匹配规则。'],
    en: ['Word Unscrambler', 'Enter letters to find buildable English words and understand matching rules.'],
    ja: ['英単語並べ替えツール', '文字を入力して作れる英単語を探し、照合ルールを理解できます。'],
    fr: ['Solveur de lettres anglaises', 'Entrer des lettres pour trouver des mots anglais et comprendre les règles.'],
    es: ['Solucionador de palabras inglesas', 'Introduce letras para encontrar palabras inglesas y entender las reglas.']
  }],
  ['video-studio.html', {
    zh: ['视频工作台', '拆分脚本、编辑分镜、预览画面并导出项目。'],
    en: ['Video Studio', 'Split scripts, edit scenes, preview frames and export projects.'],
    ja: ['動画ワークスペース', '脚本を分割し、シーンを編集し、画面をプレビューして書き出します。'],
    fr: ['Atelier vidéo', 'Découper les scripts, éditer les scènes, prévisualiser et exporter.'],
    es: ['Estudio de video', 'Divide guiones, edita escenas, previsualiza y exporta proyectos.']
  }],
  ['videos.html', {
    zh: ['视频服务', '查看视频相关工具、课程入口和服务状态。'],
    en: ['Video Services', 'Review video tools, course entry points and service status.'],
    ja: ['動画サービス', '動画ツール、コース入口、サービス状態を確認できます。'],
    fr: ['Services vidéo', 'Voir les outils vidéo, les accès aux cours et l’état du service.'],
    es: ['Servicios de video', 'Consulta herramientas de video, accesos a cursos y estado del servicio.']
  }]
];

function esc(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

const home = {
  zh: ['HaoWord Studio 中文首页', '进入应用工作台、视频工作台、模板、课程、定制网站和多平台发布服务。'],
  ja: ['HaoWord Studio 日本語ホーム', 'アプリ、動画、テンプレート、コース、制作、ソーシャル配信サービスの入口です。'],
  fr: ['Accueil français HaoWord Studio', 'Accéder aux applications, vidéos, modèles, cours, sites personnalisés et publication sociale.'],
  es: ['Inicio en español de HaoWord Studio', 'Accede a aplicaciones, video, plantillas, cursos, sitios personalizados y publicación social.']
};

function homeShell(code) {
  const t = ui[code];
  const [title, desc] = home[code];
  const cards = [
    ['pricing.html', t.nav[1]],
    ['templates.html', t.nav[2]],
    ['social-publisher.html', t.nav[3]]
  ].map(([file, label], index) => `<article><b>0${index + 1}</b><h2>${esc(label)}</h2><p>${esc(pages.find(([f]) => f === file)[1][code][1])}</p><a class="button" href="/${code}/${file}">${esc(label)}</a></article>`).join('');
  const langLinks = languages.map(other => `<a${other === code ? ' aria-current="page"' : ''} href="/${other}/" hreflang="${other === 'zh' ? 'zh-CN' : other}">${languageNames[code][other]}</a>`).join('');
  return `<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | HaoWord Studio</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${base}/${code}/">${languages.map(other => `<link rel="alternate" hreflang="${other === 'zh' ? 'zh-CN' : other}" href="${base}/${other}/">`).join('')}<link rel="alternate" hreflang="x-default" href="${base}/en/"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${base}/${code}/"><link rel="stylesheet" href="/assets/studio-design.css?v=seo1"><link rel="stylesheet" href="/assets/tutorials.css?v=3"></head><body><a class="skip" href="#main">${esc(t.actions[0])}</a><header class="site-top"><a class="logo" href="/${code}/"><img src="/assets/hao-logo.svg?v=4" alt="HaoWordStudio" width="236" height="46" style="display:block;width:min(236px,50vw);height:auto;flex-shrink:0"></a><nav aria-label="${esc(t.nav[0])}"><a href="/${code}/" aria-current="page">${esc(t.nav[0])}</a><a href="/${code}/pricing.html">${esc(t.nav[1])}</a><a href="/${code}/templates.html">${esc(t.nav[2])}</a><a href="/${code}/social-publisher.html">${esc(t.nav[3])}</a><a href="/${code}/contact.html">${esc(t.nav[4])}</a></nav></header><main id="main" class="lesson"><section class="page-heading"><div><p class="eyebrow">HAOWORD STUDIO</p><h1>${esc(title)}</h1><p class="muted">${esc(desc)}</p></div></section><section class="tutorial-callout"><p>${esc(t.intro)}</p><nav class="actions" aria-label="${esc(t.label)}">${langLinks}</nav></section><section class="home-section"><div class="how-grid">${cards}</div></section></main><footer class="site-footer"><span>${esc(t.footer)}</span><nav><a href="/${code}/privacy.html">${esc(pages.find(([f]) => f === 'privacy.html')[1][code][0])}</a><a href="/${code}/terms.html">${esc(pages.find(([f]) => f === 'terms.html')[1][code][0])}</a><a href="/${code}/contact.html">${esc(t.nav[4])}</a></nav></footer></body></html>`;
}

function alternateLinks(file) {
  return languages.map(code => `<link rel="alternate" hreflang="${code === 'zh' ? 'zh-CN' : code}" href="${base}/${code}/${file}">`).join('');
}

function shell(code, file, page) {
  const t = ui[code];
  const [title, desc] = page[code];
  const canonical = `${base}/${code}/${file}`;
  const main = `${base}/${file}`;
  const langLinks = languages.map(other => {
    const active = other === code ? ' aria-current="page"' : '';
    return `<a${active} href="/${other}/${file}" hreflang="${other === 'zh' ? 'zh-CN' : other}">${languageNames[code][other]}</a>`;
  }).join('');
  return `<!doctype html><html lang="${t.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | ${suffix[code]} | HaoWord Studio</title><meta name="description" content="${esc(desc)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}">${alternateLinks(file)}<link rel="alternate" hreflang="x-default" href="${main}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | HaoWord Studio"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical}"><link rel="stylesheet" href="/assets/studio-design.css?v=seo1"><link rel="stylesheet" href="/assets/tutorials.css?v=3"></head><body><a class="skip" href="#main">${esc(t.actions[0])}</a><header class="site-top"><a class="logo" href="/${code}/"><img src="/assets/hao-logo.svg?v=4" alt="HaoWordStudio" width="236" height="46" style="display:block;width:min(236px,50vw);height:auto;flex-shrink:0"></a><nav aria-label="${esc(t.nav[0])}"><a href="/${code}/">${esc(t.nav[0])}</a><a href="/${code}/pricing.html">${esc(t.nav[1])}</a><a href="/${code}/templates.html">${esc(t.nav[2])}</a><a href="/${code}/social-publisher.html">${esc(t.nav[3])}</a><a href="/${code}/contact.html">${esc(t.nav[4])}</a></nav></header><main id="main" class="lesson"><section class="page-heading"><div><p class="eyebrow">${esc(t.label)}</p><h1>${esc(title)}</h1><p class="muted">${esc(desc)}</p></div></section><section class="tutorial-callout"><p>${esc(t.intro)}</p><div class="actions"><a class="button primary" href="/${code}/">${esc(t.actions[0])}</a><a class="button" href="/${file}">${esc(t.actions[1])}</a><a class="button" href="/${code}/contact.html">${esc(t.actions[2])}</a></div></section><section class="home-section"><div class="how-grid"><article><b>01</b><h2>${esc(t.sections[0])}</h2><p>${esc(t.notes[0])}</p></article><article><b>02</b><h2>${esc(t.sections[1])}</h2><p>${esc(t.notes[1])}</p></article><article><b>03</b><h2>${esc(t.sections[2])}</h2><p>${esc(t.notes[2])}</p></article></div></section><section class="lesson-download"><h2>${esc(title)}</h2><p>${esc(desc)}</p><nav class="actions" aria-label="${esc(t.label)}">${langLinks}</nav></section></main><footer class="site-footer"><span>${esc(t.footer)}</span><nav><a href="/${code}/privacy.html">${esc(pages.find(([f]) => f === 'privacy.html')[1][code][0])}</a><a href="/${code}/terms.html">${esc(pages.find(([f]) => f === 'terms.html')[1][code][0])}</a><a href="/${code}/contact.html">${esc(t.nav[4])}</a></nav></footer></body></html>`;
}

for (const [file, page] of pages) {
  for (const code of languages) {
    const target = path.join(root, code, file);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, shell(code, file, page));
  }
}

for (const code of ['zh', 'ja', 'fr', 'es']) {
  fs.writeFileSync(path.join(root, code, 'index.html'), homeShell(code));
}

for (const file of fs.readdirSync(path.join(root, 'en')).filter(name => name.endsWith('.html'))) {
  const target = path.join(root, 'en', file);
  let html = fs.readFileSync(target, 'utf8');
  html = html
    .replace(/>中文</g, '>Chinese<')
    .replace(/>日本語</g, '>Japanese<')
    .replace(/>Français</g, '>French<')
    .replace(/>Español</g, '>Spanish<');
  fs.writeFileSync(target, html);
}

const englishLearn = path.join(root, 'en', 'learn');
if (fs.existsSync(englishLearn)) {
  for (const file of fs.readdirSync(englishLearn).filter(name => name.endsWith('.html'))) {
    const target = path.join(englishLearn, file);
    let html = fs.readFileSync(target, 'utf8');
    html = html.replace(/>中文</g, '>Chinese<');
    fs.writeFileSync(target, html);
  }
}

const sitemapPath = path.join(root, 'sitemap.xml');
if (fs.existsSync(sitemapPath)) {
  let sitemap = fs.readFileSync(sitemapPath, 'utf8');
  for (const [file] of pages) {
    for (const code of languages) {
      const loc = `${base}/${code}/${file}`;
      if (!sitemap.includes(`<loc>${loc}</loc>`)) {
        sitemap = sitemap.replace('</urlset>', `  <url><loc>${loc}</loc><lastmod>2026-09-12</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n</urlset>`);
      }
    }
  }
  fs.writeFileSync(sitemapPath, sitemap);
}

console.log(`Generated ${pages.length * languages.length} localized page counterparts.`);
