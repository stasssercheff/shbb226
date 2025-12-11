// script-fixed.js — resilient Kitchen Close / Order script
// *** ВАЖНО: этот файл НЕ объявляет `let translations` глобально, чтобы не конфликтовать с lang.js ***

// === Навигация ===
window.goHome = function () {
  window.location.href = "https://stasssercheff.github.io/shbb125/";
};

window.goBack = function () {
  // простая относительная ссылка назад
  window.location.href = "../index.html";
};

// === Утилиты для доступа к переводам (не создаём глобальную переменную translations) ===
const _getTranslations = () => window.translations || {};

async function _ensureTranslationsLoaded() {
  // если lang.js уже положил словарь в window.translations — используем
  if (window.translations && Object.keys(window.translations).length) return;

  const candidates = [
    '/shbb/lang.json', // абсолютный путь к корню проекта — самый надёжный
    'lang.json',
    './lang.json',
    '../lang.json',
    '../../lang.json',
    '../../../lang.json',
    '../../../../lang.json'
  ];

  for (const p of candidates) {
    try {
      const resp = await fetch(p);
      if (!resp.ok) continue;
      const json = await resp.json();
      if (json && Object.keys(json).length) {
        // кладём в глобальную область, чтобы другие скрипты могли пользоваться
        window.translations = json;
        return;
      }
    } catch (e) {
      // silent — пробуем следующий путь
    }
  }

  // если ничего не найдено — оставляем window.translations как пустой объект
  window.translations = window.translations || {};
}

// === Переключение языка ===
function switchLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('lang', lang);
  const translations = _getTranslations();

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key && translations[key] && translations[key][lang]) {
      if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && el.hasAttribute('placeholder')) {
        el.setAttribute('placeholder', translations[key][lang]);
      } else {
        el.textContent = translations[key][lang];
      }
    }
  });

  // Обновляем опции select
  document.querySelectorAll('select').forEach(select => {
    Array.from(select.options).forEach(option => {
      const key = option.dataset.i18n;
      if (key && translations[key] && translations[key][lang]) {
        option.textContent = translations[key][lang];
      }
      if (option.value === '') option.textContent = '—';
    });
  });
}

// === Сохранение/восстановление формы ===
function saveFormData() {
  const data = {};
  document.querySelectorAll('select').forEach(select => {
    data[select.name || select.id] = select.value;
  });
  document.querySelectorAll('textarea.comment').forEach(textarea => {
    data[textarea.name || textarea.id] = textarea.value;
  });
  localStorage.setItem('formData', JSON.stringify(data));
}

function restoreFormData() {
  const saved = localStorage.getItem('formData');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    document.querySelectorAll('select').forEach(select => {
      const key = select.name || select.id;
      if (data[key] !== undefined) select.value = data[key];
    });
    document.querySelectorAll('textarea.comment').forEach(textarea => {
      const key = textarea.name || textarea.id;
      if (data[key] !== undefined) textarea.value = data[key];
    });
  } catch (e) {
    console.warn('restoreFormData: JSON parse error', e);
  }
}

// === Помощник: считать значение select как выбранное только если не пустое и не "-" ===
function selectHasValue(select) {
  if (!select) return false;
  const val = select.value;
  return val !== '' && val !== '-' && val !== null && typeof val !== 'undefined';
}

// === DOMContentLoaded ===
document.addEventListener('DOMContentLoaded', async () => {
  // сначала гарантируем загрузку переводов — но не падаем если их нет
  await _ensureTranslationsLoaded();

  const lang = localStorage.getItem('lang') || 'ru';

  // Пустая опция select.qty (если у select нет опции с value === "")
  document.querySelectorAll('select.qty').forEach(select => {
    const hasEmpty = Array.from(select.options).some(opt => opt.value === '');
    if (!hasEmpty) {
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.dataset.i18n = 'empty';
      emptyOption.textContent = '—';
      emptyOption.selected = true;
      select.insertBefore(emptyOption, select.firstChild);
    }
  });

  restoreFormData();
  switchLanguage(lang);

  // Дата (формат DD/MM)
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const formattedDate = `${day}/${month}`;
  const dateDiv = document.getElementById('current-date');
  if (dateDiv) dateDiv.textContent = formattedDate;

  // Сохраняем при изменении
  document.querySelectorAll('select, textarea.comment').forEach(el => {
    el.addEventListener('input', saveFormData);
  });

  // === Формирование сообщения ===
 const buildMessage = lang => {
  const translations = _getTranslations();
  let msg = `🧾 <b>${lang === 'en' ? 'KITCHEN CLOSE' : 'КУХНЯ-ЗАКРЫТИЕ'}</b>\n\n`;
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

  // === Кнопка отправки (в Telegram) ===
  const button = document.getElementById('sendToTelegram');
  if (!button) {
    console.warn('Кнопка #sendToTelegram не найдена');
    return;
  }

  button.addEventListener('click', async () => {
    console.log('Нажата кнопка отправки (Kitchen Close)');
    const chat_id = '-1002393080811';
    const worker_url = 'https://shbb1.stassser.workers.dev/';

    const sendMessage = msg => fetch(worker_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: msg })
    }).then(res => res.json());

    const sendAllParts = async text => {
      let start = 0;
      while (start < text.length) {
        const chunk = text.slice(start, start + 4000);
        await sendMessage(chunk);
        start += 4000;
      }
    };

    try {
      const langs = window.sendLangs && Array.isArray(window.sendLangs) ? window.sendLangs : ['ru'];
      for (const l of langs) {
        const msg = buildMessage(l);
        await sendAllParts(msg);
      }

      alert('✅ ОТПРАВЛЕНО');
      localStorage.clear();
      document.querySelectorAll('select').forEach(s => s.value = '');
      document.querySelectorAll('textarea.comment').forEach(t => t.value = '');
    } catch (err) {
      alert('❌ Ошибка при отправке: ' + (err?.message || err));
      console.error(err);
    }
  });

  console.log('Kitchen Close: init finished');
});
