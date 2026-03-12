// === sendConfig.js ===
// Глобальный файл для управления языками отправки сообщений без localStorage

// Дефолтные профили и их языки
const sendProfiles = {
  rest: ["ru"],
  hall: ["en"],
  kitchen: ["ru", "vi"],
  pastry: ["ru", "en"],
  order: ["ru", "en", "vi"],
  extra2: ["ru"],
  extra3: ["ru"]
};

// Получаем текущий профиль страницы
function getCurrentProfile() {
  const profile = document.body.dataset.profile || "rest";
  console.log("📄 Текущий профиль страницы:", profile);
  return profile;
}

// Получаем языки для текущего профиля
function getSendLanguages(profile) {
  const langs = sendProfiles[profile] || ["ru"];
  console.log(`🔍 getSendLanguages('${profile}') →`, langs);
  return langs;
}

// Присваиваем глобально массив языков для отправки
window.sendLangs = getSendLanguages(getCurrentProfile());
console.log("🌍 window.sendLangs:", window.sendLangs);

// Вспомогательные функции управления (не используют localStorage)
function setSendLanguages(profile, langs) {
  if (!Array.isArray(langs)) throw new Error("langs должен быть массивом");
  sendProfiles[profile] = langs.map(String);
  console.log(`✅ Для профиля '${profile}' установлены языки:`, sendProfiles[profile]);
}

function toggleLanguage(profile, lang) {
  const langs = sendProfiles[profile] || [];
  if (langs.includes(lang)) {
    sendProfiles[profile] = langs.filter(l => l !== lang);
    console.log(`❌ Язык '${lang}' убран из профиля '${profile}'`);
  } else {
    sendProfiles[profile] = [...langs, lang];
    console.log(`➕ Язык '${lang}' добавлен в профиль '${profile}'`);
  }
}

function isLanguageSelected(profile, lang) {
  return (sendProfiles[profile] || []).includes(lang);
}
