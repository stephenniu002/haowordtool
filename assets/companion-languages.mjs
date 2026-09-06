const names={'zh-CN':'中文',en:'English',ja:'日本語',fr:'Français',es:'Español'},columns={en:0,ja:1,fr:2,es:3};
const labels={
'展开 / 收起人物设定':['Expand / collapse persona','人物設定を開く・閉じる','Afficher / masquer le profil','Mostrar / ocultar personalidad'],
'其他角色信息':['Other character information','その他の人物情報','Autres informations','Otra información'],
'作者说明':['Creator notes','作者のメモ','Notes de création','Notas del creador'],
'聊天方式':['How to chat','チャットの使い方','Comment discuter','Cómo conversar'],
'虚构成年角色':['Fictional adult character','架空の成人キャラクター','Personnage adulte fictif','Personaje adulto ficticio'],
'可自定义设定':['Customizable','カスタマイズ可能','Personnalisable','Personalizable'],
'排序':['Sort','並べ替え','Trier','Ordenar'],
'顺序':['Order','順序','Ordre','Orden'],
'默认顺序':['Default order','標準順','Ordre par défaut','Orden predeterminado'],
'名称':['Name','名前','Nom','Nombre'],
'最近添加':['Date added','追加順','Date d’ajout','Fecha de creación'],
'最近更新（暂无记录）':['Updated (no records)','更新順（記録なし）','Mise à jour (aucune donnée)','Actualización (sin datos)'],
'热门（暂无统计）':['Trending (no data)','トレンド（統計なし）','Tendances (aucune donnée)','Tendencias (sin datos)'],
'受欢迎（暂无统计）':['Popularity (no data)','人気（統計なし）','Popularité (aucune donnée)','Popularidad (sin datos)'],
'升序':['Ascending','昇順','Croissant','Ascendente'],
'降序':['Descending','降順','Décroissant','Descendente'],
'我的AI 女友&男友':['My AI Girlfriend & Boyfriend','AI彼女・彼氏','Ma copine et mon copain IA','Mi novia y novio IA'],
'← 返回主页':['← Home','← ホームへ','← Accueil','← Inicio'],
'人物库':['Characters','キャラクター','Personnages','Personajes'],
'发现人物':['Discover characters','キャラクターを探す','Découvrir','Descubrir'],
'搜索':['Search','検索','Rechercher','Buscar'],
'搜索人物、兴趣…':['Search characters, interests…','人物・趣味を検索…','Personnages, centres d’intérêt…','Personajes, intereses…'],
'搜索人物':['Search characters','人物を検索','Chercher un personnage','Buscar personajes'],
'☰ 菜单':['☰ Menu','☰ メニュー','☰ Menu','☰ Menú'],
'⌂ 首页':['⌂ Home','⌂ ホーム','⌂ Accueil','⌂ Inicio'],
'▦ 人物库':['▦ Characters','▦ キャラクター','▦ Personnages','▦ Personajes'],
'＋ 创建朋友':['＋ Create a friend','＋ 友達を作成','＋ Créer un ami','＋ Crear un amigo'],
'▤ 聊天工作台':['▤ Chat studio','▤ チャット','▤ Espace de discussion','▤ Espacio de chat'],
'聊天工作台':['Chat studio','チャット','Espace de discussion','Espacio de chat'],
'角色设置':['Character settings','人物設定','Réglages du personnage','Ajustes del personaje'],
'创建与设置':['Create & customize','作成・設定','Créer et personnaliser','Crear y personalizar'],
'升级订阅':['Upgrade subscription','プランをアップグレード','Passer à un abonnement','Mejorar suscripción'],
'◇ App 创作':['◇ App studio','◇ アプリ作成','◇ Création d’apps','◇ Crear apps'],
'◎ 联系我们':['◎ Contact us','◎ お問い合わせ','◎ Nous contacter','◎ Contacto'],
'↓ 安装与设备说明':['↓ Installation & devices','↓ インストールと端末','↓ Installation et appareils','↓ Instalación y dispositivos'],
'访客体验':['Guest preview','ゲストプレビュー','Aperçu invité','Vista de invitado'],
'示例聊天 · 尚未连接 AI':['Demo chat · AI not connected','デモ · AI未接続','Démo · IA non connectée','Demostración · IA no conectada'],
'进入工作台 ↓':['Open chat studio ↓','チャットを開く ↓','Ouvrir la discussion ↓','Abrir chat ↓'],
'查看人物设定 ↗':['View character ↗','人物設定を見る ↗','Voir le personnage ↗','Ver personaje ↗'],
'选择角色，进入聊天 ↗':['Choose character & chat ↗','選んでチャットへ ↗','Choisir et discuter ↗','Elegir y conversar ↗'],
'应用角色设定':['Apply character settings','人物設定を適用','Appliquer les réglages','Aplicar ajustes'],
'导出角色卡':['Export character card','人物カードを書き出す','Exporter la fiche','Exportar personaje'],
'清空对话':['Clear conversation','会話を消去','Effacer la discussion','Borrar conversación'],
'发送 ↗':['Send ↗','送信 ↗','Envoyer ↗','Enviar ↗'],
'移除照片':['Remove photo','写真を削除','Retirer la photo','Quitar foto'],
'移除语音':['Remove voice sample','音声を削除','Retirer la voix','Quitar voz'],
'移除视频':['Remove video','動画を削除','Retirer la vidéo','Quitar vídeo'],
'订阅暂未开放':['Subscription unavailable','サブスク準備中','Abonnement indisponible','Suscripción no disponible'],
'全部角色':['All characters','すべての人物','Tous les personnages','Todos los personajes'],
'AI 女友':['AI girlfriend','AI彼女','Copine IA','Novia IA'],
'AI 男友':['AI boyfriend','AI彼氏','Copain IA','Novio IA'],
'AI 朋友':['AI friend','AI友達','Ami IA','Amigo IA'],
'中老年伙伴':['Mature companions','ミドル・シニアの仲間','Compagnons matures','Compañeros maduros'],
'自定义朋友':['Custom friend','カスタムの友達','Ami personnalisé','Amigo personalizado']
};
let language='zh-CN';try{const saved=localStorage.getItem('haoword-studio-language');if(saved in names)language=saved;}catch{}
const picker=document.createElement('select');picker.className='companion-language';picker.setAttribute('aria-label','Interface language');picker.setAttribute('data-no-i18n','');
for(const[value,label]of Object.entries(names)){const option=new Option(label,value);picker.append(option);}picker.value=language;
document.querySelector('body>header').append(picker);
const originals=new WeakMap(),attributes=new WeakMap();
function apply(){observer.disconnect();document.documentElement.lang=language;
document.querySelectorAll('select:not(.companion-language) option').forEach(option=>{if(!option.hasAttribute('value'))option.setAttribute('value',option.value);});
const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(node.parentElement.closest('script,style,textarea,[data-no-i18n],#messages'))continue;let old=originals.get(node);if(!old||node.nodeValue!==old.rendered)old={source:node.nodeValue};const source=old.source.trim(),value=labels[source]?.[columns[language]]||source;const rendered=old.source.replace(source,value);originals.set(node,{source:old.source,rendered});if(node.nodeValue!==rendered)node.nodeValue=rendered;}
document.querySelectorAll('[placeholder]').forEach(el=>{const source=attributes.get(el)||el.getAttribute('placeholder');attributes.set(el,source);el.setAttribute('placeholder',labels[source]?.[columns[language]]||source);});
observer.observe(document.body,{childList:true,subtree:true,characterData:true});}
const observer=new MutationObserver(apply);picker.onchange=()=>{language=picker.value;try{localStorage.setItem('haoword-studio-language',language);}catch{}apply();};apply();
