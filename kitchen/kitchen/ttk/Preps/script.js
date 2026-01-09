// ==== CURRENT LANGUAGE ====
function getCurrentLang() {
  return window.currentLang || localStorage.getItem('lang') || 'ru';
}

// ==== NAVIGATION ====
function goHome() {
  location.href = location.origin + '/' + location.pathname.split('/')[1] + '/';
}

function goBack() {
  const path = location.pathname;
  const parent = path.substring(0, path.lastIndexOf('/'));
  const upper = parent.substring(0, parent.lastIndexOf('/'));
  location.href = upper + '/index.html';
}

// ==== DATA FILE ====
const DATA_FILE = 'data/preps.json';

// ==== LOAD JSON ====
function loadData(callback) {
  fetch(DATA_FILE)
    .then(r => r.json())
    .then(j => callback(j))
    .catch(e => console.error('Preps load error:', e));
}

// ==== RENDER PREPS ====
function renderPreps(data) {
  const lang = getCurrentLang();
  const container = document.querySelector('.table-container');
  container.innerHTML = '';

  (data.recipes || data).forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';

    const title = document.createElement('div');
    title.className = 'dish-title';
    title.textContent = dish.name?.[lang] || dish.name?.ru || dish.title;
    card.appendChild(title);

    const table = document.createElement('table');
    table.className = 'pf-table';

    const headers =
      lang === 'ru'
        ? ['#', 'Продукт', 'Гр/шт', 'Описание']
        : lang === 'vi'
          ? ['#', 'Nguyên liệu', 'Gr/Pcs', 'Cách làm']
          : ['#', 'Ingredient', 'Gr/Pcs', 'Process'];

    table.innerHTML = `
      <thead>
        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement('tr');

      const name =
        lang === 'ru'
          ? ing['Продукт']
          : ing['Ingredient'] || ing['Продукт'];

      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${name}</td>
        <td>${ing['Шт/гр']}</td>
      `;

      if (i === 0) {
        const tdDesc = document.createElement('td');
        tdDesc.textContent = dish.process?.[lang] || dish.process?.ru || '';
        tdDesc.rowSpan = dish.ingredients.length;
        tr.appendChild(tdDesc);
      }

      tbody.appendChild(tr);
    });

    card.appendChild(table);
    container.appendChild(card);
  });
}

// ==== INIT ====
function renderPage() {
  loadData(renderPreps);
}

document.addEventListener('DOMContentLoaded', renderPage);

// ==== LANGUAGE CHANGE ====
document.addEventListener('languageChanged', () => {
  renderPage();
  if (typeof updateI18nText === 'function') updateI18nText();
});
