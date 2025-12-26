// На главную
function goHome() {
  location.href = "http://stasssercheff.github.io/shbb125/";
}

// На уровень выше (одну папку вверх)
function goBack() {
  const currentPath = window.location.pathname;
  const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
  const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
  window.location.href = upperPath + "/index.html";
}

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSpNWtZImdMKoOxbV6McfEXEB67ck7nzA1EcBXNOFdnDTK4o9gniAuz82paEdGAyRSlo6dFKO9zCyLP/pub?gid=0&single=true&output=csv";

// ===== ДОБАВЛЕНО ТОЛЬКО ДЛЯ ЦВЕТОВ =====
function parseShiftValue(val) {
  if (!val) return 0;
  const v = String(val).trim().replace(",", ".");
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

async function loadSchedule() {
  try {
    const resp = await fetch(CSV_URL);
    const text = await resp.text();
    const rows = text.trim().split("\n").map(r => r.split(","));

    const table = document.getElementById("schedule");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let r = 0; r < rows.length; r++) {
      const tr = document.createElement("tr");

      if (r >= 2 && rows[r][0].toLowerCase().includes("раздел")) {
        tr.classList.add("section-row");
      }

      for (let c = 0; c < rows[r].length; c++) {
        const td = document.createElement("td");
        const val = rows[r][c].trim();
        td.textContent = val;

        // ====== ТОЛЬКО ПОДСВЕТКА ======
        if (r > 0 && c > 0) {
          const shiftValue = parseShiftValue(val);

          if (shiftValue > 0 && shiftValue < 1) {
            td.classList.add("shift-partial");
          }

          if (shiftValue > 1 && shiftValue <= 2) {
            td.classList.add("shift-double");
          }

          if (val === "1") td.classList.add("shift-1");
          if (val === "0") td.classList.add("shift-0");
          if (val === "VR") td.classList.add("shift-VR");
          if (val === "3") td.classList.add("shift-3");
        }

        // Подсветка сегодняшнего дня (как было)
        if ((r === 0 || r === 1) && c >= 2 && isToday(val, today)) {
          td.classList.add("today");
        }

        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }

    // Прокрутка к сегодняшнему дню (как было)
    const firstRowCells = table.querySelectorAll("tr:first-child td");
    let todayIndex = -1;

    for (let i = 2; i < firstRowCells.length; i++) {
      if (isToday(firstRowCells[i].textContent, today)) {
        todayIndex = i;
        break;
      }
    }

    if (todayIndex > -1) {
      const scrollContainer = document.querySelector(".table-container");
      let offset = 0;
      for (let i = 0; i < todayIndex; i++) {
        offset += firstRowCells[i].offsetWidth;
      }
      scrollContainer.scrollLeft =
        offset -
        scrollContainer.clientWidth / 2 +
        firstRowCells[todayIndex].offsetWidth / 2;
    }

  } catch (err) {
    console.error("Ошибка загрузки:", err);
  }
}

function isToday(dateStr, today) {
  const [d, m] = dateStr.split(".").map(Number);
  return d === today.getDate() && m === (today.getMonth() + 1);
}

loadSchedule();
