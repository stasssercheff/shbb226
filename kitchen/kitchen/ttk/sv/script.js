// ================== ЯЗЫК ==================
function getLang() {
  return localStorage.getItem("lang") || "ru";
}

// ================== НАВИГАЦИЯ ==================
function goHome() {
  location.href = location.origin + "/" + location.pathname.split("/")[1] + "/";
}

function goBack() {
  const path = location.pathname;
  const parent = path.substring(0, path.lastIndexOf("/"));
  const upper = parent.substring(0, parent.lastIndexOf("/"));
  location.href = upper + "/index.html";
}

// ================== DATA ==================
const DATA_FILE = "data/preps.json";
let cachedData = null;

// ================== LOAD JSON ==================
function loadData() {
  if (cachedData) {
    renderPreps(cachedData);
    return;
  }

  fetch(DATA_FILE)
    .then(r => r.json())
    .then(data => {
      cachedData = data;
      renderPreps(data);
    })
    .catch(err => console.error("JSON load error:", err));
}

// ================== RENDER ==================
function renderPreps(data) {
  const lang = getLang();
  const container = document.querySelector(".table-container");
  if (!container) return;

  container.innerHTML = "";

  (data.recipes || []).forEach(dish => {
    const card = document.createElement("div");
    card.className = "dish-card";

    // ---- TITLE ----
    const title = document.createElement("div");
    title.className = "dish-title";
    title.textContent = dish.name?.[lang] || dish.name?.ru || "";
    card.appendChild(title);

    // ---- TABLE ----
    const table = document.createElement("table");
    table.className = "pf-table";

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const headers =
      lang === "ru"
        ? ["#", "Продукт", "Гр/шт", "Описание"]
        : lang === "vi"
          ? ["#", "Nguyên liệu", "Gr/Pcs", "Mô tả"]
          : ["#", "Ingredient", "Gr/Pcs", "Process"];

    const trh = document.createElement("tr");
    headers.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    // ---- ROWS ----
    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement("tr");

      // №
      const tdNum = document.createElement("td");
      tdNum.textContent = ing["№"] ?? i + 1;

      // NAME
      const tdName = document.createElement("td");
      tdName.textContent =
        lang === "ru"
          ? ing["Продукт"]
          : ing["Ingredient"] || ing["Продукт"];

      // AMOUNT
      const tdAmount = document.createElement("td");
      tdAmount.textContent = ing["Шт/гр"];
      tdAmount.dataset.base = ing["Шт/гр"];

      // ==== KEY INGREDIENT ====
      if (ing["Продукт"] === dish.key) {
        tdAmount.contentEditable = true;
        tdAmount.classList.add("key-ingredient");

        tdAmount.addEventListener("input", () => {
          const newVal = parseFloat(tdAmount.textContent) || 0;
          const baseVal = parseFloat(tdAmount.dataset.base) || 1;
          const factor = newVal / baseVal;

          tbody.querySelectorAll("tr").forEach(r => {
            const cell = r.children[2];
            if (cell && cell !== tdAmount) {
              const base = parseFloat(cell.dataset.base) || 0;
              cell.textContent = Math.round(base * factor);
            }
          });
        });
      }

      tr.appendChild(tdNum);
      tr.appendChild(tdName);
      tr.appendChild(tdAmount);

      // DESCRIPTION
      if (i === 0) {
        const tdDesc = document.createElement("td");
        tdDesc.textContent = dish.process?.[lang] || dish.process?.ru || "";
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

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", loadData);

// ================== LANGUAGE CHANGE ==================
document.addEventListener("languageChanged", () => {
  if (cachedData) renderPreps(cachedData);
});
