let currentLang = localStorage.getItem("lang") || "ru";
let translations = {};

// Загружаем словарь из JSON
async function loadTranslations() {
  let loaded = false;
  let paths = [
    "./lang.json",
    "../lang.json",
    "../../lang.json",
    "../../../lang.json",
    "../../../../lang.json",
    "../../../../../lang.json",
    "../../../../../../lang.json"
  ];

  for (let path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) {
        translations = await res.json();
        loaded = true;
        break;
      }
    } catch (e) {
      // пропускаем неудачные пути
    }
  }

  if (loaded) {
    switchLanguage(currentLang);
  } else {
    console.error("Не найден lang.json ни по одному пути");
  }
}

function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang); // ✅ сохраняем только интерфейсный язык

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key] && translations[key][lang]) {
      if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
        el.setAttribute("placeholder", translations[key][lang]);
      } else {
        el.innerHTML = translations[key][lang];
      }
    }
  });

  // обновляем дату
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    dateEl.textContent = new Date().toLocaleDateString(
      translations.date_format?.[lang] || lang,
      options
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".lang-btn").forEach(btn => {
    btn.addEventListener("click", () => switchLanguage(btn.dataset.lang));
  });

  loadTranslations();
});
