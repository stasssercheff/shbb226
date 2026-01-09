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
