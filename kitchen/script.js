// === Дата ===
document.addEventListener("DOMContentLoaded", () => {
  updateDate();
});

// Функция обновления даты (зависит от выбранного языка)
function updateDate() {
  const dateEl = document.getElementById("current-date");
  if (!dateEl) return;

  const today = new Date();
  const lang = localStorage.getItem("lang") || "ru";

  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  dateEl.textContent = today.toLocaleDateString(langMap(lang), options);
}

// Приводим lang.js код к формату для toLocaleDateString
function langMap(lang) {
  switch (lang) {
    case "en": return "en-US";
    case "vi": return "vi-VN";
    default: return "ru-RU";
  }
}

// ======================
// Переходы по кнопкам
// ======================

// На главную
function goHome() {
    window.location.href = window.location.origin + "/shbb125/";
}


// На уровень выше (одну папку вверх)
function goBack() {
    const currentPath = window.location.pathname;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
    window.location.href = upperPath + "/index.html";
}

// Подписываемся на переключение языка, чтобы обновлять дату
document.addEventListener("langChanged", updateDate);
