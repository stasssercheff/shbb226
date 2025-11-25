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
    let message = `🧾 <b>${lang === 'en' ? 'KITCHEN CLOSE' : 'КУХНЯ-ЗАКРЫТИЕ'}</b>\n\n`;
    message += `📅 ${lang === 'en' ? 'Date' : 'Дата'}: ${formattedDate}\n`;

    const nameSelect = document.querySelector('select[name="chef"]');
    const selectedChef = nameSelect?.options[nameSelect.selectedIndex];
    let name = '—';
    if (selectedChef) {
      const chefKey = selectedChef.dataset.i18n;
      if (chefKey && translations[chefKey] && translations[chefKey][lang]) {
        name = translations[chefKey][lang];
      } else if (selectedChef.textContent && selectedChef.textContent.trim()) {
        name = selectedChef.textContent.trim();
      } else if (selectedChef.value && selectedChef.value !== '-') {
        name = selectedChef.value;
      }
    }
    message += `${lang === 'en' ? '👨‍🍳 Name' : '👨‍🍳 Имя'}: ${name}\n\n`;

    document.querySelectorAll('.checklist-section, .menu-section').forEach(section => {
      const sectionTitle = section.querySelector('.section-title');
      const titleKey = sectionTitle?.dataset.i18n;
      const title = (titleKey && translations[titleKey]?.[lang]) || sectionTitle?.textContent || '';

      let sectionContent = '';

      // собираем только выбранные блюда/поля
      const dishes = Array.from(section.querySelectorAll('.dish')).filter(dish => {
        const select = dish.querySelector('select.qty');
        return select && selectHasValue(select);
      });

      dishes.forEach((dish, idx) => {
        const label = dish.querySelector('label');
        const labelKey = label?.dataset.i18n;
        const labelText = (labelKey && translations[labelKey]?.[lang]) || (label?.textContent || '').trim() || '—';
        sectionContent += `${idx + 1}. ${labelText}\n`;
      });

      const commentField = section.querySelector('textarea.comment');
      if (commentField && commentField.value.trim()) {
        sectionContent += `💬 ${lang === 'en' ? 'Comment' : 'Комментарий'}: ${commentField.value.trim()}\n`;
      }

      if (sectionContent.trim()) {
        // если в секции есть заголовок — печатаем его без эмодзи и без жирного тега (чтобы Telegram отображал аккуратно)
        message += `${title}\n${sectionContent}\n`;
      }
    });

    return message;
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
