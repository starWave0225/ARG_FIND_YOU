(() => {
  const status = document.getElementById('status');
  const form = document.getElementById('gate');
  const button = form.querySelector('button');
  const endpoint = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8787' : window.ARG_CLOUD_ENDPOINT;
  async function request(options) {
    const response = await fetch(`${endpoint}/v1/group-gate`, { ...options, cache: 'no-store' });
    const body = await response.json();
    return { response, body };
  }
  request().then(({ response, body }) => {
    if (!response.ok || !body.ready) { status.textContent = '入口暂未开放'; return; }
    document.getElementById('question').textContent = body.question;
    status.textContent = '请完成联系核验';
    form.hidden = false;
  }).catch(() => { status.textContent = '暂无法连接，请稍后重试'; });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    button.disabled = true;
    status.textContent = '正在核验……';
    try {
      const { response, body } = await request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer: form.elements.answer.value }) });
      if (!response.ok || !body.ok) {
        status.textContent = body.error === 'verification_failed' ? '核验未通过' : '暂无法核验，请稍后重试';
        return;
      }
      if (!/^https:\/\//.test(body.qrUrl)) throw new Error('invalid_qr');
      const qr = document.getElementById('qr');
      qr.onerror = () => { status.textContent = '二维码暂无法加载，请稍后重试'; };
      qr.src = body.qrUrl;
      form.reset(); form.hidden = true; status.textContent = '';
      document.getElementById('access').hidden = false;
    } catch { status.textContent = '暂无法连接，请稍后重试'; }
    finally { button.disabled = false; }
  });
})();
