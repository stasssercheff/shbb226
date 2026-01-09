function goBack() {
  // 🔙 Переход на уровень выше (Pastry)
  window.location.href = "https://stasssercheff.github.io/shbb125/kitchen/pastry/index.html";
}

function goHome() {
  // Переходим в корень сайта
  location.href = location.origin + location.pathname.split('/')[1] + '/';
}



// === Загрузка словаря из корня сайта ===
document.addEventListener("DOMContentLoaded", () => {
  const langPath = `${window.location.origin}/shbb/lang.json`;
  console.log("🌐 Загрузка словаря из:", langPath);

  fetch(langPath)
    .then(res => {
      if (!res.ok) throw new Error(`Ошибка ${res.status}`);
      return res.json();
    })
    .then(data => {
      translations = data;
      console.log("✅ Словарь загружен:", Object.keys(translations).length, "ключей");
      initPage();
    })
    .catch(err => {
      console.error("❌ Ошибка загрузки словаря:", err);
      initPage(); // всё равно запустим страницу
    });
});

// === Инициализация страницы ===
function initPage() {
  const lang = localStorage.getItem("lang") || "ru";

  // Дата
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, "0");
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const y = today.getFullYear();
    dateEl.textContent = `${d}.${m}.${y}`;
  }

  restoreFormData();
  switchLanguage(lang);

  // Слушатели
  document.querySelectorAll("select, textarea.comment").forEach(el => {
    el.addEventListener("input", saveFormData);
  });

  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  });

  setupSendButton();
}

// === Переключение языка ===
function switchLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key] && translations[key][lang]) {
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        if (el.hasAttribute("placeholder")) {
          el.setAttribute("placeholder", translations[key][lang]);
        }
      } else {
        el.textContent = translations[key][lang];
      }
    }
  });

  // Обновляем опции select
  document.querySelectorAll("select option").forEach(opt => {
    const key = opt.dataset.i18n;
    if (key && translations[key] && translations[key][lang]) {
      opt.textContent = translations[key][lang];
    }
    if (opt.value === "") opt.textContent = "—";
  });

  console.log("🌍 Язык переключён:", lang);
}

// === Сохранение формы ===
function saveFormData() {
  const data = {};
  document.querySelectorAll("select, textarea.comment").forEach(el => {
    data[el.name || el.id] = el.value;
  });
  localStorage.setItem("formData", JSON.stringify(data));
}

// === Восстановление формы ===
function restoreFormData() {
  const saved = localStorage.getItem("formData");
  if (!saved) return;
  const data = JSON.parse(saved);
  document.querySelectorAll("select, textarea.comment").forEach(el => {
    if (data[el.name || el.id] !== undefined) {
      el.value = data[el.name || el.id];
    }
  });
}

// === Отправка ===
function setupSendButton() {
  const button = document.getElementById("sendToTelegram");
  if (!button) return;

  button.addEventListener("click", async () => {
    const chat_id = "-1003076643701";
    const worker_url = "https://shbb1.stassser.workers.dev/";
    const accessKey = "14d92358-9b7a-4e16-b2a7-35e9ed71de43";

    const sendMessage = msg => fetch(worker_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text: msg })
    }).then(r => r.json());

    const sendEmail = msg => fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: accessKey,
        subject: "ЗАКАЗ ПРОДУКТОВ",
        from_name: "SHBB PASTRY",
        reply_to: "no-reply@shbb.com",
        message: msg
      })
    }).then(r => r.json());

    const sendAllParts = async text => {
      let start = 0;
      while (start < text.length) {
        const chunk = text.slice(start, start + 4000);
        await sendMessage(chunk);
       // await sendEmail(chunk); //
        start += 4000;
      }
    };

    const clearForm = () => {
      document.querySelectorAll("select").forEach(s => s.value = "");
      document.querySelectorAll("textarea.comment").forEach(t => t.value = "");
    };

    try {
      // ✅ получаем список языков из sendConfig.js
      const langs = window.sendLangs || ["ru"];
      for (const lang of langs) {
        const msg = buildMessage(lang);
        await sendAllParts(msg);
      }

      alert("✅ ОТПРАВЛЕНО");
      localStorage.clear();
      clearForm();
    } catch (err) {
      alert("❌ Ошибка отправки: " + err.message);
      console.error(err);
    }
  });
}

// === Сборка текста ===
function buildMessage(lang) {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const date = `${day}/${month}`;

  let msg = `🧾 <b>${lang === "en" ? "PRODUCT ORDER" : "ЗАКАЗ ПРОДУКТОВ"}</b>\n\n`;
  msg += `📅 ${lang === "en" ? "Date" : "Дата"}: ${date}\n`;

  const nameSelect = document.querySelector('select[name="chef"]');
  const selected = nameSelect?.options[nameSelect.selectedIndex];
  const name = selected?.dataset.i18n
    ? translations[selected.dataset.i18n]?.[lang]
    : selected?.textContent || "—";
  msg += `${lang === "en" ? "👨‍🍳 Name" : "👨‍🍳 Имя"}: ${name}\n\n`;

  document.querySelectorAll(".menu-section").forEach(section => {
    const titleKey = section.querySelector(".section-title")?.dataset.i18n;
    const title = translations[titleKey]?.[lang] || section.querySelector(".section-title")?.textContent || "";

    let content = "";
    section.querySelectorAll(".dish").forEach(dish => {
      const select = dish.querySelector("select.qty");
      if (!select || !select.value) return;
      const label = dish.querySelector("label");
      const labelText = translations[label?.dataset.i18n]?.[lang] || label?.textContent || "";
      content += `• ${labelText}: ${select.value}\n`;
    });

    const comment = section.querySelector("textarea.comment");
    if (comment && comment.value.trim()) {
      content += `💬 ${lang === "en" ? "Comment" : "Комментарий"}: ${comment.value.trim()}\n`;
    }

    if (content.trim()) msg += `🔸 <b>${title}</b>\n${content}\n`;
  });

  return msg;
}
