(() => {
  const form = document.querySelector('#product-order');
  if (!form) return;

  const products = {
    starter: { name: 'Starter Web Template Pack', price: '$9 USD', delivery: '10-template ZIP within 24 hours after verified payment' },
    pro: { name: 'Pro Web Template Pack', price: '$29 USD', delivery: '30-template ZIP within 24 hours after verified payment' },
    ielts: { name: 'IELTS English Course', price: '$29 USD', delivery: 'Private Google Drive viewer access within 24 hours after verified payment' }
  };
  const productInput = form.elements.product;
  const driveField = document.querySelector('[data-drive-field]');
  const driveInput = form.elements.driveEmail;
  const status = document.querySelector('.order-status');
  const summaryProduct = document.querySelector('#summary-product');
  const summaryPrice = document.querySelector('#summary-price');
  const summaryDelivery = document.querySelector('#summary-delivery');
  const summaryReference = document.querySelector('#summary-reference');
  let currentRequest = '';
  let currentReference = '';

  function makeReference() {
    const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
    const bytes = new Uint8Array(3);
    crypto.getRandomValues(bytes);
    const suffix = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
    return `HW-${date}-${suffix}`;
  }

  function updateProduct() {
    const product = products[productInput.value];
    const needsDrive = productInput.value === 'ielts';
    driveField.hidden = !needsDrive;
    driveInput.required = needsDrive;
    if (!needsDrive) driveInput.value = '';
    summaryProduct.textContent = product?.name || 'Select a product';
    summaryPrice.textContent = product?.price || '—';
    summaryDelivery.textContent = product?.delivery || '—';
  }

  function buildRequest() {
    if (!form.reportValidity()) return '';
    if (!currentReference) currentReference = makeReference();
    const product = products[productInput.value];
    const values = new FormData(form);
    return [
      `Order reference: ${currentReference}`,
      `Product: ${product.name}`,
      `Price shown: ${product.price}`,
      `Name: ${values.get('name')}`,
      `Contact email: ${values.get('email')}`,
      `Country or region: ${values.get('country')}`,
      `Preferred payment type: ${values.get('payment')}`,
      productInput.value === 'ielts' ? `Google email for Drive access: ${values.get('driveEmail')}` : '',
      `Order note: ${values.get('note') || 'None'}`,
      '',
      'Please reply with the current contents, accepted payment instructions, delivery target and refund terms before I pay.'
    ].filter(Boolean).join('\n');
  }

  productInput.addEventListener('change', () => {
    currentReference = '';
    currentRequest = '';
    summaryReference.textContent = 'Generated when you prepare the request';
    status.textContent = '';
    updateProduct();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    currentRequest = buildRequest();
    if (!currentRequest) return;
    summaryReference.textContent = currentReference;
    status.textContent = `Order ${currentReference} is ready. Your email app should open next.`;
    const subject = `HaoWordStudio order request — ${currentReference}`;
    window.location.href = `mailto:love6598878593@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(currentRequest)}`;
  });

  document.querySelector('#copy-order')?.addEventListener('click', async () => {
    currentRequest = buildRequest();
    if (!currentRequest) return;
    summaryReference.textContent = currentReference;
    try {
      await navigator.clipboard.writeText(currentRequest);
      status.textContent = `Order ${currentReference} copied. Email it to love6598878593@gmail.com.`;
    } catch {
      status.textContent = 'Copy was blocked. Use Prepare order email instead.';
    }
  });

  const selected = new URLSearchParams(window.location.search).get('product');
  if (products[selected]) productInput.value = selected;
  updateProduct();
})();
