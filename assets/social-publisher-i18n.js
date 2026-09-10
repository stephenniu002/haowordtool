(() => {
  const languages = ['en', 'zh-CN', 'ja', 'fr', 'es'];
  // Each entry contains English, Simplified Chinese, Japanese, French and Spanish.
  const rows = [
    ['Multi-platform Social Publisher Setup | HaoWord Studio','多平台发布安装配置服务 | HaoWord Studio','マルチプラットフォーム投稿設定 | HaoWord Studio','Configuration de publication multicanal | HaoWord Studio','Configuración de publicación multiplataforma | HaoWord Studio'],
    ['Skip to content','跳到正文','本文へ移動','Aller au contenu','Ir al contenido'],
    ['Main navigation','主导航','メインナビゲーション','Navigation principale','Navegación principal'],
    ['App Studio','应用工作台','アプリスタジオ','Studio d’applications','Estudio de aplicaciones'],
    ['Templates','模板商店','テンプレート','Modèles','Plantillas'],
    ['Social Publisher','多平台发布','マルチ投稿','Publication multicanal','Publicación multiplataforma'],
    ['Plans & services','套餐与服务','プランとサービス','Offres et services','Planes y servicios'],
    ['HAOWORD STUDIO / CREATOR TOOLS','HAOWORD STUDIO / 创作者工具','HAOWORD STUDIO / クリエイターツール','HAOWORD STUDIO / OUTILS DE CRÉATION','HAOWORD STUDIO / HERRAMIENTAS PARA CREADORES'],
    ['Your content.','一份内容。','あなたのコンテンツを。','Votre contenu.','Tu contenido.'],
    ['More channels.','多个平台。','もっと多くの場所へ。','Plus de canaux.','Más canales.'],
    ['Less repeat work.','更少重复操作。','繰り返し作業を減らす。','Moins de tâches répétitives.','Menos trabajo repetitivo.'],
    ['Get a multi-platform publishing workflow configured for your own accounts. Prepare your videos and captions, then reuse them across the channels you choose.','为你的账号配置多平台发布流程。准备好视频和文案，即可在选定的平台重复使用。','ご自身のアカウントに合わせて複数の投稿先を設定します。動画と説明文を準備し、選んだプラットフォームで再利用できます。','Faites configurer un processus de publication pour vos propres comptes. Préparez vos vidéos et légendes, puis réutilisez-les sur les canaux choisis.','Configura un flujo de publicación para tus propias cuentas. Prepara vídeos y textos y reutilízalos en los canales que elijas.'],
    ['Choose a plan ↗','选择套餐 ↗','プランを選ぶ ↗','Choisir une offre ↗','Elegir un plan ↗'],
    ['Compare platform support','查看平台支持情况','対応プラットフォームを比較','Comparer les plateformes','Comparar plataformas'],
    ['US$25 / month or US$299 / year','25 美元/月，或 299 美元/年','月額25米ドル、または年額299米ドル','25 USD / mois ou 299 USD / an','25 USD / mes o 299 USD / año'],
    ['Publishing workflow illustration','发布流程示意图','投稿フローのイメージ','Illustration du processus de publication','Ilustración del flujo de publicación'],
    ['YOUR PUBLISHING WORKFLOW','你的发布流程','投稿の流れ','VOTRE PROCESSUS DE PUBLICATION','TU FLUJO DE PUBLICACIÓN'],
    ['01 / Prepare','01 / 准备素材','01 / 準備','01 / Préparer','01 / Preparar'],
    ['Video + caption + cover','视频 + 文案 + 封面','動画 + 説明文 + カバー','Vidéo + légende + couverture','Vídeo + texto + portada'],
    ['Douyin (China)','Douyin（国内）','Douyin（中国向け）','Douyin (Chine)','Douyin (China)'],
    ['International','国际平台','国際版','International','Internacional'],
    ['Bilibili','Bilibili / B站','Bilibili / ビリビリ','Bilibili','Bilibili'],
    ['Kuaishou','Kuaishou / 快手','Kuaishou / 快手','Kuaishou / 快手','Kuaishou / 快手'],
    ['WeChat Channels','微信视频号','WeChat Channels / 動画チャンネル','Chaînes WeChat','Canales de WeChat'],
    ['02 / Choose accounts','02 / 选择账号','02 / アカウントを選択','02 / Choisir les comptes','02 / Elegir cuentas'],
    ['03 / Publish or schedule where supported','03 / 立即发布或按平台支持定时发布','03 / 投稿、または対応先で予約投稿','03 / Publier ou programmer si disponible','03 / Publicar o programar donde se admita'],
    ['Workflow illustration. This page does not upload content.','流程示意。本页面不执行内容上传。','フローのイメージです。このページから投稿は行いません。','Schéma illustratif. Cette page ne téléverse aucun contenu.','Esquema ilustrativo. Esta página no sube contenido.'],
    ['Repeat less','减少重复操作','繰り返しを減らす','Moins de répétitions','Menos repeticiones'],
    ['Reuse prepared assets across selected accounts instead of rebuilding every upload from scratch.','在选定账号之间复用已准备的素材，减少每次上传时重复准备。','準備した素材を選択したアカウントで再利用し、毎回の作り直しを減らします。','Réutilisez les éléments préparés sur les comptes choisis sans tout recommencer à chaque publication.','Reutiliza los materiales preparados en las cuentas elegidas sin empezar desde cero en cada publicación.'],
    ['Plan your releases','安排发布时间','投稿を計画する','Planifiez vos publications','Planifica tus publicaciones'],
    ['Use scheduled publishing on supported channels, with settings checked for each platform.','在支持的平台使用定时发布，并逐个平台检查设置。','対応プラットフォームで予約投稿を利用し、各投稿先の設定を確認します。','Programmez les publications sur les canaux compatibles, avec des réglages vérifiés pour chacun.','Programa publicaciones en los canales compatibles y verifica los ajustes de cada plataforma.'],
    ['Keep your own accounts','使用自己的账号','自分のアカウントを使う','Gardez vos propres comptes','Usa tus propias cuentas'],
    ['Run the workflow on the agreed computer or server. Complete platform login and verification yourself.','在约定的电脑或服务器运行流程。平台登录和身份验证由你本人完成。','合意したパソコンまたはサーバーで実行します。ログインと本人確認はお客様自身で行います。','Exécutez le processus sur l’ordinateur ou le serveur convenu. Effectuez vous-même la connexion et la vérification.','Ejecuta el flujo en el ordenador o servidor acordado. Inicia sesión y completa la verificación personalmente.'],
    ['CHOOSE YOUR CHANNELS','选择你的平台','投稿先を選ぶ','CHOISISSEZ VOS CANAUX','ELIGE TUS CANALES'],
    ['Match the tool to your content.','按内容选择合适的平台。','コンテンツに合ったツールを。','Un outil adapté à votre contenu.','Una herramienta para tu contenido.'],
    ['Capabilities below are listed by the upstream project as checked on September 10, 2026. Availability on your accounts is assessed before accepting a paid scope; HaoWord Studio has not yet verified end-to-end publishing for this offer.','以下功能依据原项目文档，核对日期为 2026 年 9 月 10 日。接受付费服务前会评估你的账号可用性；HaoWord Studio 尚未针对本服务验证完整的实际发布流程。','以下は2026年9月10日に確認した元プロジェクトの記載です。有料サービスの受注前にアカウントでの利用可否を評価します。本サービスの実投稿フロー全体は、HaoWord Studioではまだ検証していません。','Les fonctions ci-dessous proviennent du projet d’origine, vérifié le 10 septembre 2026. La disponibilité sur vos comptes est évaluée avant tout engagement payant. HaoWord Studio n’a pas encore validé la publication de bout en bout pour cette offre.','Las funciones siguientes proceden del proyecto original, revisado el 10 de septiembre de 2026. Evaluamos su disponibilidad en tus cuentas antes de aceptar el servicio de pago. HaoWord Studio aún no ha validado la publicación completa para esta oferta.'],
    ['Upstream platform capabilities','原项目声明的平台功能','元プロジェクトの対応機能','Fonctions annoncées par le projet d’origine','Funciones indicadas por el proyecto original'],
    ['Platform','平台','プラットフォーム','Plateforme','Plataforma'],
    ['Video','视频','動画','Vidéo','Vídeo'],
    ['Image posts','图文发布','画像投稿','Publications d’images','Publicaciones con imágenes'],
    ['Scheduling','定时发布','予約投稿','Programmation','Programación'],
    ['Yes','支持','対応','Oui','Sí'],['No','不支持','非対応','Non','No'],
    ['Douyin (China) / 国内抖音','国内抖音 / Douyin','Douyin（中国向け）/ 国内抖音','Douyin (Chine) / 国内抖音','Douyin (China) / 国内抖音'],
    ['Xiaohongshu / 小红书','小红书 / Xiaohongshu','Xiaohongshu / 小紅書','Xiaohongshu / 小红书','Xiaohongshu / 小红书'],
    ['WeChat Channels / 视频号','微信视频号 / WeChat Channels','WeChat Channels / 動画チャンネル','Chaînes WeChat / 视频号','Canales de WeChat / 视频号'],
    ['TikTok (International)','TikTok（国际平台）','TikTok（国際版）','TikTok (international)','TikTok (internacional)'],
    ['View the upstream feature table ↗','查看原项目功能表 ↗','元プロジェクトの機能表を見る ↗','Voir les fonctions du projet d’origine ↗','Ver funciones del proyecto original ↗'],
    ['Douyin serves mainland China; TikTok is the separate international platform. Each requires its own account and publishing configuration. Long-form article syndication is not included. Website changes, login expiry and verification prompts can interrupt automation.','国内抖音面向中国大陆，TikTok 是独立的国际平台，两者需要分别登录和配置发布。服务不包含长文章同步。平台页面变动、登录失效或验证提示可能中断自动化流程。','Douyinは中国本土向け、TikTokは別の国際プラットフォームです。それぞれアカウントと投稿設定が必要です。長文記事の配信は対象外です。画面変更、ログイン期限切れ、認証要求により自動処理が止まる場合があります。','Douyin dessert la Chine continentale ; TikTok est une plateforme internationale distincte. Chacune exige son compte et sa configuration. La diffusion d’articles longs n’est pas incluse. Les changements de site, l’expiration des connexions ou les vérifications peuvent interrompre l’automatisation.','Douyin opera en China continental; TikTok es una plataforma internacional independiente. Cada una requiere su cuenta y configuración. No se incluye la distribución de artículos largos. Los cambios de página, las sesiones caducadas o las verificaciones pueden interrumpir la automatización.'],
    ['WHAT YOU CAN BUY','服务内容','サービス内容','NOTRE OFFRE','NUESTRO SERVICIO'],
    ['A configured workflow,','配置发布流程，','設定した投稿フローを、','Un processus configuré,','Un flujo configurado,'],
    ['with a clear handover.','清楚交付使用方法。','分かりやすく引き継ぐ。','avec une remise claire.','con una entrega clara.'],
    ['Monthly','月付套餐','月額プラン','Mensuel','Mensual'],['Yearly','年付套餐','年額プラン','Annuel','Anual'],
    ['/ month','/ 月','/ 月','/ mois','/ mes'],['/ year','/ 年','/ 年','/ an','/ año'],
    ['One month of the agreed service.','约定范围内的一个月服务。','合意した内容の1か月分のサービス。','Un mois du service convenu.','Un mes del servicio acordado.'],
    ['One year, billed as US$299.','一年服务，一次支付 299 美元。','1年分として299米ドルをお支払い。','Un an, facturé 299 USD.','Un año, facturado en un pago de 299 USD.'],
    ['Choose monthly','选择月付','月額を選択','Choisir le mensuel','Elegir mensual'],['Choose yearly','选择年付','年額を選択','Choisir l’annuel','Elegir anual'],
    ['Choose monthly or yearly service. Tell us your operating system, platforms and account count; we confirm the included installation, configuration, service coverage, start date and acceptance checks before payment. Renewal is confirmed manually; this website does not automatically charge you.','选择月付或年付服务，告诉我们操作系统、平台和账号数量。付款前会确认安装配置内容、服务范围、开始日期和验收方式。续费人工确认，网站不会自动扣款。','月額または年額を選び、OS、投稿先、アカウント数をお知らせください。お支払い前に導入・設定内容、サービス範囲、開始日、検収方法を確認します。更新は手動で確認し、サイトからの自動請求はありません。','Choisissez une formule mensuelle ou annuelle et indiquez votre système, vos plateformes et le nombre de comptes. L’installation, la configuration, le périmètre, la date de début et les vérifications sont confirmés avant paiement. Le renouvellement est manuel ; ce site ne débite rien automatiquement.','Elige servicio mensual o anual e indica tu sistema, plataformas y número de cuentas. Confirmamos instalación, configuración, alcance, fecha de inicio y pruebas antes del pago. La renovación es manual; el sitio no realiza cargos automáticos.'],
    ['Request your plan','申请所选套餐','プランを申し込む','Demander votre formule','Solicitar tu plan'],
    ['Proposed setup scope','拟定安装配置范围','予定する導入範囲','Périmètre de configuration proposé','Alcance de configuración propuesto'],
    ['Install the agreed version of social-auto-upload and its required environment.','安装约定版本的 social-auto-upload 及所需运行环境。','合意したバージョンのsocial-auto-uploadと実行環境を導入します。','Installer la version convenue de social-auto-upload et son environnement.','Instalar la versión acordada de social-auto-upload y su entorno.'],
    ['Configure the selected platform workflow and guide you through account login.','配置所选平台的发布流程，并指导你完成账号登录。','選択した投稿先を設定し、ログイン手順をご案内します。','Configurer les plateformes choisies et vous guider pour la connexion.','Configurar las plataformas elegidas y guiarte en el inicio de sesión.'],
    ['Agree on test content and verify the included publishing actions with your permission.','约定测试素材，经你许可后验证服务范围内的发布操作。','テスト素材を決め、お客様の許可を得て対象の投稿操作を検証します。','Convenir d’un contenu de test et vérifier les publications incluses avec votre autorisation.','Acordar contenido de prueba y verificar las publicaciones incluidas con tu permiso.'],
    ['Provide configuration notes, a publishing checklist and troubleshooting guidance.','提供配置说明、发布检查清单和故障排查指引。','設定メモ、投稿チェックリスト、トラブル対応ガイドを提供します。','Fournir les notes de configuration, une liste de contrôle et un guide de dépannage.','Entregar notas de configuración, una lista de comprobación y orientación para resolver problemas.'],
    ['The selected plan covers the service scope agreed before payment. Account limits, support, updates and maintenance coverage are confirmed in that scope. Hosting, paid AI services and content production are not included unless explicitly agreed. AI caption generation is not included by default.','套餐涵盖付款前约定的服务范围，包括账号数量限制、支持、更新和维护内容。除非明确约定，否则不含托管费用、付费 AI 服务及内容制作，默认不含 AI 文案生成。','プランはお支払い前に合意した範囲を対象とします。アカウント上限、サポート、更新、保守の内容も確認します。別途明示した場合を除き、ホスティング、有料AI、素材制作は含まれません。AI説明文生成は標準対象外です。','La formule couvre le périmètre convenu avant paiement : limites de comptes, assistance, mises à jour et maintenance. L’hébergement, les services d’IA payants et la création de contenu sont exclus sauf accord explicite. La génération de légendes par IA n’est pas incluse par défaut.','El plan cubre el alcance acordado antes del pago, incluidos límites de cuentas, soporte, actualizaciones y mantenimiento. Salvo acuerdo expreso, no incluye alojamiento, IA de pago ni creación de contenido. La generación de textos con IA no se incluye por defecto.'],
    ['START WITH YOUR CHANNELS','告诉我们你的发布需求','投稿先をお知らせください','PARLEZ-NOUS DE VOS CANAUX','CUÉNTANOS TUS CANALES'],
    ['Request your publishing plan.','申请多平台发布服务。','投稿サービスを申し込む。','Demandez votre formule de publication.','Solicita tu plan de publicación.'],
    ['Select US$25 per month or US$299 per year. This form prepares an email request; we reply with the agreed scope, service period and payment instructions. It does not collect payment or send anything automatically.','选择每月 25 美元或每年 299 美元。此表单生成邮件请求；我们回复确认服务范围、服务期限和付款方式。表单不会收款，也不会自动发送信息。','月額25米ドルまたは年額299米ドルを選択してください。このフォームでメール文面を作成します。サービス範囲、期間、支払い方法は返信で確認します。自動送信や決済は行いません。','Choisissez 25 USD par mois ou 299 USD par an. Ce formulaire prépare un e-mail ; nous répondons avec le périmètre, la période et les instructions de paiement. Aucun paiement ni envoi automatique.','Elige 25 USD al mes o 299 USD al año. Este formulario prepara un correo; responderemos con el alcance, el periodo y las instrucciones de pago. No cobra ni envía nada automáticamente.'],
    ['Service plan','服务套餐','サービスプラン','Formule','Plan de servicio'],
    ['Monthly — US$25 / month','月付 — 25 美元/月','月額 — 25米ドル/月','Mensuel — 25 USD / mois','Mensual — 25 USD / mes'],
    ['Yearly — US$299 / year','年付 — 299 美元/年','年額 — 299米ドル/年','Annuel — 299 USD / an','Anual — 299 USD / año'],
    ['Your name','你的姓名','お名前','Votre nom','Tu nombre'],['Contact email','联系邮箱','メールアドレス','E-mail de contact','Correo de contacto'],
    ['Computer or server','电脑或服务器系统','パソコンまたはサーバー','Ordinateur ou serveur','Ordenador o servidor'],
    ['Choose your system','选择操作系统','OSを選択','Choisissez votre système','Elige tu sistema'],['Need advice','需要建议','相談したい','Besoin de conseils','Necesito asesoramiento'],
    ['Number of accounts','账号数量','アカウント数','Nombre de comptes','Número de cuentas'],['Platforms and content','平台与发布内容','投稿先とコンテンツ','Plateformes et contenu','Plataformas y contenido'],
    ['Deadline or other requirements','期望日期或其他需求','希望日・その他のご要望','Échéance ou autres besoins','Fecha límite u otros requisitos'],['Optional','选填','任意','Facultatif','Opcional'],
    ['Example: Douyin (China), TikTok (international) and YouTube; product videos three times a week.','例如：国内抖音、TikTok 和 YouTube；每周发布三次产品视频。','例：中国向けDouyin、TikTok、YouTubeで週3回の商品動画を投稿。','Exemple : Douyin (Chine), TikTok et YouTube ; vidéos de produits trois fois par semaine.','Ejemplo: Douyin (China), TikTok y YouTube; vídeos de productos tres veces por semana.'],
    ['Prepare plan request','生成购买请求','申込メールを作成','Préparer la demande','Preparar solicitud'],['Preview request text','预览请求内容','文面をプレビュー','Prévisualiser la demande','Ver texto de la solicitud'],
    ['Copy this brief into your email','将以下内容复制到邮件','この文面をメールにコピー','Copiez ce texte dans votre e-mail','Copia este texto en tu correo'],
    ['Email:','邮箱：','メール：','E-mail :','Correo:'],
    ['. Include your platform names and system; do not send passwords or login cookies.','。请说明平台和操作系统，不要发送密码或登录 Cookie。','。投稿先とOSを記載してください。パスワードやログインCookieは送らないでください。','. Indiquez vos plateformes et votre système ; n’envoyez ni mots de passe ni cookies de connexion.','. Indica las plataformas y el sistema; no envíes contraseñas ni cookies de sesión.'],
    ['Open-source software. Independent setup service.','开源软件，独立安装配置服务。','オープンソースソフトウェアの独立導入サービス。','Logiciel libre. Service de configuration indépendant.','Software de código abierto. Servicio de configuración independiente.'],
    ['This service uses','本服务使用','本サービスは','Ce service utilise','Este servicio utiliza'],
    ['social-auto-upload by dreammis','dreammis 开发的 social-auto-upload','dreammis作のsocial-auto-upload','social-auto-upload de dreammis','social-auto-upload de dreammis'],
    [', available free under the','，软件可根据以下许可免费获取：','を使用します。無料提供のライセンス：',', disponible gratuitement sous la',', disponible gratis bajo la'],
    ['MIT License','MIT 许可证','MITライセンス','licence MIT','licencia MIT'],
    ['. You can download and install the upstream project yourself. Our fee covers the agreed setup and assistance, not exclusive ownership of the software.','。你可以自行下载并安装原项目。我们的费用对应约定的配置和协助服务，不代表软件独占所有权。','。元のプロジェクトをご自身でダウンロード・導入できます。料金は合意した設定と支援に対するもので、ソフトウェアの独占所有権を提供するものではありません。','. Vous pouvez télécharger et installer vous-même le projet d’origine. Les frais couvrent la configuration et l’assistance convenues, sans propriété exclusive du logiciel.','. Puedes descargar e instalar el proyecto original por tu cuenta. El precio cubre la configuración y asistencia acordadas, no la propiedad exclusiva del software.'],
    ['Upstream copyright and license notices remain with any software we distribute. HaoWord Studio is an independent service and is not affiliated with the original developer or the listed social platforms. Only publish content you have permission to use.','分发软件时保留原作者版权和许可声明。HaoWord Studio 为独立服务，与原开发者及所列社交平台无隶属关系。仅发布你有权使用的内容。','配布するソフトウェアには原作者の著作権・ライセンス表示を保持します。HaoWord Studioは独立したサービスであり、元の開発者や掲載プラットフォームとの提携関係はありません。利用権限のある内容のみ投稿してください。','Les avis de droits d’auteur et de licence d’origine accompagnent tout logiciel distribué. HaoWord Studio est indépendant et non affilié au développeur ou aux plateformes citées. Publiez uniquement du contenu que vous êtes autorisé à utiliser.','Todo software distribuido conserva los avisos originales de autoría y licencia. HaoWord Studio es independiente y no está afiliado al desarrollador ni a las plataformas citadas. Publica solo contenido que tengas derecho a usar.'],
    ['Service terms','服务条款','利用規約','Conditions de service','Condiciones del servicio'],['Privacy','隐私政策','プライバシー','Confidentialité','Privacidad'],['Contact','联系我们','お問い合わせ','Contact','Contacto'],
    ['HaoWord Studio — Social Publisher service request','HaoWord Studio — 多平台发布服务申请','HaoWord Studio — 投稿サービス申込','HaoWord Studio — Demande de publication multicanal','HaoWord Studio — Solicitud de publicación multiplataforma'],
    ['Plan','套餐','プラン','Formule','Plan'],['Name','姓名','名前','Nom','Nombre'],['Email','邮箱','メール','E-mail','Correo'],['System','系统','OS','Système','Sistema'],['Account count','账号数量','アカウント数','Nombre de comptes','Número de cuentas'],
    ['Deadline / other requirements','期望日期 / 其他需求','希望日 / その他のご要望','Échéance / autres besoins','Fecha límite / otros requisitos'],['Not specified','未填写','未指定','Non précisé','Sin especificar'],
    ['Scope and service period to be confirmed. Manual renewal; payment not yet submitted.','服务范围和期限待确认。人工续费，尚未付款。','サービス範囲・期間は確認後に確定。手動更新、未払いです。','Périmètre et période à confirmer. Renouvellement manuel ; paiement non effectué.','Alcance y periodo por confirmar. Renovación manual; pago aún no realizado.'],
    ['Request ready. Send it to love6598878593@gmail.com to confirm your selected plan.','请求已生成。请发送至 love6598878593@gmail.com，确认所选套餐。','文面を作成しました。love6598878593@gmail.comへ送り、プランをご確認ください。','Demande prête. Envoyez-la à love6598878593@gmail.com pour confirmer votre formule.','Solicitud lista. Envíala a love6598878593@gmail.com para confirmar el plan.'],
    ['Your email app should open. If it does not, copy the brief below and email it to love6598878593@gmail.com.','即将打开邮件应用。如果没有打开，请复制下方内容，发送至 love6598878593@gmail.com。','メールアプリが開きます。開かない場合は下の文面をコピーし、love6598878593@gmail.comへ送信してください。','Votre application de messagerie devrait s’ouvrir. Sinon, copiez le texte ci-dessous et envoyez-le à love6598878593@gmail.com.','Se debería abrir tu aplicación de correo. Si no ocurre, copia el texto y envíalo a love6598878593@gmail.com.'],
    ['Social Publisher — ','多平台发布 — ','マルチ投稿 — ','Publication multicanal — ','Publicación multiplataforma — '],
    ['Preferred language','首选语言','希望言語','Langue préférée','Idioma preferido'],
    ['Request setup of social-auto-upload for Douyin (China), TikTok (international), Xiaohongshu (小红书), Bilibili, YouTube and more. A scoped installation service with platform checks and a practical handover.','提供国内抖音、TikTok、小红书、B站及 YouTube 等平台的安装配置服务。每月 25 美元或每年 299 美元，先确认服务范围和平台可用性。','Douyin、TikTok、小紅書、Bilibili、YouTubeなどの投稿設定サービス。月額25米ドルまたは年額299米ドル。導入範囲と対応状況を事前確認します。','Configuration pour Douyin, TikTok, Xiaohongshu, Bilibili, YouTube et autres plateformes. 25 USD par mois ou 299 USD par an, avec vérification du périmètre et des plateformes.','Configuración para Douyin, TikTok, Xiaohongshu, Bilibili, YouTube y más. 25 USD al mes o 299 USD al año, con verificación del alcance y las plataformas.'],
    ['Prepare once. Publish across your selected channels. Multi-platform publishing setup and service plans: US$25 monthly or US$299 yearly.','准备一份素材，发布到选定平台。多平台发布安装配置服务：每月 25 美元或每年 299 美元。','一度準備し、選んだ投稿先へ。マルチ投稿の導入・サービスは月額25米ドルまたは年額299米ドル。','Préparez une fois, publiez sur vos canaux. Configuration et service : 25 USD par mois ou 299 USD par an.','Prepara una vez y publica en tus canales. Configuración y servicio: 25 USD al mes o 299 USD al año.']
  ];
  const dictionary = new Map(rows.map(row => [row[0], row]));
  const selector = document.querySelector('#publisher-language');
  if (!selector) return;
  let current = 'en';
  const translate = text => dictionary.get(text)?.[languages.indexOf(current)] ?? text;
  // Keep option values stable even when their visible labels are translated.
  document.querySelectorAll('#publisher-quote option').forEach(option => {
    if (!option.hasAttribute('value')) option.value = option.textContent;
  });
  const nodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style,noscript,#publisher-language-control')) continue;
    const key = node.textContent.trim();
    if (dictionary.has(key)) nodes.push({node, key, prefix: node.textContent.match(/^\s*/)[0], suffix: node.textContent.match(/\s*$/)[0]});
  }
  const attributes = [];
  document.querySelectorAll('[placeholder],[aria-label]').forEach(node => {
    for (const attr of ['placeholder', 'aria-label']) {
      const key = node.getAttribute(attr);
      if (dictionary.has(key)) attributes.push({node, attr, key});
    }
  });
  document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(node => {
    attributes.push({node, attr: 'content', key: node.content});
  });
  const title = document.title;
  function apply(language, save = false) {
    current = languages.includes(language) ? language : 'en';
    selector.value = current;
    document.documentElement.lang = current;
    document.title = translate(title);
    nodes.forEach(({node,key,prefix,suffix}) => { node.textContent = prefix + translate(key) + suffix; });
    attributes.forEach(({node,attr,key}) => node.setAttribute(attr, translate(key)));
    document.querySelector('#publisher-preview').hidden = true;
    document.querySelector('#publisher-status').textContent = '';
    if (save) {
      try { localStorage.setItem('haoword-publisher-language', current); } catch {}
      const url = new URL(location.href);
      url.searchParams.set('lang', current);
      try { history.replaceState(null, '', url); } catch {}
    }
  }
  window.publisherI18n = { t: translate, get language() { return current; } };
  let saved;
  try { saved = localStorage.getItem('haoword-publisher-language'); } catch {}
  const requested = new URL(location.href).searchParams.get('lang');
  const preferred = navigator.language.startsWith('zh') ? 'zh-CN' : navigator.language.split('-')[0];
  apply(languages.includes(requested) ? requested : languages.includes(saved) ? saved : languages.includes(preferred) ? preferred : 'en');
  selector.addEventListener('change', () => apply(selector.value, true));
})();
