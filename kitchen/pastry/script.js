
// Отображение текущей даты
document.addEventListener("DOMContentLoaded", () => {
    const dateEl = document.getElementById("current-date");
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('ru-RU', options);
});

// ==== Навигация ====
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
