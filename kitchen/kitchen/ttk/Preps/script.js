// ================== ТЕКУЩИЙ ЯЗЫК ==================
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
function loadData() {
  return fetch(DATA_FILE)
    .then(r => r.json())
    .catch(e => {
      console.error('Preps load error:', e);
      return null;
    });
}

// ================== INGREDIENT NAME ==================
function getIngredientName(ing) {
  if (window.currentLang === 'ru') return ing['Продукт'];
  if (window.currentLang === 'vi') return ing['Ingredient_vi'] || ing['Ingredient'] || ing['Продукт'];
  return ing['Ingredient'] || ing['Продукт'];
}

// ================== TABLE HEADERS ==================
function getHeaders() {
  if (window.currentLang === 'ru') return ['#', 'Продукт', 'Гр/шт', 'Описание'];
  if (window.currentLang === 'vi') return ['#', 'Nguyên liệu', 'Gr/Pcs', 'Cách làm'];
  return ['#', 'Ingredient', 'Gr/Pcs', 'Process'];
}

// ================== RENDER ==================
async function renderPage() {
  const data = await loadData();
  if (!data) return;

  const container = document.querySelector('.table-container');
  if (!container) return;
  container.innerHTML = '';

  (data.recipes || data).forEach(dish => {
    const card = document.createElement('div');
    card.className = 'dish-card';

    // ---------- TITLE ----------
    const title = document.createElement('div');
    title.className = 'dish-title';
    title.textContent =
      dish.name?.[window.currentLang] ||
      dish.name?.ru ||
      '';
    card.appendChild(title);

    // ---------- TABLE ----------
    const table = document.createElement('table');
    table.className = 'pf-table';

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // ---------- HEAD ----------
    const trHead = document.createElement('tr');
    getHeaders().forEach(h => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // ---------- ROWS ----------
    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement('tr');

      // #
      const tdNum = document.createElement('td');
      tdNum.textContent = i + 1;

      // NAME
      const tdName = document.createElement('td');
      tdName.textContent = getIngredientName(ing);

      // AMOUNT
      const tdAmount = document.createElement('td');
      tdAmount.textContent = ing['Шт/гр'];
      tdAmount.dataset.base = ing['Шт/гр'];

      // ---------- KEY INGREDIENT ----------
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
            const value = base * factor;
            cell.textContent = Number.isInteger(value) ? value : value.toFixed(1);
          });
        });

        tdAmount.addEventListener('keydown', e => {
          if (!/[0-9.,]|Backspace|Delete|ArrowLeft|ArrowRight/.test(e.key)) {
            e.preventDefault();
          }
        });
      }

      tr.append(tdNum, tdName, tdAmount);

      // ---------- DESCRIPTION ----------
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
document.addEventListener('DOMContentLoaded', () => {
  renderPage();

  // 🔴 ХУК В ПЕРЕКЛЮЧЕНИЕ ЯЗЫКА
  if (typeof window.updateI18nText === 'function') {
    const original = window.updateI18nText;
    window.updateI18nText = function () {
      original();
      renderPage(); // ← ПЕРЕРИСОВКА ТАБЛИЦ
    };
  }
});
