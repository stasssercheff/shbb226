// ======================
// Отображение текущей даты с учётом языка
// ======================
document.addEventListener("DOMContentLoaded", () => {
    const dateEl = document.getElementById("current-date");
    if (!dateEl) return; // если блока даты нет — пропускаем

    const today = new Date();
    const savedLang = localStorage.getItem("lang") || "ru";

    const locales = {
        ru: "ru-RU",
        en: "en-US",
        vi: "vi-VN"
    };

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString(locales[savedLang] || "ru-RU", options);
});

// ======================
// Переходы по кнопкам
// ======================

// На главную
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
