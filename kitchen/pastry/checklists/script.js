// script.js — рабочая версия для sendLangs и корректной сборки сообщений

// ==== Вспомогательные функции ====
function goHome() {
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const basePath = pathParts.length > 0 ? `/${pathParts[0]}/` : "/";
  window.location.href = `${window.location.origin}${basePath}index.html`;
}

function goBack() {
  const currentPath = window.location.pathname;
  const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
  const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
  window.location.href = upperPath + "/index.html";
}

// ==== Переводы ====
function getTranslationsObject() {
  if (window && window.translations && Object.keys(window.translations).length > 0) {
    return window.translations;
  }
  if (typeof translations !== "undefined" && translations && Object.keys(translations).length > 0) {
    return translations;
  }
  return null;
}

function t(key, lang, fallback = "—") {
  try {
    if (!key) return fallback;
    const dict = getTranslationsObject();
    if (dict && dict[key] && dict[key][lang]) {
      return dict[key][lang];
    }
    return fallback;
  } catch (e) {
    return fallback;
  }
}

// ==== Сохранение / восстановление формы ====
function saveFormData() {
  const data = {};
  document.querySelectorAll("select").forEach(select => {
    data[select.name || select.id] = select.value;
  });
  document.querySelectorAll("textarea.comment").forEach(textarea => {
    data[textarea.name || textarea.id] = textarea.value;
  });
  localStorage.setItem("formData", JSON.stringify(data));
}

function restoreFormData() {
  const saved = localStorage.getItem("formData");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    document.querySelectorAll("select").forEach(select => {
      const key = select.name || select.id;
      if (data[key] !== undefined) select.value = data[key];
    });
    document.querySelectorAll("textarea.comment").forEach(textarea => {
      const key = textarea.name || textarea.id;
      if (data[key] !== undefined) textarea.value = data[key];
    });
  } catch (e) {
    console.warn("restoreFormData: parse error", e);
  }
}

// ==== Переключение языка UI (для placeholder / textContent) ====
function switchLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (!key) return;
    const translated = t(key, lang, null);
    if (translated !== null && translated !== "—") {
      if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", translated);
      } else {
        el.textContent = translated;
      }
    } else {
      if (key === "empty") el.textContent = "—";
    }
  });

  // update select options
  document.querySelectorAll("select").forEach(select => {
    Array.from(select.options).forEach(option => {
      const optKey = option.dataset.i18n || option.dataset.i18nKey || option.dataset.i18nkey;
      if (optKey) {
        const translated = t(optKey, lang);
        if (translated && translated !== "—") option.textContent = translated;
      } else if (option.value === "") {
        option.textContent = "—";
      }
    });
  });
}

// ==== Пустая опция для select.qty ====
function ensureEmptyOptionForQty() {
  document.querySelectorAll("select.qty").forEach(select => {
    const hasEmpty = Array.from(select.options).some(opt => opt.value === "");
    if (!hasEmpty) {
      const emptyOption = document.createElement("option");
      emptyOption.value = "";
      emptyOption.dataset.i18n = "empty";
      emptyOption.textContent = "—";
      emptyOption.selected = true;
      select.insertBefore(emptyOption, select.firstChild);
    }
  });
}

// ==== Дата ====
function getFormattedDateDM() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function setCurrentDateFull() {
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    dateEl.textContent = `${day}.${month}.${year}`;
  }
}

// ==== Сбор сообщения ====
function buildMessageForLang(lang) {
  const formattedDate = getFormattedDateDM();

  // Дата + Имя
  const nameSelect = document.querySelector('select[name="chef"], select#employeeSelect');
  const selectedChef = nameSelect?.options[nameSelect.selectedIndex];
  let chefName = selectedChef ? (selectedChef.dataset.i18n ? t(selectedChef.dataset.i18n, lang, selectedChef.textContent) : selectedChef.textContent) : "—";

  let message = "";
  message += `📅 ${t("date_label", lang, lang === "en" ? "Date" : "Дата")}: ${formattedDate}\n`;
  message += `${t("chef_label", lang, lang === "en" ? "Name" : "Имя")}: ${chefName}\n`;

  // Статус — например, выставлено
  message += `${t("status_set", lang, lang === "en" ? "Set" : "Выставлено")}\n\n`;

  // Позиции
  const dishes = Array.from(document.querySelectorAll(".dish")).filter(dish => {
    const select = dish.querySelector("select.qty");
    return select && select.value;
  });

  dishes.forEach(dish => {
    const label = dish.querySelector("label.check-label, label");
    const labelText = label?.dataset?.i18n ? t(label.dataset.i18n, lang, label.textContent) : label?.textContent || "—";
    const select = dish.querySelector("select.qty");
    const value = select?.value || "—";
    message += `• ${labelText}: ${value}\n`;

    const commentField = dish.querySelector("textarea.comment");
    if (commentField && commentField.value.trim()) {
      message += `💬 ${t("comment_label", lang, lang === "en" ? "Comment" : "Комментарий")}: ${commentField.value.trim()}\n`;
    }
  });

  return message.trim();
}

// ==== Отправка ====
const CHAT_ID = "-1003076643701";
const WORKER_URL = "https://shbb1.stassser.workers.dev/";
const ACCESS_KEY = "14d92358-9b7a-4e16-b2a7-35e9ed71de43";

async function sendMessageToWorker(text) {
  await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
}

async function sendAllParts(text) {
  let start = 0;
  while (start < text.length) {
    const chunk = text.slice(start, start + 4000);
    await sendMessageToWorker(chunk);
    start += 4000;
  }
}

// ==== Инициализация страницы ====
function initPage() {
  ensureEmptyOptionForQty();
  restoreFormData();
  setCurrentDateFull();

  // Кнопка отправки
  const button = document.getElementById("sendToTelegram");
  if (!button) {
    console.warn("Кнопка отправки не найдена: #sendToTelegram");
    return;
  }

  button.addEventListener("click", async () => {
    try {
      const langsToSend = Array.isArray(window.sendLangs) && window.sendLangs.length ? window.sendLangs : ["ru"];
      for (const lang of langsToSend) {
        const msg = buildMessageForLang(lang);
        await sendAllParts(msg);
      }
      alert("✅ ОТПРАВЛЕНО");
      localStorage.clear();
      document.querySelectorAll("select").forEach(s => s.value = "");
      document.querySelectorAll("textarea.comment").forEach(t => t.value = "");
    } catch (err) {
      console.error("Ошибка отправки:", err);
      alert("❌ Ошибка при отправке: " + (err.message || err));
    }
  });

  // События формы
  document.querySelectorAll("select, textarea.comment").forEach(el => {
    el.addEventListener("input", saveFormData);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const waitForTranslations = setInterval(() => {
    const dict = getTranslationsObject();
    if (dict && Object.keys(dict).length > 0) {
      clearInterval(waitForTranslations);
      initPage();
    }
  }, 100);

  // Если уже есть
  const dictNow = getTranslationsObject();
  if (dictNow && Object.keys(dictNow).length > 0) {
    clearInterval(waitForTranslations);
    initPage();
  }
});
