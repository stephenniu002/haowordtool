(() => {
  const form = document.querySelector('#publisher-quote');
  if (!form) return;
  const status = document.querySelector('#publisher-status');
  const plans = {monthly: 'Monthly — US$25 / month', yearly: 'Yearly — US$299 / year'};
  document.querySelectorAll('[data-plan]').forEach(link => link.addEventListener('click', () => {
    form.elements.plan.value = link.dataset.plan;
    document.querySelector('#publisher-preview').hidden = true;
    status.textContent = '';
  }));
  form.addEventListener('input', () => {
    document.querySelector('#publisher-preview').hidden = true;
    status.textContent = '';
  });
  function prepare() {
    if (!form.reportValidity()) return '';
    const values = new FormData(form);
    const brief = [
      'HaoWord Studio — Social Publisher service request',
      `Plan: ${plans[values.get('plan')]}`,
      'Scope and service period to be confirmed. Manual renewal; payment not yet submitted.',
      `Name: ${values.get('name')}`, `Email: ${values.get('email')}`,
      `System: ${values.get('system')}`, `Account count: ${values.get('accounts')}`,
      `Platforms and content: ${values.get('requirements')}`,
      `Deadline / other requirements: ${values.get('deadline') || 'Not specified'}`
    ].join('\n\n');
    document.querySelector('#publisher-preview').hidden = false;
    document.querySelector('#publisher-brief-text').value = brief;
    status.textContent = 'Request ready. Send it to love6598878593@gmail.com to confirm your selected plan.';
    return brief;
  }
  document.querySelector('#preview-publisher-brief').addEventListener('click', prepare);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const brief = prepare();
    if (!brief) return;
    location.href = `mailto:love6598878593@gmail.com?subject=${encodeURIComponent('Social Publisher — ' + plans[form.elements.plan.value])}&body=${encodeURIComponent(brief)}`;
    status.textContent = 'Your email app should open. If it does not, copy the brief below and email it to love6598878593@gmail.com.';
  });
})();
