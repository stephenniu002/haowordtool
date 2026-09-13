const RUN_WEBHOOK = 'https://n8n-production-3db6.up.railway.app/webhook/one-person-company-run';
const DRAMA_WEBHOOK = 'https://n8n-production-3db6.up.railway.app/webhook/ai-short-drama-project';
const LEAD_WEBHOOK = 'https://n8n-production-3db6.up.railway.app/webhook/haowordtool-lead';

const form = document.querySelector('#opc-form');
const status = document.querySelector('#opc-status');
const output = document.querySelector('#opc-output');
const dramaForm = document.querySelector('#drama-form');
const dramaStatus = document.querySelector('#drama-status');
const dramaOutput = document.querySelector('#drama-output');

function field(formData, key) {
  return String(formData.get(key) || '').trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function taskList(packets) {
  return Object.entries(packets || {}).map(([name, packet]) => {
    const endpoint = packet && packet.endpoint ? packet.endpoint : '';
    const ask = packet && packet.ask ? packet.ask : '';
    return `<li><b>${escapeHtml(name)}</b><span>${escapeHtml(endpoint)}</span><p>${escapeHtml(ask)}</p></li>`;
  }).join('');
}

function employeeList(employees) {
  return (employees || []).slice(0, 8).map((employee) => (
    `<li><b>${escapeHtml(employee.owner)}</b><span>${escapeHtml(employee.role)}</span></li>`
  )).join('');
}

function shotList(storyboard) {
  return (storyboard || []).slice(0, 8).map((shot) => (
    `<li><b>${escapeHtml(shot.id)} · ${escapeHtml(shot.beat)}</b><span>${escapeHtml(shot.cameraDirections)}</span><p>${escapeHtml(shot.hook)}</p></li>`
  )).join('');
}

function approvalText(items) {
  return escapeHtml((items || []).join('、'));
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 180)}`);
  }
  return response.json();
}

async function saveOptionalLead(payload, run) {
  if (!payload.contact) return;
  await postJson(LEAD_WEBHOOK, {
    name: payload.name || 'One-person company lead',
    email: payload.contact.includes('@') ? payload.contact : '',
    contact: payload.contact,
    source: 'ai-one-person-company-guide',
    businessType: payload.product,
    goal: payload.goal,
    budget: '',
    message: `Requested AI employee workflow run ${run.runId}: ${payload.topic}`,
    interest: 'AI video traffic to sales automation'
  });
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const payload = {
    topic: field(data, 'topic'),
    product: field(data, 'product'),
    brandUrl: field(data, 'brandUrl'),
    market: field(data, 'market'),
    goal: field(data, 'goal'),
    coreValueProposition: field(data, 'coreValueProposition'),
    name: field(data, 'name'),
    contact: field(data, 'contact')
  };

  status.textContent = '正在生成';
  output.innerHTML = '<p class="muted">n8n 正在创建总编排 run，并把任务拆给各个 AI 员工。</p>';

  try {
    const run = await postJson(RUN_WEBHOOK, payload);
    try {
      await saveOptionalLead(payload, run);
    } catch (leadError) {
      console.warn('Lead capture failed', leadError);
    }
    status.textContent = '已生成';
    output.innerHTML = `
      <p><b>Run ID：</b>${escapeHtml(run.runId)}</p>
      <p><b>目标：</b>${escapeHtml(run.goal)}</p>
      <p><b>模式：</b>${escapeHtml(run.orchestrationMode)}</p>
      <h3>AI 员工</h3>
      <ul class="opc-mini-list">${employeeList(run.aiEmployees)}</ul>
      <h3>下一步任务包</h3>
      <ul class="opc-task-list">${taskList(run.generatedTaskPackets)}</ul>
      <h3>审批提醒</h3>
      <p>${approvalText(run.approvalRequired)}</p>
    `;
  } catch (error) {
    status.textContent = '生成失败';
    output.innerHTML = `<p class="error">没有生成成功：${escapeHtml(error.message)}。你可以刷新后再试，或直接打开 n8n 查看 workflow 是否处于 Active。</p>`;
  }
});

dramaForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(dramaForm);
  const payload = {
    title: field(data, 'title'),
    premise: field(data, 'premise'),
    genre: field(data, 'genre'),
    market: field(data, 'market'),
    episodes: Number(field(data, 'episodes') || 3),
    scenesPerEpisode: Number(field(data, 'scenesPerEpisode') || 5),
    durationPerEpisode: field(data, 'durationPerEpisode'),
    monetization: field(data, 'monetization')
  };

  dramaStatus.textContent = '正在生成';
  dramaOutput.innerHTML = '<p class="muted">n8n 正在建立短剧项目，生成角色 bible、分镜和异步渲染任务。</p>';

  try {
    const project = await postJson(DRAMA_WEBHOOK, payload);
    dramaStatus.textContent = '已生成';
    dramaOutput.innerHTML = `
      <p><b>Project ID：</b>${escapeHtml(project.projectId)}</p>
      <p><b>标题：</b>${escapeHtml(project.title)}</p>
      <p><b>规模：</b>${escapeHtml(project.episodes)} 集，${escapeHtml(project.totalScenes)} 个分镜，${escapeHtml((project.renderJobs || []).length)} 个渲染任务</p>
      <p><b>状态：</b>${escapeHtml(project.status)}</p>
      <h3>角色一致性</h3>
      <ul class="opc-mini-list">
        <li><b>男主</b><span>${escapeHtml(project.characterBible?.hero?.consistencyPrompt)}</span></li>
        <li><b>女主</b><span>${escapeHtml(project.characterBible?.heroine?.consistencyPrompt)}</span></li>
        <li><b>反派</b><span>${escapeHtml(project.characterBible?.antagonist?.consistencyPrompt)}</span></li>
      </ul>
      <h3>前 8 个分镜</h3>
      <ul class="opc-task-list">${shotList(project.storyboard)}</ul>
      <h3>审批提醒</h3>
      <p>${approvalText(project.approvalRequired)}</p>
    `;
  } catch (error) {
    dramaStatus.textContent = '生成失败';
    dramaOutput.innerHTML = `<p class="error">短剧项目没有生成成功：${escapeHtml(error.message)}。请确认 n8n V20 workflow 处于 Active。</p>`;
  }
});
