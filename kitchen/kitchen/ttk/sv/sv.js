const dataFile = 'data/sv.json';

function loadData(callback) {
  const baseUrl = window.location.origin + window.location.pathname;
  const currentFolder = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1);
  const fullPath = new URL(dataFile, currentFolder).href;

  fetch(fullPath)
    .then(res => res.ok ? res.json() : Promise.reject(`HTTP ${res.status}`))
    .then(data => callback(data))
    .catch(err => console.error('Ошибка загрузки Sous-Vide:', err));
}

// Таблица Sous-Vide
function renderSousVide(data) {
  const container = document.querySelector('.table-container');
  container.innerHTML = '';

  data.recipes.forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';

    const title = document.createElement('div');
    title.className = 'dish-title';
    title.textContent = dish.name?.[currentLang] || dish.name?.ru || dish.title;
    card.appendChild(title);

    const table = document.createElement('table');
    table.className = 'sv-table';

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = currentLang === 'ru'
      ? ['#', 'Продукт', 'Гр/шт', 'Темп °C', 'Время', 'Описание']
      : currentLang === 'vi'
        ? ['#', 'Nguyên liệu', 'Gr/Pcs', 'Temp °C', 'Time', 'Cách làm']
        : ['#', 'Ingredient', 'Gr/Pcs', 'Temp °C', 'Time', 'Process'];

    const trHead = document.createElement('tr');
    headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; trHead.appendChild(th); });
    thead.appendChild(trHead);

    dish.ingredients.forEach((ing, i) => {
      const tdDesc = (dish.process.find(p => i + 1 >= p.range[0] && i + 1 <= p.range[1])?.[currentLang])
        || (dish.process.find(p => i + 1 >= p.range[0] && i + 1 <= p.range[1])?.ru) || '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ing['№']}</td>
        <td>${currentLang==='ru'?ing['Продукт']:currentLang==='vi'?ing['Ingredient_vi']||ing['Ingredient']||ing['Продукт']:ing['Ingredient']||ing['Продукт']}</td>
        <td>${ing['Шт/гр']}</td>
        <td>${ing['Температура С / Temperature C']||''}</td>
        <td>${ing['Время мин / Time']||''}</td>
        <td>${tdDesc}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

// Инициализация
document.addEventListener("DOMContentLoaded", () => {
  loadData(renderSousVide);
  if (typeof updateI18nText === "function") updateI18nText();
});
