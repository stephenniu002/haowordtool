(() => {
  const form = document.querySelector('#publisher-quote');
  if (!form) return;
  const status = document.querySelector('#publisher-status');
  const t = text => window.publisherI18n?.t(text) ?? text;
  const plans = {monthly: 'Monthly — US$25 / month', yearly: 'Yearly — US$299 / year'};
  const timing = form.elements.publishTiming;
  const scheduledAt = form.elements.scheduledAt;
  const utcOffset = form.elements.utcOffset;
  const scheduleFields = document.querySelector('[data-schedule-fields]');
  form.noValidate = true;
  function updateTiming() {
    const scheduled = timing.value === 'scheduled';
    scheduleFields.hidden = !scheduled;
    scheduledAt.disabled = utcOffset.disabled = !scheduled;
    scheduledAt.required = utcOffset.required = scheduled;
    scheduledAt.setCustomValidity('');
  }
  timing.addEventListener('change', updateTiming);
  updateTiming();
  document.querySelectorAll('[data-plan]').forEach(link => link.addEventListener('click', () => {
    form.elements.plan.value = link.dataset.plan;
    document.querySelector('#publisher-preview').hidden = true;
    status.textContent = '';
  }));
  form.addEventListener('input', () => {
    scheduledAt.setCustomValidity('');
    document.querySelector('#publisher-preview').hidden = true;
    status.textContent = '';
  });
  function prepare() {
    scheduledAt.setCustomValidity('');
    if (timing.value === 'scheduled' && scheduledAt.value) {
      const instant = Date.parse(scheduledAt.value + utcOffset.value);
      if (!Number.isFinite(instant) || instant <= Date.now()) {
        scheduledAt.setCustomValidity(t('Choose a future date and time in the selected UTC offset.'));
      }
    }
    if (!form.reportValidity()) return '';
    const values = new FormData(form);
    const brief = [
      t('HaoWord Studio — Social Publisher service request'),
      `${t('Plan')}: ${t(plans[values.get('plan')])}`,
      t('Scope and service period to be confirmed. Manual renewal; payment not yet submitted.'),
      `${t('Preferred language')}: ${document.documentElement.lang}`,
      `${t('Name')}: ${values.get('name')}`, `${t('Email')}: ${values.get('email')}`,
      `${t('System')}: ${t(values.get('system'))}`, `${t('Account count')}: ${values.get('accounts')}`,
      `${t('Platforms and content')}: ${values.get('requirements')}`,
      `${t('Publishing preference')}: ${t(timing.value === 'scheduled' ? 'Scheduled publishing' : 'Publish as soon as ready')}`,
      ...(timing.value === 'scheduled' ? [
        `${t('Requested date and time')}: ${scheduledAt.value.replace('T', ' ')} (UTC${utcOffset.value})`,
        `UTC: ${new Date(scheduledAt.value + utcOffset.value).toISOString()}`
      ] : []),
      t('This is a service request, not an active publishing job. Login and platform support must be confirmed.'),
      `${t('Deadline / other requirements')}: ${values.get('deadline') || t('Not specified')}`
    ].join('\n\n');
    document.querySelector('#publisher-preview').hidden = false;
    document.querySelector('#publisher-brief-text').value = brief;
    status.textContent = t('Request ready. Send it to love6598878593@gmail.com to confirm your selected plan.');
    return brief;
  }
  document.querySelector('#preview-publisher-brief').addEventListener('click', prepare);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const brief = prepare();
    if (!brief) return;
    location.href = `mailto:love6598878593@gmail.com?subject=${encodeURIComponent(t('Social Publisher — ') + t(plans[form.elements.plan.value]))}&body=${encodeURIComponent(brief)}`;
    status.textContent = t('Your email app should open. If it does not, copy the brief below and email it to love6598878593@gmail.com.');
  });
})();
