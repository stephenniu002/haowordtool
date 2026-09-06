import {MAX_BYTES, mediaURL, parsePlaylist, readLimited, isTS} from './media-core.mjs';
const $ = id => document.getElementById(id);
let controller, savedURL;
const say = text => { $('status').textContent = text; };
const options = signal => ({signal, credentials:'omit', referrerPolicy:'no-referrer'});
function clearSaved() { if (savedURL) URL.revokeObjectURL(savedURL); savedURL = undefined; $('save').hidden = true; $('save').removeAttribute('href'); }
function reset() { clearSaved(); $('quality-box').hidden = true; $('quality').replaceChildren(); $('start').textContent = '读取并下载 ↓'; say('准备就绪，添加一个链接开始。'); $('progress').value = 0; }
$('media-url').addEventListener('input', reset);
$('kind').addEventListener('change', reset);
$('quality').addEventListener('change', clearSaved);
$('cancel').addEventListener('click', () => controller?.abort());
window.addEventListener('pagehide', () => { controller?.abort(); clearSaved(); });
$('download-form').addEventListener('submit', async event => {
  event.preventDefault(); if (controller) return;
  clearSaved(); controller = new AbortController(); const signal = controller.signal;
  $('start').disabled = true; $('cancel').hidden = false;
  for (const id of ['media-url','kind','quality']) $(id).disabled = true;
  $('progress').removeAttribute('value'); let total = 0;
  const count = n => { total += n; $('bytes').textContent = `${(total / 1048576).toFixed(1)} MB / 256 MB`; };
  try {
    const source = mediaURL($('media-url').value.trim());
    const sourceName = new URL(source).pathname.split('/').pop() || 'media';
    let blob, name;
    say('正在连接媒体来源…');
    if ($('kind').value === 'hls') {
      let url = $('quality-box').hidden ? source : $('quality').value;
      const response = await fetch(url, options(signal));
      const manifest = await readLimited(response, 1024 * 1024);
      const parsed = parsePlaylist(await manifest.text(), response.url || url);
      if (parsed.variants) {
        $('quality').replaceChildren(...parsed.variants.map(v => new Option(v.label, v.url)));
        $('quality-box').hidden = false; $('start').textContent = '下载所选清晰度 ↓';
        say('已读取清晰度，请选择后点击下载。'); $('progress').value = 0; return;
      }
      const chunks = [];
      for (let i = 0; i < parsed.segments.length; i++) {
        say(`正在下载分片 ${i + 1} / ${parsed.segments.length}…`);
        const part = await readLimited(await fetch(parsed.segments[i], options(signal)), MAX_BYTES - total, count);
        if (!isTS(new Uint8Array(await part.arrayBuffer()))) throw new Error('分片不是受支持的 MPEG-TS 格式，未生成不完整文件。');
        chunks.push(part); $('progress').value = (i + 1) / parsed.segments.length * 100;
      }
      blob = new Blob(chunks, {type:'video/mp2t'}); name = sourceName.replace(/\.m3u8$/i,'') + '.ts';
    } else {
      const response = await fetch(source, options(signal));
      const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
      const known = /\.(mp4|webm|mp3|m4a|wav|ogg|mov|ts)$/i.test(sourceName);
      if (!response.ok) throw new Error(`来源返回 HTTP ${response.status}。`);
      if (!/^(video|audio)\//.test(type) && !(known && (!type || type === 'application/octet-stream'))) {
        await response.body?.cancel(); throw new Error('链接未返回支持的音视频文件；M3U8 请切换为 HLS 类型。');
      }
      blob = await readLimited(response, MAX_BYTES, count);
      if (!blob.size) throw new Error('来源返回了空文件。');
      name = sourceName; $('progress').value = 100;
    }
    signal.throwIfAborted();
    savedURL = URL.createObjectURL(blob); $('save').href = savedURL;
    $('save').download = name.replace(/[^\p{L}\p{N}._-]/gu,'_').slice(-120) || 'media';
    $('save').hidden = false; say('文件已准备好。点击“保存文件”保存到设备。');
  } catch (error) {
    $('progress').value = 0;
    say(error.name === 'AbortError' ? '下载已取消。' : error instanceof TypeError ? '无法读取来源。请检查链接、跨域权限（CORS）和网络连接。' : error.message);
  } finally {
    controller = undefined; $('start').disabled = false; $('cancel').hidden = true;
    for (const id of ['media-url','kind','quality']) $(id).disabled = false;
  }
});
