// ================== ЯЗЫК ==================
window.currentLang = window.currentLang || 'ru';

// ================== НАВИГАЦИЯ ==================
function goHome() {
  location.href = location.origin + '/' + location.pathname.split('/')[1] + '/';
}

function goBack() {
  const path = location.pathname;
  const parent = path.substring(0, path.lastIndexOf('/'));
  const upper = parent.substring(0, parent.lastIndexOf('/'));
  location.href = upper + '/index.html';
}

// ================== DATA ==================
const DATA_FILE = 'data/preps.json';

// ================== LOAD JSON ==================
async function loadData() {
  const r = await fetch(DATA_FILE);
  return r.json();
}

// ================== HELPERS ==================
function ingredientName(ing) {
  if (window.currentLang === 'ru') return ing['Продукт'];
  if (window.currentLang === 'vi') return ing['Ingredient_vi'] || ing['Ingredient'] || ing['Продукт'];
  return ing['Ingredient'] || ing['Продукт'];
}

function headers() {
  if (window.currentLang === 'ru') return ['#', 'Продукт', 'Гр/шт', 'Описание'];
  if (window.currentLang === 'vi') return ['#', 'Nguyên liệu', 'Gr/Pcs', 'Cách làm'];
  return ['#', 'Ingredient', 'Gr/Pcs', 'Process'];
}

// ================== RENDER ==================
async function renderPage() {
  const data = await loadData();
  const container = document.querySelector('.table-container');
  container.innerHTML = '';

  (data.recipes || data).forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';

    // TITLE
    const title = document.createElement('div');
    title.className = 'dish-title';
    title.textContent =
      dish.name?.[window.currentLang] ||
      dish.name?.ru ||
      dish.title ||
      '';
    card.appendChild(title);

    // TABLE
    const table = document.createElement('table');
    table.className = 'pf-table';

    const thead = document.createElement('thead');
    const trh = document.createElement('tr');
    headers().forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    const tbody = document.createElement('tbody');

    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement('tr');

      const tdN = document.createElement('td');
      tdN.textContent = i + 1;

      const tdName = document.createElement('td');
      tdName.textContent = ingredientName(ing);

      const tdAmount = document.createElement('td');
      tdAmount.textContent = ing['Шт/гр'];
      tdAmount.dataset.base = ing['Шт/гр'];

      // === ПЕРЕСЧЁТ ===
      if (ing['Продукт'] === dish.key) {
        tdAmount.contentEditable = true;
        tdAmount.classList.add('key-ingredient');

        tdAmount.addEventListener('input', () => {
          const newVal = parseFloat(tdAmount.textContent.replace(',', '.')) || 0;
          const baseVal = parseFloat(tdAmount.dataset.base.replace(',', '.')) || 1;
          const factor = newVal / baseVal;

          tbody.querySelectorAll('tr').forEach(r => {
            const cell = r.cells[2];
            if (!cell || cell === tdAmount) return;
            const base = parseFloat(cell.dataset.base.replace(',', '.')) || 0;
            cell.textContent = Math.round(base * factor);
          });
        });
      }

      tr.append(tdN, tdName, tdAmount);

      if (i === 0) {
        const tdDesc = document.createElement('td');
        tdDesc.rowSpan = dish.ingredients.length;
        tdDesc.textContent =
          dish.process?.[window.currentLang] ||
          dish.process?.ru ||
          '';
        tr.appendChild(tdDesc);
      }

      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', renderPage);

// ================== LANGUAGE CHANGE ==================
document.addEventListener('languageChanged', () => {
  renderPage();
});
