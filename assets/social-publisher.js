(() => {
  const form = document.querySelector('#publisher-quote');
  if (!form) return;
  const status = document.querySelector('#publisher-status');
  function prepare() {
    if (!form.reportValidity()) return '';
    const values = new FormData(form);
    const brief = [
      'HaoWord Studio — Social Publisher setup inquiry',
      'Price: written quote requested; no order or payment submitted',
      `Name: ${values.get('name')}`, `Email: ${values.get('email')}`,
      `System: ${values.get('system')}`, `Account count: ${values.get('accounts')}`,
      `Platforms and content: ${values.get('requirements')}`,
      `Deadline / other requirements: ${values.get('deadline') || 'Not specified'}`
    ].join('\n\n');
    document.querySelector('#publisher-preview').hidden = false;
    document.querySelector('#publisher-brief-text').value = brief;
    status.textContent = 'Brief ready. Send it to love6598878593@gmail.com to request a quote.';
    return brief;
  }
  document.querySelector('#preview-publisher-brief').addEventListener('click', prepare);
  form.addEventListener('submit', event => {
    event.preventDefault();
    const brief = prepare();
    if (!brief) return;
    location.href = `mailto:love6598878593@gmail.com?subject=${encodeURIComponent('Social Publisher setup quote')}&body=${encodeURIComponent(brief)}`;
    status.textContent = 'Your email app should open. If it does not, copy the brief below and email it to love6598878593@gmail.com.';
  });
})();
