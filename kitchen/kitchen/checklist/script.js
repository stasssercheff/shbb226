// Показ даты (если она есть на странице)
document.addEventListener("DOMContentLoaded", () => {
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString(localStorage.getItem("lang") || "ru", options);
  }
});

// ======================
// Переходы по кнопкам
// ======================

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
