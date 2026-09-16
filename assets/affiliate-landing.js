(() => {
  const form = document.querySelector('#affiliate-lead-form');
  if (!form) return;

  const status = document.querySelector('#affiliate-lead-status');
  const endpoint = 'https://n8n-production-3db6.up.railway.app/webhook/haowordtool-lead';

  function value(name) {
    return String(form.elements[name]?.value || '').trim();
  }

  function buildBrief() {
    return [
      'HaoWordTool affiliate marketing landing-page lead',
      `Name: ${value('name')}`,
      `Contact: ${value('contact')}`,
      `Business: ${value('business')}`,
      `Main channel: ${value('channel')}`,
      `Audience / niche: ${value('audience')}`,
      `Current bottleneck: ${value('pain')}`,
      `Goal: ${value('goal')}`,
      `UTM source: ${new URLSearchParams(location.search).get('utm_source') || 'direct'}`
    ].join('\n');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const button = form.querySelector('button[type="submit"]');
    const brief = buildBrief();
    const payload = new URLSearchParams({
      source: 'affiliate-marketing-landing-page',
      offer: 'AI video traffic to sales system',
      name: value('name'),
      contact: value('contact'),
      business: value('business'),
      platforms: value('channel'),
      pain: `${value('pain')} | Audience: ${value('audience')} | Goal: ${value('goal')}`,
      brief
    });

    button.disabled = true;
    status.textContent = 'Submitting...';

    fetch(endpoint, {method: 'POST', mode: 'no-cors', body: payload}).catch(() => {});

    const subject = 'HaoWordTool affiliate marketing system request';
    location.href = `mailto:love6598878593@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(brief)}`;
    status.innerHTML = 'Your email app should open. The request was also queued for manual follow-up. You can review the <a href="/multi-platform-publishing-checklist.html">publishing checklist</a> next.';
    form.reset();
    button.disabled = false;
  });
})();
