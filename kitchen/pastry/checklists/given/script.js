// script.js — обновлённая версия
// Основано на старом скрипте + логике из второго примера.
// Важно: не менял chat_id, worker_url и accessKey (как просил).

// ==== Вспомогательные навигационные функции ====
function goHome() {
  // Определяем базовый путь (первый уровень после домена)
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const basePath = pathParts.length > 0 ? `/${pathParts[0]}/` : "/";
  
  // Переход в корень проекта (где index.html)
  window.location.href = `${window.location.origin}${basePath}index.html`;
}


function goBack() {
  // более аккуратно поднимаемся по пути, как во второй версии
  const currentPath = window.location.pathname;
  const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
  const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
  window.location.href = upperPath + "/index.html";
}

// ==== Утилиты переводов и получения текста по ключам ====

/*
  Предполагается, что где-то (lang.js) у тебя определён объект `translations`.
  Формат: translations[key][lang] => строка
  Пример: translations["cheesecake"]["ru"] => "Чизкейк"
*/

// Получить перевод по ключу и языку с запасным вариантом
function t(key, lang, fallback = "—") {
  try {
    if (!key) return fallback;
    if (window.translations && window.translations[key] && window.translations[key][lang]) {
      return window.translations[key][lang];
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

// ==== Переключение языка в UI ====
function switchLanguage(lang) {
  document.documentElement.lang = lang;
  // сохраняем выбор языка для UI (не для отправки) — но не обязательно
  localStorage.setItem("lang", lang);

  // Обновляем все элементы с data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (!key) return;

    const translated = t(key, lang, null);
    if (translated !== null && translated !== "—") {
      // Особые теги: placeholder для input/textarea
      if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", translated);
      } else {
        el.textContent = translated;
      }
    } else {
      // если перевода нет — не меняем текст (оставляем содержимое)
      // но для пустой опции ставим "—"
      if (key === "empty") {
        el.textContent = "—";
      }
    }
  });

  // Обновим текст опций в <select>, если у option есть data-i18n
  document.querySelectorAll("select").forEach(select => {
    Array.from(select.options).forEach(option => {
      const optKey = option.dataset.i18n || option.dataset.i18nKey || option.dataset.i18nkey;
      if (optKey) {
        const translated = t(optKey, lang);
        if (translated && translated !== "—") option.textContent = translated;
      } else {
        // если пустое значение — ставим "—"
        if (option.value === "") option.textContent = "—";
        // численные опции (1..12) оставляем как есть
      }
    });
  });
}

// ==== Вставка пустой опции (если её нет) для select.qty ====
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

// ==== Сбор текущей даты (dd/mm) ====
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

// ==== Построение сообщения для отправки ====
function buildMessageForLang(lang) {
  // formattedDate для шапки
  const formattedDate = getFormattedDateDM();
  // Начнём с типа чек-листа — он должен быть только словом (локализованным)
  const checklistSelect = document.querySelector('select[name="checklist_type"], select#checklistType');
  let checklistKey = null;
  if (checklistSelect) checklistKey = checklistSelect.value || null;

  // Получаем перевод типа (если есть) — перевод берём из translations под ключом checklistKey
  let checklistWord = "—";
  if (checklistKey) {
    // предполагаем, что translations использует те же ключи: "leftovers", "wasted", "given"
    checklistWord = t(checklistKey, lang, "—");
  }

  // Заголовок — в старом стиле делали жирным и с эмодзи — сохраним формат, но сначала слово типа
  let message = "";

  // Если есть checklist word — ставим её одной строкой (как просил: только слово)
  if (checklistWord && checklistWord !== "—") {
    message += `${checklistWord}\n\n`;
  } else {
    // если не выбран — можно указать дефолт (пусто)
    message += `—\n\n`;
  }

  // Дата и имя шефа
  message += `📅 ${lang === "en" ? "Date" : "Дата"}: ${formattedDate}\n`;

  const nameSelect = document.querySelector('select[name="chef"], select#employeeSelect');
  const selectedChef = nameSelect?.options[nameSelect.selectedIndex];
  let chefName = "—";
  if (selectedChef) {
    // если у option есть data-i18n (ключ перевода) — используем translations
    const chefKey = selectedChef.dataset.i18n;
    if (chefKey) {
      chefName = t(chefKey, lang, selectedChef.textContent || "—");
    } else {
      chefName = selectedChef.textContent || "—";
    }
  }
  message += `${lang === "en" ? "👨‍🍳 Name" : "👨‍🍳 Имя"}: ${chefName}\n\n`;

  // Проходим по секциям меню (если они есть). HTML у тебя простой — много <div class="dish"> внутри
  // но в случае, если используются .menu-section, пробуем по ним; иначе — возьмём все .dish на странице.
  const sections = document.querySelectorAll(".menu-section");
  if (sections.length === 0) {
    // Собираем просто все блюда по порядку
    const dishes = Array.from(document.querySelectorAll(".dish"));
    if (dishes.length > 0) {
      let sectionContent = "";
      dishes.forEach(dish => {
        const select = dish.querySelector("select.qty");
        if (select && select.value) {
          // Берём label key
          const label = dish.querySelector("label.check-label, label");
          const labelKey = label?.dataset?.i18n;
          const labelText = labelKey ? t(labelKey, lang, label.textContent || "—") : (label?.textContent || "—");

          // значение — обычно числовое (1..12)
          const value = select.value;
          sectionContent += `• ${labelText}: ${value}\n`;
        }

        // комментарий внутри dish (если есть)
        const commentField = dish.querySelector("textarea.comment");
        if (commentField && commentField.value.trim()) {
          sectionContent += `💬 ${lang === "en" ? "Comment" : "Комментарий"}: ${commentField.value.trim()}\n`;
        }
      });

      if (sectionContent.trim()) {
        // добавляем общий заголовок для блока — можно использовать перевод слова "Десерты" или "checklists"
        const maybeTitleKey = document.querySelector("h1")?.dataset?.i18n || document.querySelector("h1")?.textContent;
        const title = maybeTitleKey ? (t(maybeTitleKey, lang, maybeTitleKey) || maybeTitleKey) : (lang === "en" ? "Items" : "Позиции");
        message += `🔸 ${title}\n` + sectionContent + `\n`;
      }
    }
  } else {
    // Если есть явные секции — обрабатываем их
    sections.forEach(section => {
      const sectionTitleKey = section.querySelector(".section-title")?.dataset?.i18n;
      const sectionTitle = sectionTitleKey ? t(sectionTitleKey, lang, "") : (section.querySelector(".section-title")?.textContent || "");
      let sectionContent = "";

      // собираем блюда с выбранными опциями
      const dishes = Array.from(section.querySelectorAll(".dish")).filter(dish => {
        const select = dish.querySelector("select.qty");
        return select && select.value;
      });

      dishes.forEach((dish, index) => {
        const label = dish.querySelector("label.check-label, label");
        const labelKey = label?.dataset?.i18n;
        const labelText = labelKey ? t(labelKey, lang, label.textContent || "—") : (label?.textContent || "—");
        const select = dish.querySelector("select.qty");
        const value = select?.value || "—";
        sectionContent += `${index + 1}. ${labelText}: ${value}\n`;
      });

      const commentField = section.querySelector("textarea.comment");
      if (commentField && commentField.value.trim()) {
        sectionContent += `💬 ${lang === "en" ? "Comment" : "Комментарий"}: ${commentField.value.trim()}\n`;
      }

      if (sectionContent.trim()) {
        message += `${sectionTitle}\n${sectionContent}\n`;
      }
    });
  }

  return message;
}

// ==== Отправка сообщений (Telegram / email) ====
const CHAT_ID = "-1003076643701"; // НЕ менял — как в старом скрипте
const WORKER_URL = "https://shbb1.stassser.workers.dev/"; // НЕ менял
const ACCESS_KEY = "14d92358-9b7a-4e16-b2a7-35e9ed71de43"; // НЕ менял

async function sendMessageToWorker(text) {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
  return res.json();
}

async function sendEmailViaWeb3Forms(message, subjectFallback = "SHBB MESSAGE") {
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_key: ACCESS_KEY,
        subject: subjectFallback,
        from_name: "SHBB",
        reply_to: "no-reply@shbb.com",
        message
      })
    });
    return res.json();
  } catch (err) {
    throw err;
  }
}

async function sendAllParts(text) {
  let start = 0;
  while (start < text.length) {
    const chunk = text.slice(start, start + 4000);
    await sendMessageToWorker(chunk);
    // если нужно отправлять email — можно раскомментировать
    // await sendEmailViaWeb3Forms(chunk, "SHBB MESSAGE");
    start += 4000;
  }
}

// ==== Инициализация страницы ====
document.addEventListener("DOMContentLoaded", () => {
  // языки для отправки берём из sendConfig (window.sendLangs)
  const defaultUILang = localStorage.getItem("lang") || document.documentElement.lang || "ru";

  // Гарантируем, что пустая опция есть для select.qty
  ensureEmptyOptionForQty();

  // Восстановление данных формы
  restoreFormData();

  // Устанавливаем UI язык
  switchLanguage(defaultUILang);

  // Устанавливаем дату в header (если есть)
  setCurrentDateFull();

  // Ставим отлов сохранения при изменениях
  document.querySelectorAll("select, textarea.comment").forEach(el => {
    el.addEventListener("input", saveFormData);
  });

  // Кнопка отправки
  const button = document.getElementById("sendToTelegram");
  if (!button) {
    console.warn("Кнопка отправки не найдена: #sendToTelegram");
    return;
  }

  button.addEventListener("click", async () => {
    try {
      // Берём языки из sendConfig.js
      const langsToSend = Array.isArray(window.sendLangs) && window.sendLangs.length ? window.sendLangs : ["ru"];

      for (const lang of langsToSend) {
        // Для каждого языка формируем сообщение и отправляем
        const msg = buildMessageForLang(lang);
        await sendAllParts(msg);
      }

      alert("✅ ОТПРАВЛЕНО");
      localStorage.clear();

      // очищаем форму
      document.querySelectorAll("select").forEach(s => s.value = "");
      document.querySelectorAll("textarea.comment").forEach(t => t.value = "");
    } catch (err) {
      console.error("Ошибка отправки:", err);
      alert("❌ Ошибка при отправке: " + (err.message || err));
    }
  });
});
