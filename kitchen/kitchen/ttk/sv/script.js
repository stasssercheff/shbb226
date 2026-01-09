// ================= ЯЗЫК =================
function getLang() {
  return localStorage.getItem("lang") || "ru";
}

// ================= НАВИГАЦИЯ =================
function goHome() {
  location.href = location.origin + "/" + location.pathname.split("/")[1] + "/";
}

function goBack() {
  const path = location.pathname;
  const parent = path.substring(0, path.lastIndexOf("/"));
  const upper = parent.substring(0, parent.lastIndexOf("/"));
  location.href = upper + "/index.html";
}

// ================= DATA =================
const DATA_FILE = "data/sv.json";
let SV_DATA = null;

// ================= LOAD =================
function loadSousVide() {
  fetch(DATA_FILE)
    .then(r => r.json())
    .then(j => {
      SV_DATA = j;
      renderSousVide();
    })
    .catch(e => console.error("SV load error:", e));
}

// ================= RENDER =================
function renderSousVide() {
  if (!SV_DATA) return;

  const lang = getLang();
  const container = document.querySelector(".table-container");
  if (!container) return;

  container.innerHTML = "";

  SV_DATA.recipes.forEach(dish => {
    const card = document.createElement("div");
    card.className = "dish-card";

    // ---- TITLE ----
    const title = document.createElement("div");
    title.className = "dish-title";
    title.textContent = dish.title || "";
    card.appendChild(title);

    // ---- TABLE ----
    const table = document.createElement("table");
    table.className = "sv-table";

    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    const headers =
      lang === "ru"
        ? ["#", "Продукт", "Гр/шт", "Темп °C", "Время", "Описание"]
        : lang === "vi"
          ? ["#", "Nguyên liệu", "Gr/Pcs", "Nhiệt °C", "Thời gian", "Mô tả"]
          : ["#", "Ingredient", "Gr/Pcs", "Temp °C", "Time", "Process"];

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

      const process =
        dish.process.find(p => i + 1 >= p.range[0] && i + 1 <= p.range[1]);

      const desc =
        process?.[lang] ||
        process?.ru ||
        "";

      tr.innerHTML = `
        <td>${ing["№"]}</td>
        <td>${lang === "ru" ? ing["Продукт"] : ing["Ingredient"]}</td>
        <td>${ing["Шт/гр"]}</td>
        <td>${ing["Температура С / Temperature C"]}</td>
        <td>${ing["Время мин / Time"]}</td>
        <td>${desc}</td>
      `;

      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", loadSousVide);
document.addEventListener("languageChanged", renderSousVide);
