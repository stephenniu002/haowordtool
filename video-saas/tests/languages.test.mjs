import test from 'node:test';
import assert from 'node:assert/strict';
import {messages,translate,LANGUAGES} from '../../assets/video-i18n.mjs';
import {draftFromText,validateProject} from '../../assets/video-core.mjs';
test('every UI translation has English, Japanese, French and Spanish text',()=>{
  assert.deepEqual(Object.keys(LANGUAGES),['zh-CN','en','ja','fr','es']);
  for(const [key,values]of Object.entries(messages)){
    assert.equal(values.length,4,key);values.forEach(v=>assert.ok(typeof v==='string'&&v.trim(),key));
  }
  assert.equal(translate('视频工作台','en'),'Video studio');
  assert.equal(translate('语言','ja'),'言語');
  assert.equal(translate('3 个镜头','fr'),'3 scènes');
  assert.equal(translate('月度订阅','es'),'Suscripción mensual');
  assert.equal(translate('My original script','fr'),'My original script');
});
test('selected script language survives validation and exports',()=>{
  for(const language of Object.keys(LANGUAGES))assert.equal(draftFromText('A clear story. A finished video.',{language}).language,language);
  const p=draftFromText('A short video.');assert.throws(()=>validateProject({...p,language:'bad'}));
});
