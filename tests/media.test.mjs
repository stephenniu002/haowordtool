import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mediaURL, parsePlaylist, readLimited, isTS} from '../assets/media-core.mjs';
test('URLs reject executable schemes and embedded credentials', () => {
  for (const u of ['javascript:alert(1)','file:///secret','https://user:pass@example.com/a']) assert.throws(() => mediaURL(u));
  assert.equal(mediaURL('../a.ts','https://example.com/video/list.m3u8'),'https://example.com/a.ts');
});
test('VOD resolves relative segments and preserves query parameters', () => {
  assert.deepEqual(parsePlaylist('#EXTM3U\n#EXTINF:3,\na.ts?t=1\n#EXT-X-ENDLIST','https://example.com/v/list.m3u8').segments,['https://example.com/v/a.ts?t=1']);
});
test('master playlist exposes selectable resolutions', () => {
  assert.deepEqual(parsePlaylist('#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=123,RESOLUTION=1280x720\n720/list.m3u8','https://example.com/master.m3u8').variants,[{url:'https://example.com/720/list.m3u8',label:'1280x720'}]);
});
test('unsupported streams fail explicitly', () => {
  for (const tag of ['#EXT-X-KEY:METHOD=AES-128,URI="key"','#EXT-X-MAP:URI="init.mp4"','#EXT-X-BYTERANGE:200@0','#EXT-X-DISCONTINUITY','#EXT-X-GAP:1','#EXT-X-MEDIA:TYPE=AUDIO']) {
    assert.throws(() => parsePlaylist(`#EXTM3U\n${tag}\n#EXTINF:2,\na.ts\n#EXT-X-ENDLIST`,'https://example.com/'));
  }
  assert.throws(() => parsePlaylist('#EXTM3U\n#EXTINF:2,\na.ts','https://example.com/'));
  assert.throws(() => parsePlaylist('#EXTM3U\na.ts\n#EXT-X-ENDLIST','https://example.com/'));
});
test('bounded reads reject oversized unknown-length streams', async () => {
  await assert.rejects(readLimited(new Response(new Uint8Array(10)), 5));
  assert.equal((await readLimited(new Response('abc'), 5)).size,3);
  await assert.rejects(readLimited(new Response('',{status:403}),100),/403/);
});
test('TS detection rejects HTML and truncated packets', () => {
  const data = new Uint8Array(376); data[0]=data[188]=0x47;
  assert.equal(isTS(data),true); assert.equal(isTS(data.slice(1)),false);
  data[188]=0; assert.equal(isTS(data),false);
});
