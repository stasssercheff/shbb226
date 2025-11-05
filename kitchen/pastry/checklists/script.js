// script.js — рабочая версия (без дублей, общий комментарий)

// На главную
function goHome() {
    location.href = "http://stasssercheff.github.io/shbb25/";
}

// На уровень выше (одну папку вверх)
function goBack() {
    const currentPath = window.location.pathname;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
    window.location.href = upperPath + "/index.html";
}

// ==== Переводы ====
function getTranslationsObject() {
  if (window?.translations && Object.keys(window.translations).length > 0) return window.translations;
  if (typeof translations !== "undefined" && translations && Object.keys(translations).length > 0) return translations;
  return null;
}

function t(key, lang, fallback = "—") {
  try {
    const dict = getTranslationsObject();
    if (!dict) return fallback;
    return (dict[key] && dict[key][lang]) ? dict[key][lang] : fallback;
  } catch {
    return fallback;
  }
}

// ==== Сохранение / восстановление формы ====
function saveFormData() {
  const data = {};
  document.querySelectorAll("select, textarea.comment").forEach(el => {
    data[el.name || el.id] = el.value;
  });
  localStorage.setItem("formData", JSON.stringify(data));
}

function restoreFormData() {
  const raw = localStorage.getItem("formData");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    document.querySelectorAll("select, textarea.comment").forEach(el => {
      const key = el.name || el.id;
      if (data[key] !== undefined) el.value = data[key];
    });
  } catch (e) {
    console.warn("restoreFormData parse error", e);
  }
}

// ==== UI язык ====
function switchLanguage(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem("lang", lang);
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (!key) return;
    const translated = t(key, lang, null);
    if (translated && translated !== "—") {
      if ((el.tagName === "INPUT" || el.tagName === "TEXTAREA") && el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", translated);
      } else el.textContent = translated;
    } else if (key === "empty") el.textContent = "—";
  });

  document.querySelectorAll("select option").forEach(opt => {
    const key = opt.dataset.i18n || opt.dataset.i18nKey || opt.dataset.i18nkey;
    if (key) {
      const tr = t(key, lang);
      if (tr && tr !== "—") opt.textContent = tr;
    } else if (opt.value === "") opt.textContent = "—";
  });
}

// ==== Пустая опция ====
function ensureEmptyOptionForQty() {
  document.querySelectorAll("select.qty").forEach(sel => {
    const hasEmpty = Array.from(sel.options).some(o => o.value === "");
    if (!hasEmpty) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.dataset.i18n = "empty";
      opt.textContent = "—";
      opt.selected = true;
      sel.insertBefore(opt, sel.firstChild);
    }
  });
}

// ==== Дата ====
function getFormattedDateDM() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
}
function setCurrentDateFull() {
  const el = document.getElementById("current-date");
  if (el) {
    const d = new Date();
    el.textContent = `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
  }
}

// ==== Сообщение ====
function buildMessageForLang(lang) {
  const formattedDate = getFormattedDateDM();

  // Шапка
  const nameSel = document.querySelector('select[name="chef"], select#employeeSelect');
  const chefOpt = nameSel?.options[nameSel.selectedIndex];
  const chefName = chefOpt
    ? (chefOpt.dataset.i18n ? t(chefOpt.dataset.i18n, lang, chefOpt.textContent) : chefOpt.textContent)
    : "—";

  const checklistSel = document.querySelector('select[name="checklist_type"], select#checklistType');
  const checklistKey = checklistSel?.value || null;
  const checklistWord = checklistKey ? t(checklistKey, lang, checklistKey) : "";

  let msg = `📅 ${t("date_label", lang, lang === "en" ? "Date" : "Дата")}: ${formattedDate}\n`;
  msg += `${t("chef_label", lang, lang === "en" ? "Name" : "Имя")}: ${chefName}\n`;
  if (checklistWord) msg += `${checklistWord}\n\n`;

  // Позиции (только блюда с label.check-label)
  const dishes = Array.from(document.querySelectorAll(".dish")).filter(d => d.querySelector("label.check-label"));
  dishes.forEach(dish => {
    const sel = dish.querySelector("select.qty");
    if (!sel || !sel.value) return;
    const label = dish.querySelector("label.check-label");
    const labelText = label?.dataset?.i18n ? t(label.dataset.i18n, lang, label.textContent) : label?.textContent || "—";
    msg += `• ${labelText}: ${sel.value}\n`;
  });

  // Общий комментарий (один)
  const comment = document.getElementById("comment_supliers")?.value.trim();
  if (comment) msg += `\n💬 ${t("comment_label", lang, lang === "en" ? "Comment" : "Комментарий")}: ${comment}`;

  return msg.trim();
}

// ==== Отправка ====
const CHAT_ID = "-1003076643701";
const WORKER_URL = "https://shbb1.stassser.workers.dev/";

async function sendMessageToWorker(text) {
  await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT_ID, text })
  });
}

async function sendAllParts(text) {
  for (let i = 0; i < text.length; i += 4000) {
    await sendMessageToWorker(text.slice(i, i + 4000));
  }
}

// ==== Init ====
function initPage() {
  ensureEmptyOptionForQty();
  restoreFormData();
  setCurrentDateFull();

  const button = document.getElementById("sendToTelegram");
  if (!button) return;

  button.addEventListener("click", async () => {
    try {
      const langs = Array.isArray(window.sendLangs) && window.sendLangs.length ? window.sendLangs : ["ru"];
      for (const lang of langs) {
        const msg = buildMessageForLang(lang);
        await sendAllParts(msg);
      }
      alert("✅ ОТПРАВЛЕНО");
      localStorage.clear();
      document.querySelectorAll("select").forEach(s => (s.value = ""));
      document.querySelectorAll("textarea.comment").forEach(t => (t.value = ""));
    } catch (err) {
      console.error("Ошибка отправки:", err);
      alert("❌ Ошибка: " + (err.message || err));
    }
  });

  document.querySelectorAll("select, textarea.comment").forEach(el =>
    el.addEventListener("input", saveFormData)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const wait = setInterval(() => {
    const dict = getTranslationsObject();
    if (dict && Object.keys(dict).length > 0) {
      clearInterval(wait);
      initPage();
    }
  }, 100);

  const dictNow = getTranslationsObject();
  if (dictNow && Object.keys(dictNow).length > 0) {
    clearInterval(wait);
    initPage();
  }
});
