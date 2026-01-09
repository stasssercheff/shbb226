// === Навигация ===
function goHome() {
  // Переходим в корень сайта
  location.href = location.origin + location.pathname.split('/')[1] + '/';
}

  // На уровень выше (одну папку вверх)
  function goBack() {
      const currentPath = window.location.pathname;
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
      const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
      window.location.href = upperPath + "/index.html";
  }

// === Переключение языка с использованием window.translations ===
function _getTranslations() { return window.translations || {}; }

async function _ensureTranslationsLoaded() {
  if (window.translations && Object.keys(window.translations).length) return;
  const paths = [
    '/shbb/lang.json',
    'lang.json',
    './lang.json',
    '../lang.json',
    '../../lang.json',
    '../../../lang.json',
    '../../../../lang.json'
  ];
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (!res.ok) continue;
      const json = await res.json();
      if (json && Object.keys(json).length) { window.translations = json; return; }
    } catch(e) {}
  }
  window.translations = window.translations || {};
}

function switchLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
  const translations = _getTranslations();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (!key) return;
    const txt = translations[key]?.[lang];
    if (!txt) return;
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
      el.setAttribute('placeholder', txt);
    } else { el.textContent = txt; }
  });

  document.querySelectorAll('select option').forEach(option => {
    const key = option.dataset.i18n;
    if (key && translations[key]?.[lang]) option.textContent = translations[key][lang];
    if (option.value === '') option.textContent = '—';
  });
}

// === Сохранение/восстановление формы ===
function saveFormData() {
  const data = {};
  document.querySelectorAll('select').forEach(s => { data[s.name || s.id] = s.value; });
  document.querySelectorAll('textarea.comment').forEach(t => { data[t.name || t.id] = t.value; });
  localStorage.setItem('formData', JSON.stringify(data));
}

function restoreFormData() {
  const saved = localStorage.getItem('formData');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    document.querySelectorAll('select').forEach(s => {
      const key = s.name || s.id;
      if (data[key] !== undefined) s.value = data[key];
    });
    document.querySelectorAll('textarea.comment').forEach(t => {
      const key = t.name || t.id;
      if (data[key] !== undefined) t.value = data[key];
    });
  } catch(e) { console.warn('restoreFormData: JSON parse error', e); }
}

function selectHasValue(select) {
  return select && select.value !== '' && select.value !== '-' && select.value != null;
}

// === DOMContentLoaded ===
document.addEventListener('DOMContentLoaded', async () => {
  await _ensureTranslationsLoaded();
  const lang = localStorage.getItem('lang') || 'ru';

  // Пустая опция select.qty
  document.querySelectorAll('select.qty').forEach(select => {
    if (!Array.from(select.options).some(o => o.value === '')) {
      const empty = document.createElement('option');
      empty.value = '';
      empty.dataset.i18n = 'empty';
      empty.textContent = '—';
      empty.selected = true;
      select.insertBefore(empty, select.firstChild);
    }
  });

  restoreFormData();
  switchLanguage(lang);

  // Дата
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const formattedDate = `${day}/${month}`;
  const dateDiv = document.getElementById('current-date');
  if (dateDiv) dateDiv.textContent = formattedDate;

  document.querySelectorAll('select, textarea.comment').forEach(el => el.addEventListener('input', saveFormData));

  // === Формирование сообщения ===
 const buildMessage = lang => {
  const translations = _getTranslations();
  let msg = `🧾 <b>${lang === 'en' ? 'DRY STORAGE CHECKLIST' : 'ЧEКЛИСТ СУХОЙ СКЛАД'}</b>\n\n`;
  msg += `📅 ${lang === 'en' ? 'Date' : 'Дата'}: ${formattedDate}\n`;

  // Имя шефа
  const chefSelect = document.querySelector('select[name="chef"]');
  let name = '—';
  if (chefSelect) {
    const selected = chefSelect.options[chefSelect.selectedIndex];
    const key = selected.dataset.i18n;
    name = (key && translations[key]?.[lang]) || selected.textContent.trim() || selected.value || '—';
  }
  msg += `${lang === 'en' ? '👨‍🍳 Name' : '👨‍🍳 Имя'}: ${name}\n\n`;

  // Продукты и числовые поля
  document.querySelectorAll('.dish').forEach((dish, idx) => {
    const label = dish.querySelector('label');
    if (!label) return;
    const key = label.dataset.i18n;
    const labelText = (key && translations[key]?.[lang]) || label.textContent.trim() || '—';

    let value = '';
    const select = dish.querySelector('select.qty');
    const input = dish.querySelector('input[type="number"].qty');

    if (select && selectHasValue(select)) value = select.value;
    else if (input && input.value.trim() !== '') value = input.value;

    if (value) {
      msg += `${idx + 1}. ${labelText}: ${value}\n`;
    }
  });

  // Комментарий
  const comment = document.querySelector('textarea.comment');
  if (comment && comment.value.trim()) {
    msg += `\n💬 ${lang === 'en' ? 'Comment' : 'Комментарий'}: ${comment.value.trim()}\n`;
  }

  return msg;
};

  // === Кнопка отправки ===
  const btn = document.getElementById('sendToTelegram');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const chat_id = '-1002393080811';
    const worker_url = 'https://shbb1.stassser.workers.dev/';

    const sendMessage = msg => fetch(worker_url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({chat_id, text: msg})
    }).then(r => r.json());

    const sendAllParts = async text => {
      let start = 0;
      while (start < text.length) {
        const chunk = text.slice(start, start + 4000);
        await sendMessage(chunk);
        start += 4000;
      }
    };

    try {
      for (const l of ['ru', 'en']) {
        const msg = buildMessage(l);
        await sendAllParts(msg);
      }
      alert('✅ ОТПРАВЛЕНО');
      localStorage.clear();
      document.querySelectorAll('select').forEach(s => s.value = '');
      document.querySelectorAll('textarea.comment').forEach(t => t.value = '');
    } catch(err) {
      alert('❌ Ошибка при отправке: ' + (err.message || err));
      console.error(err);
    }
  });

});
