export const MAX_BYTES = 256 * 1024 * 1024;
export function mediaURL(value, base) {
  const url = new URL(value, base);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('请输入不含账号密码的 HTTP(S) 媒体链接。');
  return url.href;
}
export function parsePlaylist(text, base) {
  const lines = text.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  if (lines[0] !== '#EXTM3U') throw new Error('这不是有效的 M3U8 播放列表。');
  if (lines.some(s => /^#EXT-X-(KEY|SESSION-KEY):/.test(s) && !/^#EXT-X-(KEY|SESSION-KEY):METHOD=NONE(?:,|$)/.test(s))) throw new Error('此流已加密，不支持下载。');
  if (lines.some(s => /^#EXT-X-(MAP|BYTERANGE|DISCONTINUITY|GAP|PART|MEDIA)(:|$)/.test(s))) throw new Error('此流包含分离轨道、分段格式或时间线切换，暂不支持。');
  const variants = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXT-X-STREAM-INF:')) {
      if (!lines[i + 1] || lines[i + 1].startsWith('#')) throw new Error('清晰度列表不完整。');
      variants.push({url: mediaURL(lines[++i], base), label: lines[i - 1].match(/RESOLUTION=([^,]+)/)?.[1] || `清晰度 ${variants.length + 1}`});
    }
  }
  if (variants.length) return {variants};
  if (!lines.includes('#EXT-X-ENDLIST')) throw new Error('仅支持已结束的点播流，暂不支持直播录制。');
  const segments = lines.filter(s => !s.startsWith('#')).map(s => mediaURL(s, base));
  if (!segments.length || segments.length > 2000) throw new Error('分片数量必须为 1–2000。');
  if (lines.filter(s => s.startsWith('#EXTINF:')).length !== segments.length) throw new Error('播放列表的分片信息不完整。');
  return {segments};
}
export async function readLimited(response, budget, onChunk = () => {}) {
  if (!response.ok) throw new Error(`来源返回 HTTP ${response.status}。`);
  if (Number(response.headers.get('content-length')) > budget) { await response.body?.cancel(); throw new Error('文件超过 256 MB 下载上限。'); }
  if (!response.body) throw new Error('来源没有返回可读取的文件。');
  const reader = response.body.getReader(), chunks = []; let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > budget) throw new Error('文件超过下载上限。');
      chunks.push(value); onChunk(value.byteLength);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  return new Blob(chunks);
}
export function isTS(bytes) {
  return bytes.length >= 188 && bytes.length % 188 === 0 && bytes.every((v, i) => i % 188 !== 0 || v === 0x47);
}
