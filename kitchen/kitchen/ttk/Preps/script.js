// ==== Текущий язык из lang.js ====
window.currentLang = window.currentLang || 'ru';

// ==== Навигация ====
function goHome() {
  location.href = location.origin + '/' + location.pathname.split('/')[1] + '/';
}

function goBack() {
  const currentPath = window.location.pathname;
  const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
  const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
  window.location.href = upperPath + "/index.html";
}

// ==== Пути к данным ====
const dataFiles = {
  'Preps': 'data/preps.json',
  'Sous-Vide': 'data/sv.json'
};

// ==== Загрузка JSON ====
function loadData(sectionName, callback) {
  const relativePath = dataFiles[sectionName];

  const baseUrl = window.location.origin + window.location.pathname;
  const currentFolder = baseUrl.substring(0, baseUrl.lastIndexOf("/") + 1);
  const fullPath = new URL(relativePath, currentFolder).href;

  fetch(fullPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => callback(data))
    .catch(err => console.error(`Ошибка загрузки ${sectionName}:`, err));
}

// ==== Отображение секции ====
function renderSection(sectionName) {
  const container = document.querySelector('.table-container');
  if (!container) return;

  container.dataset.active = sectionName;

  loadData(sectionName, data => {
    if (sectionName === 'Preps') createTable(data);
    if (sectionName === 'Sous-Vide') renderSousVide(data);
  });
}

// ==== Таблица Preps ====
function createTable(data) {
  const container = document.querySelector('.table-container');
  container.innerHTML = '';

  (data.recipes || data).forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';

    const title = document.createElement('div');
    title.className = 'dish-title';
    title.textContent =
      dish.name?.[currentLang] ||
      dish.name?.ru ||
      dish.title;

    card.appendChild(title);

    const table = document.createElement('table');
    table.className = 'pf-table';

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers =
      currentLang === 'ru'
        ? ['#', 'Продукт', 'Гр/шт', 'Описание']
        : currentLang === 'vi'
          ? ['#', 'Nguyên liệu', 'Gr/Pcs', 'Cách làm']
          : ['#', 'Ingredient', 'Gr/Pcs', 'Process'];

    const trHead = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement('tr');

      const tdNum = document.createElement('td');
      tdNum.textContent = i + 1;

      const tdName = document.createElement('td');
      tdName.textContent =
        currentLang === 'ru'
          ? ing['Продукт']
          : currentLang === 'vi'
            ? ing['Ingredient_vi'] || ing['Ingredient'] || ing['Продукт']
            : ing['Ingredient'] || ing['Продукт'];

      const tdAmount = document.createElement('td');
      tdAmount.textContent = ing['Шт/гр'];
      tdAmount.dataset.base = ing['Шт/гр'];

      // === КЛЮЧЕВОЙ ИНГРЕДИЕНТ (ПЕРЕСЧЁТ) ===
      if (ing['Продукт'] === dish.key) {
        tdAmount.contentEditable = true;
        tdAmount.classList.add('key-ingredient');

        tdAmount.addEventListener('input', () => {
          const newVal = parseFloat(tdAmount.textContent.replace(/[^0-9.]/g, '')) || 0;
          const baseVal = parseFloat(tdAmount.dataset.base) || 1;
          const factor = newVal / baseVal;

          const rows = tdAmount.closest('table').querySelectorAll('tbody tr');
          rows.forEach(r => {
            const cell = r.cells[2];
            if (cell && cell !== tdAmount) {
              const base = parseFloat(cell.dataset.base) || 0;
              cell.textContent = Math.round(base * factor);
            }
          });
        });

        tdAmount.addEventListener('keydown', e => {
          if (!/[0-9]|Backspace|Delete|ArrowLeft|ArrowRight/.test(e.key)) {
            e.preventDefault();
          }
        });
      }

      tr.appendChild(tdNum);
      tr.appendChild(tdName);
      tr.appendChild(tdAmount);

      if (i === 0) {
        const tdDesc = document.createElement('td');
        tdDesc.textContent =
          dish.process?.[currentLang] ||
          dish.process?.ru ||
          '';
        tdDesc.rowSpan = dish.ingredients.length;
        tr.appendChild(tdDesc);
      }

      tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

// ==== Таблица Sous-Vide ====
function renderSousVide(data) {
  const container = document.querySelector('.table-container');
  container.innerHTML = '';

  data.recipes.forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';

    const title = document.createElement('div');
    title.className = 'dish-title';
    title.textContent =
      dish.name?.[currentLang] ||
      dish.name?.ru ||
      dish.title;

    card.appendChild(title);

    const table = document.createElement('table');
    table.className = 'sv-table';

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers =
      currentLang === 'ru'
        ? ['#', 'Продукт', 'Гр/шт', 'Темп °C', 'Время', 'Описание']
        : currentLang === 'vi'
          ? ['#', 'Nguyên liệu', 'Gr/Pcs', 'Temp °C', 'Time', 'Cách làm']
          : ['#', 'Ingredient', 'Gr/Pcs', 'Temp °C', 'Time', 'Process'];

    const trHead = document.createElement('tr');
    headers.forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    dish.ingredients.forEach((ing, i) => {
      const tdDesc =
        dish.process.find(p => i + 1 >= p.range[0] && i + 1 <= p.range[1])?.[currentLang]
        || dish.process.find(p => i + 1 >= p.range[0] && i + 1 <= p.range[1])?.ru
        || '';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ing['№']}</td>
        <td>${
          currentLang === 'ru'
            ? ing['Продукт']
            : currentLang === 'vi'
              ? ing['Ingredient_vi'] || ing['Ingredient'] || ing['Продукт']
              : ing['Ingredient'] || ing['Продукт']
        }</td>
        <td>${ing['Шт/гр']}</td>
        <td>${ing['Температура С / Temperature C'] || ''}</td>
        <td>${ing['Время мин / Time'] || ''}</td>
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

// ==== ИНИЦИАЛИЗАЦИЯ ====
document.addEventListener('DOMContentLoaded', () => {
  const path = location.pathname.toLowerCase();

  if (path.includes('preps')) renderSection('Preps');
  if (path.includes('sv')) renderSection('Sous-Vide');

  if (typeof updateI18nText === 'function') {
    updateI18nText();
  }
});

// ==== ПЕРЕРИСОВКА ПРИ СМЕНЕ ЯЗЫКА ====
document.addEventListener('languageChanged', () => {
  const active = document.querySelector('.table-container')?.dataset.active;
  if (active) renderSection(active);
});
