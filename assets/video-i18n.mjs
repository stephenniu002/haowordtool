import {menuCopy} from './video-menu-copy.mjs?v=seo1';
export const LANGUAGES = Object.freeze({'zh-CN':'中文',en:'English',ja:'日本語',fr:'Français',es:'Español'});
const columns={en:0,ja:1,fr:2,es:3};
let language='en';
try{
  const saved=localStorage.getItem('haoword-studio-language');
  if(saved in LANGUAGES)language=saved;
  else if(typeof navigator!=='undefined'){
    const locale=(navigator.languages?.[0]||navigator.language||'en').toLowerCase();
    language=locale.startsWith('zh')?'zh-CN':locale.startsWith('ja')?'ja':locale.startsWith('fr')?'fr':locale.startsWith('es')?'es':'en';
  }
}catch{}
if(typeof location!=='undefined'){const route=location.pathname.match(/^\/video-studio\/(en|ja|fr|es)(?:\/|$)/);if(route)language=route[1];if(/^\/en(?:\/|$)/.test(location.pathname))language='en';}
export const getLanguage=()=>language;
export const messages={
  '应用工作台':['App Studio','アプリスタジオ','Studio d’apps','Estudio de apps'],
  'AI 伴侣':['AI Companion','AIコンパニオン','Compagnon IA','Compañero de IA'],
  '实操教程':['Tutorials','実践ガイド','Tutoriels','Tutoriales'],
  '订阅与服务':['Plans & services','プランとサービス','Offres et services','Planes y servicios'],
  '为对话，写一个开始。':['Every conversation starts somewhere.','会話の始まりを、ここから。','Chaque conversation commence quelque part.','Toda conversación empieza en algún lugar.'],
  '选择虚拟伙伴，定制性格与故事，创建属于你的角色卡。':['Choose a fictional companion, shape their personality and story, and create your own character card.','架空のパートナーを選び、性格や物語を設定して、自分だけのキャラクターカードを作成できます。','Choisissez un compagnon fictif, façonnez sa personnalité et son histoire, puis créez votre propre fiche de personnage.','Elige un compañero ficticio, define su personalidad y su historia, y crea tu propia ficha de personaje.'],
  '角色体验预览':['Character preview','キャラクタープレビュー','Aperçu du personnage','Vista previa del personaje'],
  '主导航':['Main navigation','メインナビゲーション','Navigation principale','Navegación principal'],
  '选择角色':['Choose a character','キャラクターを選択','Choisir un personnage','Elegir un personaje'],
  '定制角色设定':['Customize character','キャラクターを設定','Personnaliser le personnage','Personalizar el personaje'],
  '角色名称':['Character name','キャラクター名','Nom du personnage','Nombre del personaje'],
  '性格与兴趣':['Personality & interests','性格と興味','Personnalité et centres d’intérêt','Personalidad e intereses'],
  '故事设定':['Scenario','シナリオ','Scénario','Escenario'],
  '应用角色设定':['Apply character','設定を適用','Appliquer le personnage','Aplicar personaje'],
  '导出角色卡':['Export character card','キャラクターカードを書き出す','Exporter la fiche du personnage','Exportar ficha del personaje'],
  '角色设定可导出为 JSON；不保存聊天记录。':['Export settings as JSON. Conversations are not stored.','設定はJSONで書き出せます。会話履歴は保存されません。','Exportez les réglages en JSON. Les conversations ne sont pas enregistrées.','Exporta los ajustes en JSON. Las conversaciones no se guardan.'],
  '虚构成年角色':['Fictional adult character','架空の成人キャラクター','Personnage adulte fictif','Personaje adulto ficticio'],
  '清空对话':['Clear conversation','会話を消去','Effacer la conversation','Borrar conversación'],
  '当前为固定示例对话，尚未连接 AI。你输入的内容只在本页使用，刷新后清除。':['This preview uses fixed sample replies. AI is not connected. Messages stay on this page and clear on reload.','このプレビューは固定のサンプル返信を使用しています。AIには未接続です。入力内容はこのページ内だけで使用され、再読み込みすると消去されます。','Cet aperçu utilise des réponses d’exemple fixes. L’IA n’est pas connectée. Les messages restent sur cette page et sont effacés au rechargement.','Esta vista previa usa respuestas de ejemplo fijas. La IA no está conectada. Los mensajes permanecen en esta página y se borran al recargar.'],
  '写下你想说的话…':['Write a message…','メッセージを入力…','Écrivez un message…','Escribe un mensaje…'],
  '聊天消息':['Chat message','チャットメッセージ','Message de discussion','Mensaje de chat'],
  '发送':['Send','送信','Envoyer','Enviar'],
  '让每一项服务都清楚透明':['Know exactly what is available','利用できる機能を明確に','Sachez exactement ce qui est disponible','Conoce exactamente qué está disponible'],
  '角色定制和导出免费。实时 AI 聊天及 100 USDT／月订阅尚未开放。':['Character customization and export are free. Live AI chat and the 100 USDT/month plan are not available yet.','キャラクター設定と書き出しは無料です。リアルタイムAIチャットと月額100 USDTプランはまだ利用できません。','La personnalisation et l’exportation sont gratuits. Le chat IA en direct et l’offre à 100 USDT par mois ne sont pas encore disponibles.','La personalización y la exportación son gratuitas. El chat de IA en directo y el plan de 100 USDT al mes aún no están disponibles.'],
  '查看服务状态':['View service status','サービス状況を見る','Voir l’état du service','Ver estado del servicio'],
  '单词工具':['Word tools','単語ツール','Outils de mots','Herramientas de palabras'],
  '学习指南':['Learning guides','学習ガイド','Guides pratiques','Guías de aprendizaje'],
  '隐私':['Privacy','プライバシー','Confidentialité','Privacidad'],
  '条款':['Terms','利用規約','Conditions','Condiciones'],
  '月见':['Tsukimi','月見','Tsukimi','Tsukimi'],
  '林川':['Lin','林川','Lin','Lin'],
  '新朋友':['New friend','新しい友達','Nouvel ami','Nuevo amigo'],
  '温柔、好奇，喜欢电影与周末散步。':['Warm and curious. Loves films and weekend walks.','穏やかで好奇心旺盛。映画と週末の散歩が好きです。','Douce et curieuse. Aime les films et les promenades du week-end.','Amable y curiosa. Le gustan las películas y los paseos de fin de semana.'],
  '在咖啡馆分享今天的小事。':['Sharing little moments from the day in a café.','カフェで今日の小さな出来事を語り合う。','Partager les petits moments de la journée dans un café.','Compartir los pequeños momentos del día en una cafetería.'],
  '开朗、耐心，喜欢旅行、做饭与摄影。':['Patient and cheerful. Enjoys travel, cooking and photography.','明るくて辛抱強く、旅行、料理、写真が好きです。','Patient et enjoué. Aime voyager, cuisiner et photographier.','Paciente y alegre. Le gustan los viajes, la cocina y la fotografía.'],
  '一起计划下一次周末旅行。':['Planning a weekend trip together.','次の週末旅行を一緒に計画する。','Planifier ensemble une escapade de week-end.','Planear juntos un viaje de fin de semana.'],
  '写下你想要的性格与兴趣。':['Describe their personality and interests.','希望する性格や興味を入力してください。','Décrivez sa personnalité et ses centres d’intérêt.','Describe su personalidad y sus intereses.'],
  '从一句问候开始。':['Start with a simple greeting.','簡単なあいさつから始めましょう。','Commencez par une simple salutation.','Empieza con un saludo sencillo.'],
  '温柔与好奇':['Gentle & curious','穏やかで好奇心旺盛','Doux et curieux','Amable y curioso'],
  '开朗与耐心':['Cheerful & patient','明るくて辛抱強い','Enjoué et patient','Alegre y paciente'],
  '自由定制':['Make it your own','自由にカスタマイズ','À personnaliser','Personalización libre'],
  '你':['You','あなた','Vous','Tú'],
  '示例回复':['Sample reply','サンプル返信','Réponse d’exemple','Respuesta de ejemplo'],
  '欢迎来到角色体验。你想从今天的一件小事聊起吗？':['Welcome to the character preview. What would you like to talk about?','キャラクタープレビューへようこそ。今日はどんなことを話したいですか？','Bienvenue dans l’aperçu du personnage. De quoi souhaitez-vous parler ?','Te damos la bienvenida a la vista previa. ¿De qué te gustaría hablar?'],
  '角色设定已应用到当前预览。':['Character settings applied to this preview.','キャラクター設定をこのプレビューに適用しました。','Les réglages du personnage ont été appliqués à cet aperçu.','Los ajustes del personaje se aplicaron a esta vista previa.'],
  '这是一条固定示例回复，不是 AI 生成的回答。你可以先定制角色、导出角色卡，实时聊天将在服务接通后开放。':['This is a fixed sample reply, not an AI response. You can customize the character and export a card while live chat is being prepared.','これは固定のサンプル返信で、AIの回答ではありません。ライブチャットの準備中も、キャラクターを設定してカードを書き出せます。','Il s’agit d’une réponse d’exemple fixe, et non d’une réponse générée par l’IA. Vous pouvez personnaliser le personnage et exporter sa fiche pendant la préparation du chat en direct.','Esta es una respuesta de ejemplo fija, no una respuesta de IA. Puedes personalizar el personaje y exportar su ficha mientras se prepara el chat en directo.'],
  '我的AI 女友&男友':['My AI Girlfriend & Boyfriend','AI彼女・彼氏','Ma copine et mon copain IA','Mi novia y novio IA'],
  '语言':['Language','言語','Langue','Idioma'],
  '跳到工作台':['Skip to studio','スタジオへ移動','Aller au studio','Ir al estudio'],
  '视频工作台':['Video studio','動画スタジオ','Studio vidéo','Estudio de vídeo'],
  '媒体下载':['Media download','メディア保存','Télécharger un média','Descargar medios'],
  '订阅':['Subscription','サブスクリプション','Abonnement','Suscripción'],
  '下载 App':['Get the app','アプリを入手','Télécharger l’app','Descargar la app'],
  '登录 / 注册':['Sign in / Register','ログイン / 登録','Connexion / Inscription','Entrar / Registrarse'],
  '从一个想法，到一条视频':['From one idea to your next video','ひとつのアイデアを、一本の動画に','D’une idée à votre prochaine vidéo','De una idea a tu próximo vídeo'],
  '创作者工作台':['Creator workspace','クリエイター向け','Espace de création','Espacio de creación'],
  '正在连接制作服务…':['Connecting to the production service…','制作サービスに接続中…','Connexion au service de production…','Conectando con el servicio de producción…'],
  '脚本与分镜':['Script & storyboard','台本と絵コンテ','Script et storyboard','Guion y storyboard'],
  '载入示例 ↗':['Load example ↗','サンプルを開く ↗','Charger un exemple ↗','Cargar ejemplo ↗'],
  '视频标题':['Video title','動画タイトル','Titre de la vidéo','Título del vídeo'],
  '给你的下一条视频起个名字':['Name your next video','次の動画に名前を付けましょう','Nommez votre prochaine vidéo','Ponle nombre a tu próximo vídeo'],
  '创作内容':['Your content','制作する内容','Votre contenu','Tu contenido'],
  '粘贴完整口播稿，拆成分镜；或写一个主题，让 AI 帮你起稿。':['Paste a script to split it into scenes, or describe a topic for an AI draft.','台本を貼り付けてシーンに分割するか、テーマを入力してAIで下書きを作成します。','Collez un script pour créer des scènes, ou décrivez un sujet pour un brouillon IA.','Pega un guion para dividirlo en escenas o describe un tema para un borrador con IA.'],
  '中文 / English':['AI output follows your selected language','AIの出力は選択した言語に従います','L’IA utilise la langue sélectionnée','La IA usa el idioma seleccionado'],
  '画面比例':['Aspect ratio','画面比率','Format de l’image','Relación de aspecto'],
  '9:16 · 竖屏短视频':['9:16 · Vertical','9:16 · 縦型','9:16 · Vertical','9:16 · Vertical'],
  '16:9 · 横屏视频':['16:9 · Landscape','16:9 · 横型','16:9 · Horizontal','16:9 · Horizontal'],
  '1:1 · 正方形':['1:1 · Square','1:1 · 正方形','1:1 · Carré','1:1 · Cuadrado'],
  '制作引擎':['Render engine','レンダリング','Moteur de rendu','Motor de renderizado'],
  '同步字幕 · 随配音自动对齐':['Synced captions · aligned to narration','同期字幕 · ナレーションに自動で合わせる','Sous-titres synchronisés avec la narration','Subtítulos sincronizados con la narración'],
  '拆成分镜':['Split into scenes','シーンに分割','Créer les scènes','Dividir en escenas'],
  'AI 写脚本 ✦':['Draft with AI ✦','AIで台本を作成 ✦','Écrire avec l’IA ✦','Escribir con IA ✦'],
  '脚本拆分免费；AI 起稿、配音和成片制作需要订阅及已开通的制作服务。':['Splitting scripts is free. AI drafts, voiceovers and rendering require a subscription and an active production service.','台本の分割は無料です。AI台本、音声、動画制作には契約と制作サービスの有効化が必要です。','La découpe est gratuite. Les scripts IA, la voix et le rendu nécessitent un abonnement et un service actif.','Dividir guiones es gratis. Los borradores con IA, la voz y el renderizado requieren suscripción y un servicio activo.'],
  '分镜列表':['Scenes','シーン一覧','Scènes','Escenas'],
  '等待脚本':['Waiting for a script','台本を待っています','En attente d’un script','Esperando un guion'],
  '写下内容，第一帧从这里开始。':['Write your story. Your first frame starts here.','内容を書いて、最初の一コマを作りましょう。','Écrivez votre histoire. Tout commence ici.','Escribe tu historia. El primer fotograma empieza aquí.'],
  '画面预览':['Frame preview','画面プレビュー','Aperçu des scènes','Vista previa'],
  '分镜预览 · 无声':['Storyboard · silent preview','絵コンテ · 無音プレビュー','Storyboard · sans audio','Storyboard · sin audio'],
  '让你的想法':['Let your ideas','あなたのアイデアを','Donnez vie','Dale vida'],
  '开始播放。':['start playing.','動き出させよう。','à vos idées.','a tus ideas.'],
  '从左侧开始写脚本。':['Start with your script on the left.','左側で台本を書き始めましょう。','Commencez par le script à gauche.','Empieza con el guion de la izquierda.'],
  '你的下一条视频，正在路上。':['Your next video is on its way.','次の動画がここから始まります。','Votre prochaine vidéo prend forme.','Tu próximo vídeo está en camino.'],
  '播放分镜预览':['Play storyboard preview','絵コンテを再生','Lire l’aperçu','Reproducir vista previa'],
  '暂停预览':['Pause preview','プレビューを一時停止','Mettre en pause','Pausar vista previa'],
  '制作与导出':['Produce & export','制作と書き出し','Produire et exporter','Producir y exportar'],
  '分镜':['Scenes','シーン','Scènes','Escenas'],
  '配音':['Voiceover','ナレーション','Voix','Voz'],
  '字幕':['Captions','字幕','Sous-titres','Subtítulos'],
  '成片':['Video','動画','Vidéo','Vídeo'],
  '开始制作视频':['Create video','動画を制作','Créer la vidéo','Crear vídeo'],
  '下载分镜 JSON ↓':['Storyboard JSON ↓','絵コンテ JSON ↓','Storyboard JSON ↓','Storyboard JSON ↓'],
  '下载 HyperFrames 工程 ↓':['HyperFrames project ↓','HyperFrames プロジェクト ↓','Projet HyperFrames ↓','Proyecto HyperFrames ↓'],
  '成片时长会随真实配音调整。分镜工程不含配音，成片和同步字幕制作完成后可在下方下载。':['Final duration follows the voiceover. Storyboard exports have no audio. Download the finished video and synced captions below.','完成動画の長さは音声に合わせて調整されます。絵コンテには音声は含まれません。完成後、動画と同期字幕を下から保存できます。','La durée finale suit la voix. Les storyboards exportés sont sans audio. Téléchargez la vidéo et les sous-titres terminés ci-dessous.','La duración final se ajusta a la voz. El storyboard exportado no incluye audio. Descarga el vídeo y los subtítulos terminados abajo.'],
  '我的制作任务':['My productions','制作タスク','Mes productions','Mis producciones'],
  '刷新 ↻':['Refresh ↻','更新 ↻','Actualiser ↻','Actualizar ↻'],
  '登录后查看进度，下载 MP4 和 SRT 字幕。':['Sign in to track progress and download MP4 videos and SRT captions.','ログインして進捗を確認し、MP4動画とSRT字幕を保存できます。','Connectez-vous pour suivre le rendu et télécharger les fichiers MP4 et SRT.','Inicia sesión para seguir el progreso y descargar archivos MP4 y SRT.'],
  '一个订阅，':['One subscription.','ひとつの契約で、','Un abonnement.','Una suscripción.'],
  '串起整个创作流程。':['Your whole creative workflow.','制作のすべてを。','Tout votre processus créatif.','Todo tu proceso creativo.'],
  '每次支付开通 30 天，到期手动续费。':['Each payment unlocks 30 days. Renew manually when it expires.','お支払いごとに30日間利用できます。期限後は手動で更新します。','Chaque paiement donne accès à 30 jours. Renouvellement manuel à l’échéance.','Cada pago activa 30 días. Renueva manualmente al vencer.'],
  '提前续费可顺延有效期，不会自动扣款。':['Early renewal extends your current term. No automatic charges.','早期更新は現在の期限に追加されます。自動課金はありません。','Un renouvellement anticipé prolonge la durée. Aucun débit automatique.','Renovar antes amplía el plazo actual. No hay cobros automáticos.'],
  '尚未登录':['Not signed in','未ログイン','Non connecté','Sin iniciar sesión'],
  '月度订阅':['Monthly subscription','月額プラン','Abonnement mensuel','Suscripción mensual'],
  'USDT / 30 天':['USDT / 30 days','USDT / 30日','USDT / 30 jours','USDT / 30 días'],
  '支付宝 / 微信人民币价格待开通时公示':['Alipay / WeChat CNY pricing will appear when enabled','Alipay / WeChatの人民元価格は開始時に表示します','Le prix en CNY sera affiché à l’activation d’Alipay / WeChat','El precio en CNY aparecerá al activar Alipay / WeChat'],
  'AI 脚本与可编辑分镜':['AI scripts and editable storyboards','AI台本と編集可能な絵コンテ','Scripts IA et storyboards modifiables','Guiones con IA y storyboards editables'],
  'ElevenLabs 配音与同步字幕':['ElevenLabs voiceovers and synced captions','ElevenLabs音声と同期字幕','Voix ElevenLabs et sous-titres synchronisés','Voces de ElevenLabs y subtítulos sincronizados'],
  'HyperFrames / Remotion 成片制作':['HyperFrames / Remotion rendering','HyperFrames / Remotion動画制作','Rendu HyperFrames / Remotion','Renderizado con HyperFrames / Remotion'],
  'MP4 视频与 SRT 字幕下载':['MP4 videos and SRT caption downloads','MP4動画とSRT字幕の保存','Téléchargement des vidéos MP4 et sous-titres SRT','Descarga de vídeos MP4 y subtítulos SRT'],
  '支付宝':['Alipay','Alipay','Alipay','Alipay'],
  '微信支付':['WeChat Pay','WeChat Pay','WeChat Pay','WeChat Pay'],
  '微信':['WeChat','WeChat','WeChat','WeChat'],
  '已开通的渠道会显示为可用。USDT 需人工核实到账；支付宝 / 微信通过商户查账开通。':['Only enabled payment methods are available. USDT is verified manually; Alipay / WeChat use merchant payment checks.','有効な決済方法のみ利用できます。USDTは手動確認、Alipay / WeChatは加盟店取引照会で有効化します。','Seuls les moyens activés sont disponibles. USDT est vérifié manuellement ; Alipay / WeChat par contrôle marchand.','Solo están disponibles los métodos activados. USDT se verifica manualmente; Alipay / WeChat mediante consulta al comercio.'],
  '订阅订单':['Subscription orders','購入履歴','Commandes d’abonnement','Pedidos de suscripción'],
  '登录后可查看付款与审核状态。':['Sign in to see payments and review status.','ログインして支払いと確認状況を表示します。','Connectez-vous pour voir les paiements et leur validation.','Inicia sesión para ver pagos y verificaciones.'],
  '把工作台放进口袋。':['Take your studio with you.','スタジオをポケットに。','Emportez votre studio.','Lleva tu estudio contigo.'],
  '浏览器直接使用，也为 Android 和 iPhone 预留正式下载入口。':['Use it in your browser. Official Android and iPhone links appear here when released.','ブラウザですぐに利用可能。AndroidとiPhoneの正式版は公開後にここに表示されます。','Utilisez votre navigateur. Les liens Android et iPhone apparaîtront après publication.','Úsalo en el navegador. Los enlaces oficiales de Android y iPhone aparecerán al publicarse.'],
  '安装包尚未发布':['App package not released yet','インストーラーは未公開','Application pas encore publiée','Paquete aún no publicado'],
  'App Store / TestFlight 待发布':['App Store / TestFlight coming after release','App Store / TestFlightは公開待ち','App Store / TestFlight en attente de publication','App Store / TestFlight pendiente de publicación'],
  '数据与服务说明':['Data & service information','データとサービスについて','Données et services','Datos y servicios'],
  '脚本拆分和预览在当前设备完成，刷新页面会清除未导出的草稿。使用 AI 起稿时主题发送至 xAI；制作时脚本发送至 ElevenLabs。账号、订单、视频和字幕保存到本站制作服务。付款由支付渠道处理，本站不保存银行卡信息。请只使用你有权使用的声音和内容。Captions / Mirage 第三方 API 尚待开通，当前同步字幕来自配音时间轴。需要删除账号或作品请联系站点支持。':['Script splitting and previews run on your device; refreshing clears unsaved drafts. AI briefs go to xAI and narration scripts to ElevenLabs. Accounts, orders, videos and captions are stored by our production service. Payment providers process payments; we do not store bank card details. Use only content and voices you have rights to use. Captions / Mirage API access is pending; current captions use voiceover timestamps. Contact support to delete your account or work.','台本分割とプレビューは端末内で実行され、更新すると未保存の下書きは消えます。AI生成時はテーマをxAIへ、音声制作時は台本をElevenLabsへ送信します。アカウント、注文、動画、字幕は制作サーバーに保存されます。支払いは決済業者が処理し、カード情報は保存しません。使用権のある音声と内容のみ使用してください。Captions / Mirage APIは未開通で、現在の字幕は音声のタイムスタンプを使用します。アカウントや作品の削除はサポートにご連絡ください。','La découpe et l’aperçu sont locaux ; actualiser efface les brouillons non sauvegardés. Les demandes IA sont envoyées à xAI et les scripts vocaux à ElevenLabs. Comptes, commandes, vidéos et sous-titres sont stockés par notre service. Les prestataires traitent les paiements ; nous ne conservons pas les données de carte. Utilisez uniquement des contenus et voix autorisés. L’API Captions / Mirage est en attente ; les sous-titres actuels utilisent les horodatages audio. Contactez l’assistance pour supprimer votre compte ou vos créations.','La división y la vista previa se ejecutan en tu dispositivo; actualizar borra los borradores no guardados. Las solicitudes de IA se envían a xAI y los guiones de voz a ElevenLabs. El servicio guarda cuentas, pedidos, vídeos y subtítulos. Los proveedores procesan los pagos; no guardamos datos de tarjetas. Usa solo voces y contenido autorizados. El acceso a Captions / Mirage está pendiente; los subtítulos actuales usan marcas de tiempo de la voz. Contacta con soporte para borrar tu cuenta o tus obras.'],
  '联系支持':['Contact support','サポート','Contacter l’assistance','Contactar con soporte'],
  '隐私':['Privacy','プライバシー','Confidentialité','Privacidad'],
  '条款':['Terms','利用規約','Conditions','Condiciones'],
  '欢迎来到工作台':['Welcome to the studio','スタジオへようこそ','Bienvenue au studio','Bienvenido al estudio'],
  '关闭登录':['Close sign-in','ログインを閉じる','Fermer la connexion','Cerrar inicio de sesión'],
  '登录后制作视频，管理订阅和下载记录。':['Sign in to create videos and manage subscriptions and downloads.','ログインして動画制作、契約、ダウンロードを管理します。','Connectez-vous pour créer des vidéos et gérer abonnements et téléchargements.','Inicia sesión para crear vídeos y gestionar suscripciones y descargas.'],
  '邮箱':['Email','メールアドレス','E-mail','Correo electrónico'],
  '密码':['Password','パスワード','Mot de passe','Contraseña'],
  '密码至少 12 位。请妥善保存，当前版本无自助找回。':['Use at least 12 characters. Keep your password safe; self-service recovery is not available yet.','12文字以上を使用してください。現在は自動再設定がないため、大切に保管してください。','Au moins 12 caractères. Conservez votre mot de passe ; la récupération autonome n’est pas encore disponible.','Usa al menos 12 caracteres. Guarda tu contraseña; la recuperación automática aún no está disponible.'],
  '登录':['Sign in','ログイン','Se connecter','Iniciar sesión'],
  '注册账号':['Create account','アカウント登録','Créer un compte','Crear cuenta'],
  '开通 30 天订阅':['Activate 30 days','30日間の利用を開始','Activer 30 jours','Activar 30 días'],
  '关闭付款':['Close payment','支払いを閉じる','Fermer le paiement','Cerrar pago'],
  '请启用 JavaScript 使用视频工作台。':['Enable JavaScript to use the studio.','スタジオの利用にはJavaScriptを有効にしてください。','Activez JavaScript pour utiliser le studio.','Activa JavaScript para usar el estudio.'],
  '画面标题':['Scene heading','シーンタイトル','Titre de la scène','Título de la escena'],
  '旁白':['Narration','ナレーション','Narration','Narración'],
  '计划时长（秒）':['Planned duration (seconds)','予定時間（秒）','Durée prévue (secondes)','Duración prevista (segundos)'],
  '开场':['Opening','導入','Ouverture','Inicio'],
  '收尾':['Closing','締め','Conclusion','Cierre'],
  '展开':['Story','本編','Développement','Desarrollo'],
  '等待制作':['Queued','待機中','En attente','En cola'],
  '制作中':['Rendering','制作中','Rendu en cours','Renderizando'],
  '已完成':['Completed','完了','Terminé','Completado'],
  '未完成':['Failed','失敗','Échec','Fallido'],
  '创建中':['Creating','作成中','Création','Creando'],
  '待付款':['Awaiting payment','支払い待ち','Paiement en attente','Pendiente de pago'],
  '待审核':['Under review','確認待ち','En vérification','En revisión'],
  '已开通':['Active','有効','Activé','Activo'],
  '尚未开通 / 订阅已到期':['Not subscribed / Subscription expired','未契約 / 期限切れ','Sans abonnement / Abonnement expiré','Sin suscripción / Suscripción vencida'],
  '请先登录账号':['Please sign in first','先にログインしてください','Connectez-vous d’abord','Inicia sesión primero'],
  '请先登录':['Please sign in first','先にログインしてください','Connectez-vous d’abord','Inicia sesión primero'],
  '请先开通月度订阅':['Activate a monthly subscription first','先に月額プランを有効にしてください','Activez d’abord un abonnement mensuel','Activa primero una suscripción mensual'],
  '请先生成分镜':['Create a storyboard first','先に絵コンテを作成してください','Créez d’abord un storyboard','Crea primero un storyboard'],
  '分镜已拆分，可逐个修改标题、旁白和时长。':['Scenes are ready. Edit each heading, narration and duration.','分割しました。各シーンのタイトル、ナレーション、時間を編集できます。','Scènes prêtes. Modifiez titres, narrations et durées.','Escenas listas. Edita títulos, narraciones y duraciones.'],
  'AI 分镜已生成，请核对内容后制作。':['AI storyboard ready. Review the content before rendering.','AI絵コンテを作成しました。内容を確認してから制作してください。','Storyboard IA prêt. Vérifiez le contenu avant le rendu.','Storyboard con IA listo. Revisa el contenido antes de renderizar.'],
  '已导出无声 HTML 分镜工程，可用 HyperFrames CLI 继续制作。':['Silent HTML storyboard exported. Continue with the HyperFrames CLI.','無音HTML絵コンテを書き出しました。HyperFrames CLIで制作を続けられます。','Storyboard HTML sans audio exporté. Continuez avec le CLI HyperFrames.','Storyboard HTML sin audio exportado. Continúa con el CLI de HyperFrames.'],
  '已加入制作队列，成片完成后可下载。':['Added to the queue. Download when the video is ready.','キューに追加しました。完成後にダウンロードできます。','Ajouté à la file. Téléchargez la vidéo une fois terminée.','Añadido a la cola. Descarga el vídeo cuando esté listo.'],
  '还没有制作任务。完成分镜后，点击“开始制作视频”。':['No productions yet. Finish your storyboard, then select Create video.','タスクはまだありません。絵コンテを完成させて「動画を制作」を選んでください。','Aucune production. Terminez le storyboard puis cliquez sur Créer la vidéo.','Aún no hay producciones. Completa el storyboard y selecciona Crear vídeo.'],
  '暂无订单。选择已开通的支付渠道购买 30 天订阅。':['No orders yet. Choose an available payment method for 30 days of access.','注文はありません。有効な決済方法で30日間の利用を購入できます。','Aucune commande. Choisissez un moyen de paiement disponible pour 30 jours.','Aún no hay pedidos. Elige un método disponible para activar 30 días.'],
  '订阅已开通。返回工作台开始制作。':['Subscription active. Return to the studio to create.','契約が有効になりました。スタジオで制作を開始できます。','Abonnement activé. Retournez au studio pour créer.','Suscripción activa. Vuelve al estudio para crear.'],
  '只使用上方网络。付款后提交哈希，人工核实金额、地址和确认数后开通；提交哈希本身不会开通订阅。':['Use only the network above. Submit the transaction hash after payment. Access starts after manual verification of amount, address and confirmations, not merely on submission.','上記のネットワークのみ使用してください。支払い後にハッシュを提出し、金額・アドレス・承認数の手動確認後に利用開始となります。提出だけでは有効になりません。','Utilisez uniquement le réseau indiqué. Soumettez le hash après paiement. L’accès est activé après vérification manuelle du montant, de l’adresse et des confirmations.','Usa solo la red indicada. Envía el hash tras pagar. El acceso se activa después de verificar manualmente el importe, la dirección y las confirmaciones.'],
  '交易哈希':['Transaction hash','取引ハッシュ','Hash de transaction','Hash de transacción'],
  '提交到账审核':['Submit for verification','入金確認を依頼','Soumettre à vérification','Enviar para verificar'],
  '刷新并核实订单':['Refresh and verify payment','更新して入金を確認','Actualiser et vérifier','Actualizar y verificar'],
  '该订单未生成付款码，请新建订单。':['No payment code was generated. Create a new order.','支払いコードがありません。新しい注文を作成してください。','Aucun code de paiement. Créez une nouvelle commande.','No se generó código de pago. Crea un pedido nuevo.'],
  '订单付款二维码':['Payment QR code','支払いQRコード','Code QR de paiement','Código QR de pago'],
  '下载正式 APK ↗':['Download release APK ↗','正式APKを保存 ↗','Télécharger l’APK officiel ↗','Descargar APK oficial ↗'],
  '前往苹果下载页 ↗':['Open Apple download page ↗','Appleのダウンロードページへ ↗','Ouvrir la page Apple ↗','Abrir página de Apple ↗'],
  '制作服务已连接 · 完成分镜后可提交配音和渲染':['Production service connected · Finish your storyboard to submit narration and rendering','制作サービス接続済み · 絵コンテ完成後に音声と動画制作を開始できます','Service connecté · Terminez le storyboard pour lancer la voix et le rendu','Servicio conectado · Completa el storyboard para generar voz y vídeo'],
  '编辑模式 · 配音 / 渲染服务尚未开通，可免费拆分脚本、编辑和下载分镜工程':['Editor mode · Voiceover and rendering are not enabled. Split, edit and export storyboards for free.','編集モード · 音声と動画制作は未開通です。絵コンテの分割・編集・保存は無料です。','Mode édition · Voix et rendu non activés. Découpez, modifiez et exportez gratuitement.','Modo edición · Voz y renderizado sin activar. Divide, edita y exporta storyboards gratis.'],
  '免费分镜工具可用 · 制作服务尚未连接，AI 起稿、账号、配音、付款和成片下载暂不可用':['Free storyboard tools are available · Production service is offline; AI drafts, accounts, narration, payments and video downloads are unavailable.','無料の絵コンテ機能は利用可能 · 制作サービス未接続のため、AI台本・アカウント・音声・支払い・動画保存は未利用です。','Storyboard gratuit disponible · Service déconnecté : IA, comptes, voix, paiements et vidéos indisponibles.','Storyboard gratuito disponible · Servicio desconectado: IA, cuentas, voz, pagos y descarga de vídeo no disponibles.'],
  '制作服务尚未连接，当前可拆分脚本和导出分镜工程':['Production service is offline. You can still split and export storyboards.','制作サービス未接続です。絵コンテの分割と保存は利用できます。','Service déconnecté. La découpe et l’export restent disponibles.','Servicio desconectado. Puedes dividir y exportar storyboards.'],
  '制作服务尚未连接，请先使用免费分镜工具':['Production service is offline. Use the free storyboard tools for now.','制作サービス未接続です。無料の絵コンテ機能をご利用ください。','Service déconnecté. Utilisez les outils de storyboard gratuits.','Servicio desconectado. Usa las herramientas gratuitas de storyboard.'],
  '配音与渲染尚未开通，当前可先下载分镜工程':['Voiceover and rendering are not enabled. Export your storyboard for now.','音声と動画制作は未開通です。絵コンテの保存をご利用ください。','Voix et rendu non activés. Exportez votre storyboard en attendant.','Voz y renderizado sin activar. Por ahora, exporta el storyboard.'],
  'AI 起稿尚未开通，可以先粘贴口播稿拆分':['AI drafting is not enabled. Paste a script to split it into scenes.','AI台本は未開通です。台本を貼り付けて分割できます。','L’écriture IA n’est pas activée. Collez un script à découper.','La escritura con IA no está activada. Pega un guion para dividirlo.'],
  '请求未完成':['Request not completed','リクエスト未完了','Requête inachevée','Solicitud incompleta'],
  '操作失败':['Action failed','操作に失敗しました','Échec de l’action','La acción falló'],
  '登录后查看制作任务。':['Sign in to view your productions.','ログインして制作タスクを表示します。','Connectez-vous pour voir vos productions.','Inicia sesión para ver tus producciones.'],
  '登录后查看订单。':['Sign in to view orders.','ログインして注文を表示します。','Connectez-vous pour voir vos commandes.','Inicia sesión para ver tus pedidos.'],
  '下载未完成，请刷新任务状态':['Download failed. Refresh the job status.','保存に失敗しました。タスクを更新してください。','Téléchargement échoué. Actualisez le statut.','Descarga fallida. Actualiza el estado.'],
  '请输入完整链上交易哈希':['Enter the complete transaction hash','完全な取引ハッシュを入力してください','Saisissez le hash complet','Introduce el hash completo'],
  '请填写有效邮箱和 12–128 位密码':['Enter a valid email and a 12–128 character password','有効なメールと12〜128文字のパスワードを入力してください','Saisissez un e-mail valide et un mot de passe de 12 à 128 caractères','Introduce un correo válido y una contraseña de 12 a 128 caracteres'],
  '邮箱或密码不正确':['Incorrect email or password','メールまたはパスワードが正しくありません','E-mail ou mot de passe incorrect','Correo o contraseña incorrectos'],
  '无法注册，请检查邮箱或尝试登录':['Registration failed. Check your email or try signing in','登録できません。メールを確認するかログインをお試しください','Inscription impossible. Vérifiez l’e-mail ou connectez-vous','No se pudo registrar. Revisa el correo o intenta entrar'],
  '请求过于频繁，请稍后再试':['Too many requests. Try again later','リクエストが多すぎます。後ほどお試しください','Trop de requêtes. Réessayez plus tard','Demasiadas solicitudes. Inténtalo más tarde'],
  '该支付渠道尚未开通':['This payment method is not enabled','この決済方法は未開通です','Ce paiement n’est pas activé','Este método de pago no está activado'],
  '该渠道尚未开通':['This method is not enabled','この方法は未開通です','Ce moyen n’est pas activé','Este método no está activado'],
  '订单不存在':['Order not found','注文が見つかりません','Commande introuvable','Pedido no encontrado'],
  '订单不可提交凭证':['Proof cannot be submitted for this order','この注文には証明を提出できません','Justificatif impossible pour cette commande','No se puede enviar comprobante para este pedido'],
  '任务不存在':['Job not found','タスクが見つかりません','Tâche introuvable','Tarea no encontrada'],
  '任务尚未完成':['The video is not ready yet','動画はまだ完成していません','La vidéo n’est pas encore prête','El vídeo aún no está listo'],
  '已有任务制作中，请等待完成':['You already have active jobs. Wait for them to finish','進行中のタスクがあります。完了をお待ちください','Des tâches sont en cours. Attendez leur fin','Ya hay tareas activas. Espera a que terminen'],
  '请输入 2–1800 字脚本':['Enter a script of 2–1800 characters','2〜1800文字の台本を入力してください','Saisissez un script de 2 à 1800 caractères','Introduce un guion de 2 a 1800 caracteres'],
  '脚本过长，请缩短至 12 个镜头以内':['Script too long. Shorten it to 12 scenes or fewer','台本が長すぎます。12シーン以内にしてください','Script trop long. Limitez-le à 12 scènes','Guion demasiado largo. Limítalo a 12 escenas'],
  '标题需要 1–80 个字符':['The title must be 1–80 characters','タイトルは1〜80文字にしてください','Le titre doit contenir 1 à 80 caractères','El título debe tener de 1 a 80 caracteres'],
  '每个镜头需要旁白（最多 300 字）和标题（最多 60 字）':['Each scene needs narration (up to 300 characters) and a heading (up to 60)','各シーンにナレーション（300文字以内）とタイトル（60文字以内）が必要です','Chaque scène exige une narration (300 caractères max.) et un titre (60 max.)','Cada escena necesita narración (máximo 300 caracteres) y título (máximo 60)'],
  '镜头时长应为 2–30 秒':['Each scene must last 2–30 seconds','各シーンは2〜30秒にしてください','Chaque scène doit durer 2 à 30 secondes','Cada escena debe durar de 2 a 30 segundos'],
  '单个视频最多 180 秒、1800 字':['Maximum 180 seconds and 1800 characters per video','1本につき180秒・1800文字までです','Maximum 180 secondes et 1800 caractères par vidéo','Máximo 180 segundos y 1800 caracteres por vídeo'],
  '制作未完成，请联系支持人员并提供任务编号，或稍后重新提交。':['Production failed. Contact support with the job ID, or submit again later.','制作に失敗しました。タスク番号を添えてサポートへ連絡するか、後ほど再送信してください。','Production échouée. Contactez l’assistance avec l’identifiant ou réessayez plus tard.','La producción falló. Contacta con soporte indicando el ID o vuelve a enviarla más tarde.'],
  '工作进程中断，请重新提交':['Worker interrupted. Please resubmit','処理が中断しました。再送信してください','Traitement interrompu. Renvoyez la tâche','Proceso interrumpido. Vuelve a enviar la tarea'],
  '支付宝暂时无法处理，请稍后重试':['Alipay is unavailable. Try again later','Alipayを利用できません。後ほどお試しください','Alipay indisponible. Réessayez plus tard','Alipay no está disponible. Inténtalo más tarde'],
  '微信支付暂时无法处理，请稍后重试':['WeChat Pay is unavailable. Try again later','WeChat Payを利用できません。後ほどお試しください','WeChat Pay indisponible. Réessayez plus tard','WeChat Pay no está disponible. Inténtalo más tarde'],
  '微信支付响应验签失败':['WeChat payment verification failed','WeChat支払いの署名確認に失敗しました','Échec de vérification WeChat','Falló la verificación del pago de WeChat'],
  'AI 脚本生成暂时失败，请稍后重试':['AI drafting failed. Try again later','AI台本生成に失敗しました。後ほどお試しください','Échec du script IA. Réessayez plus tard','Falló el guion con IA. Inténtalo más tarde'],
};
const patterns=[
  [/^(\d+) 个镜头$/,['$1 scenes','$1 シーン','$1 scènes','$1 escenas']],
  [/^镜头 (\d+) · 预览 ↗$/,['Scene $1 · Preview ↗','シーン $1 · プレビュー ↗','Scène $1 · Aperçu ↗','Escena $1 · Vista previa ↗']],
  [/^(.+) · 退出$/,['$1 · Sign out','$1 · ログアウト','$1 · Déconnexion','$1 · Salir']],
  [/^订阅有效至 (.+)$/,['Active until $1','$1 まで有効','Actif jusqu’au $1','Activo hasta $1']],
  [/^订单 (.+)$/,['Order $1','注文 $1','Commande $1','Pedido $1']],
  [/^状态：$/,['Status:','状態：','Statut :','Estado:']],
  [/^支付$/,['Pay','支払い','Payer','Pagar']],
  [/^· 网络$/,['· Network','· ネットワーク','· Réseau','· Red']],
  [/^支付金额：$/,['Amount:','支払金額：','Montant :','Importe:']],
  [/^请用(微信|支付宝)扫描支付。完成后核实到账。$/,['Scan with $1, then verify your payment.','$1でスキャンして支払い、入金を確認してください。','Scannez avec $1 puis vérifiez le paiement.','Escanea con $1 y verifica el pago.']],
  [/^支付宝 \/ 微信：¥ ([\d.]+) \/ 30 天（运营方设定）$/,['Alipay / WeChat: CNY $1 / 30 days (operator-set price)','Alipay / WeChat：CNY $1 / 30日（運営者設定）','Alipay / WeChat : $1 CNY / 30 jours (prix fixé par l’opérateur)','Alipay / WeChat: $1 CNY / 30 días (precio del operador)']],
  [/^制作中 (\d+)%$/,['Rendering $1%','制作中 $1%','Rendu $1 %','Renderizando $1%']],
];
export function translate(source,lang=language){
  const index=columns[lang];if(index===undefined)return menuCopy(source,lang);
  if(messages[source])return messages[source][index];
  for(const [pattern,values]of patterns)if(pattern.test(source))return source.replace(pattern,values[index]).replace('支付宝','Alipay').replace('微信','WeChat');
  return menuCopy(source,lang);
}
export const t=source=>translate(source);
export function initI18n({preserveTitle=false}={}){
  const reverse=new Map();for(const [source,values]of Object.entries(messages))for(const value of values)if(!reverse.has(value))reverse.set(value,source);
  const sourceText=value=>{const trimmed=value.trim();return value.replace(trimmed,reverse.get(trimmed)||trimmed);};
  const label=document.createElement('label');label.className='language-picker';label.append(document.createTextNode('语言'));
  const select=document.createElement('select');select.id='studio-language';select.setAttribute('aria-label','语言');
  for(const [value,name]of Object.entries(LANGUAGES)){const option=document.createElement('option');option.value=value;option.textContent=name;select.append(option);}select.value=language;label.append(select);
  document.querySelector('header').insertBefore(label,document.querySelector('header #account-button'));
  const original=new WeakMap(),attrs=new WeakMap();let scheduled=false;
  const excluded=el=>el?.closest('script,style,textarea,[data-no-i18n],.job p:first-child,.address');
  function apply(){
    document.querySelectorAll('select:not(#studio-language) option').forEach(o=>{if(!o.hasAttribute('value'))o.setAttribute('value',o.value);});
    scheduled=false;observer.disconnect();document.documentElement.lang=language;
    if(!preserveTitle)document.title=({'zh-CN':'视频自动制作工作台 · HaoWord Studio',en:'Video Production Workspace · HaoWord Studio',ja:'動画制作ワークスペース · HaoWord Studio',fr:'Espace de production vidéo · HaoWord Studio',es:'Espacio de producción de vídeo · HaoWord Studio'})[language];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;if(excluded(node.parentElement))continue;
      const record=original.get(node),source=record&&node.nodeValue===record.rendered?record.source:sourceText(node.nodeValue);
      const trimmed=source.trim();if(!trimmed)continue;
      const rendered=source.replace(trimmed,translate(trimmed));
      original.set(node,{source,rendered});if(rendered!==node.nodeValue)node.nodeValue=rendered;
    }
    document.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{
      if(el.closest('script,style,[data-no-i18n]'))return;const record=attrs.get(el)||{};
      for(const attr of ['placeholder','aria-label']){const value=el.getAttribute(attr);if(value===null)continue;const previous=record[attr];const source=previous&&value===previous.rendered?previous.source:sourceText(value);const rendered=translate(source);record[attr]={source,rendered};if(value!==rendered)el.setAttribute(attr,rendered);}attrs.set(el,record);
    });
    observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label']});
  }
  const observer=new MutationObserver(()=>{if(!scheduled){scheduled=true;queueMicrotask(apply);}});
  select.addEventListener('change',()=>{language=select.value;try{localStorage.setItem('haoword-studio-language',language);}catch{}apply();document.dispatchEvent(new CustomEvent('studio-languagechange',{detail:language}));});
  apply();
}
