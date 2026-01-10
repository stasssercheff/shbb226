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
const DATA_FILE = "data/sv.json";
let cachedData = null;

// ================== LOAD JSON ==================
function loadData() {
  if (cachedData) {
    renderSV(cachedData);
    return;
  }

  fetch(DATA_FILE)
    .then(r => r.json())
    .then(data => {
      cachedData = data;
      renderSV(data);
    })
    .catch(err => console.error("SV JSON load error:", err));
}

// ================== RENDER SOUS-VIDE ==================
function renderSV(data) {
  const lang = getLang();
  const container = document.querySelector(".table-container");
  if (!container) return;

  container.innerHTML = "";

  (data.recipes || []).forEach(dish => {
    const card = document.createElement("div");
    card.className = "dish-card";

    // ---------- TITLE ----------
    const title = document.createElement("div");
    title.className = "dish-title";
    title.textContent =
      dish.title?.[lang] ||
      dish.title?.ru ||
      "";
    card.appendChild(title);

    // ---------- TABLE ----------
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

    // ---------- ROWS ----------
    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement("tr");

      // №
      const tdNum = document.createElement("td");
      tdNum.textContent = ing["№"] ?? i + 1;

      // NAME (объект!)
      const tdName = document.createElement("td");
      tdName.textContent =
        ing["Продукт"]?.[lang] ||
        ing["Продукт"]?.ru ||
        "";

      // AMOUNT
      const tdAmount = document.createElement("td");
      tdAmount.textContent = ing["Шт/гр"] || "";

      // TEMP
      const tdTemp = document.createElement("td");
      tdTemp.textContent = ing["Температура С / Temperature C"] || "";

      // TIME
      const tdTime = document.createElement("td");
      tdTime.textContent = ing["Время мин / Time"] || "";

      // DESCRIPTION (по range)
      const proc = dish.process?.find(
        p => i + 1 >= p.range[0] && i + 1 <= p.range[1]
      );

      const tdDesc = document.createElement("td");
      tdDesc.textContent =
        proc?.[lang] ||
        proc?.ru ||
        "";

      tr.appendChild(tdNum);
      tr.appendChild(tdName);
      tr.appendChild(tdAmount);
      tr.appendChild(tdTemp);
      tr.appendChild(tdTime);
      tr.appendChild(tdDesc);

      tbody.appendChild(tr);
    });

    table.append(thead, tbody);
    card.appendChild(table);
    container.appendChild(card);
  });
}

// ================== INIT ==================
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  // 🔴 перерисовка при смене языка
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      setTimeout(() => {
        if (cachedData) renderSV(cachedData);
      }, 0);
    });
  });
});
