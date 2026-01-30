// === script.js ===
document.addEventListener('DOMContentLoaded', () => {
  const chat_id = '-5025734210';
  const worker_url = 'https://shbb1.stassser.workers.dev/';
  const button = document.getElementById('sendBtn');

  if (!button) return;

  const headerDict = {
    title: { 
     "ru": "Стоп-лист",
     "en": "Stop list",
     "vi": "Danh sách tạm ngừng"
    },
    date: { 
      ru: "Дата", 
      en: "Date", 
      vi: "Ngày" 
    },
    comment: { 
      ru: "Комментарий", 
      en: "Comment", 
      vi: "Ghi chú" 
    }
  };

  // На главную
function goHome() {
  location.href = location.origin + '/' + location.pathname.split('/')[1] + '/';
}

  // На уровень выше (одну папку вверх)
  function goBack() {
      const currentPath = window.location.pathname;
      const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
      const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
      window.location.href = upperPath + "/index.html";
  }
    
  // Формируем сообщение на конкретном языке
  const buildMessage = (lang) => {
    const today = new Date();
    const date = `${String(today.getDate()).padStart(2,'0')}/${String(today.getMonth()+1).padStart(2,'0')}`;

    let message = `🧾 <b>${headerDict.title[lang] || headerDict.title.ru}</b>\n\n`;
    message += `📅 ${headerDict.date[lang] || headerDict.date.ru}: ${date}\n`;

    const chefSelect = document.querySelector('select[name="chef"]');
    if (chefSelect) {
      const selectedOption = chefSelect.options[chefSelect.selectedIndex];
      message += `👤 ${selectedOption.textContent.trim()}\n\n`;
    }

// === 🆕 Добавляем поле "На когда" ===
const actionSelect = document.querySelector('select[name="actionType"]');
if (actionSelect) {
  const selectedAction = actionSelect.options[actionSelect.selectedIndex];
  const key = selectedAction.dataset.i18n;
  const translatedAction =
    key && translations && translations[key] && translations[key][lang]
      ? translations[key][lang]
      : selectedAction.textContent.trim();
  message += `📌 ${translatedAction}\n\n`;
}

   const checklist = document.querySelectorAll('#checklist input[type="checkbox"]');
let selectedItems = [];
let counter = 1; // 🆕 счётчик для нумерации
checklist.forEach((item) => {
  if (item.checked) {
    const label = item.closest('.checklist-item')?.querySelector('label');
    if (label) {
      const key = label.dataset.i18n;
      const translated = key && translations && translations[key] && translations[key][lang]
        ? translations[key][lang]
        : label.textContent.trim();
      selectedItems.push(`${counter}. ${translated}`);
      counter++; // увеличиваем только когда реально добавили
    }
  }
});


    if (selectedItems.length > 0) {
      message += selectedItems.join('\n');
    }

    // === 🆕 Добавляем комментарий, если есть ===
    const commentField = document.querySelector('textarea.comment');
    if (commentField && commentField.value.trim() !== "") {
      message += `\n\n💬 ${headerDict.comment[lang] || headerDict.comment.ru}:\n${commentField.value.trim()}`;
    }

    return message;
  };

  const sendMessage = async (msg) => {
    const res = await fetch(worker_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text: msg, parse_mode: "HTML" })
    });
    return res.json();
  };

  button.addEventListener('click', async () => {
    try {
      const currentProfile = getCurrentProfile();
      const sendLangs = getSendLanguages(currentProfile);
      console.log("🌍 Актуальные языки отправки:", sendLangs);

      if (!sendLangs.length) return alert('⚠ Для текущего профиля нет выбранных языков');

      let sentCount = 0;
      for (const lang of sendLangs) {
        const msg = buildMessage(lang);
        if (!msg) continue;
        await sendMessage(msg);
        sentCount++;
      }

      if (sentCount > 0) {
        alert(`✅ Отправлено сообщений: ${sentCount} (${sendLangs.join(", ").toUpperCase()})`);
        document.querySelectorAll('#checklist input[type="checkbox"]').forEach(cb => cb.checked = false);
        const commentField = document.querySelector('textarea.comment');
        if (commentField) commentField.value = ""; // 🧹 чистим комментарий
      } else {
        alert('⚠ Нет элементов для отправки');
      }
    } catch (err) {
      console.error(err);
      alert(`❌ Ошибка: ${err.message}`);
    }
  });
});
