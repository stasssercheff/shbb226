// ==== Текущий язык ====
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

// ==== Пути к JSON-файлам ====
const dataFiles = {
  breakfast: 'data/breakfast.json',
  soup: 'data/soup.json',
  salad: 'data/salad.json',
  main: 'data/main.json',
  sandwich: 'data/sandwich.json'
};

// ==== Модалка для фото ====
function createPhotoModal() {
  let photoModal = document.getElementById('photo-modal');
  if (!photoModal) {
    photoModal = document.createElement('div');
    photoModal.id = 'photo-modal';
    const modalImg = document.createElement('img');
    photoModal.appendChild(modalImg);
    document.body.appendChild(photoModal);

    Object.assign(photoModal.style, {
      display: 'none',
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '9999',
      cursor: 'pointer',
    });

    modalImg.style.maxWidth = '90%';
    modalImg.style.maxHeight = '90%';
    modalImg.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';

    photoModal.addEventListener('click', () => {
      photoModal.style.display = 'none';
    });
  }
  return photoModal;
}

// ==== Создание таблицы ====
function createTable(sectionArray) {
  if (!sectionArray) return document.createElement('div');

  const table = document.createElement('table');
  table.classList.add('dish-table');

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['№', window.currentLang === 'ru' ? 'Ингредиент' : 'Ingredient',
   window.currentLang === 'ru' ? 'Гр/Шт' : 'Amount',
   window.currentLang === 'ru' ? 'Описание' : 'Description',
   window.currentLang === 'ru' ? 'Фото' : 'Photo'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  sectionArray.forEach(dish => {
    const dishRow = document.createElement('tr');
    const tdDish = document.createElement('td');
    tdDish.colSpan = 5;
    tdDish.style.fontWeight = '600';
    tdDish.textContent = dish.name[window.currentLang];
    dishRow.appendChild(tdDish);
    tbody.appendChild(dishRow);

    const descText = dish.process[window.currentLang] || '';
    const ingCount = dish.ingredients.length;

    dish.ingredients.forEach((ing, i) => {
      const tr = document.createElement('tr');

      const tdNum = document.createElement('td');
      tdNum.textContent = i + 1;

      const tdName = document.createElement('td');
      tdName.textContent = ing[window.currentLang];

      const tdAmount = document.createElement('td');
      tdAmount.textContent = ing.amount || '';

      const tdDesc = document.createElement('td');
      if (i === 0) {
        tdDesc.textContent = descText;
        tdDesc.rowSpan = ingCount;
      }

      const tdPhoto = document.createElement('td');
      if (i === 0 && dish.photo) {
        const img = document.createElement('img');
        img.src = dish.photo;
        img.alt = dish.name[window.currentLang];
        img.className = 'dish-photo';
        tdPhoto.appendChild(img);
        tdPhoto.rowSpan = ingCount;
      }

      tr.appendChild(tdNum);
      tr.appendChild(tdName);
      tr.appendChild(tdAmount);
      if (i === 0) tr.appendChild(tdDesc);
      tr.appendChild(tdPhoto);

      tbody.appendChild(tr);
    });
  });

  table.appendChild(tbody);
  return table;
}

// ==== Загрузка раздела ====
async function loadSection(section) {
  const panel = document.getElementById(section);

  document.querySelectorAll('.section-panel').forEach(p => {
    if (p !== panel) {
      p.style.display = 'none';
      p.innerHTML = '';
    }
  });

  if (panel.style.display === 'block') {
    panel.style.display = 'none';
    panel.innerHTML = '';
    return;
  }

  panel.style.display = 'block';
  panel.innerHTML = '';

  try {
    const response = await fetch(dataFiles[section]);
    if (!response.ok) throw new Error('Ошибка загрузки JSON: ' + section);
    const sectionData = await response.json();

    const tblContainer = document.createElement('div');
    tblContainer.className = 'table-container';
    tblContainer.appendChild(createTable(sectionData));
    panel.appendChild(tblContainer);

    const photoModal = createPhotoModal();
    tblContainer.querySelectorAll('.dish-photo').forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        const modalImg = photoModal.querySelector('img');
        modalImg.src = img.src;
        modalImg.alt = img.alt;
        photoModal.style.display = 'flex';
      });
    });

  } catch (err) {
    panel.innerHTML = `<p style="color:red">${err.message}</p>`;
    console.error(err);
  }
}

// ==== Инициализация после загрузки DOM ====
document.addEventListener('DOMContentLoaded', () => {
  // Дата
  const dateEl = document.getElementById('current-date');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString();

  // Кнопки разделов
  document.querySelectorAll('.section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const section = btn.dataset.section;
      loadSection(section);
    });
  });

  // Переключение языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      window.currentLang = btn.dataset.lang;
      document.querySelectorAll('.section-panel').forEach(panel => {
        if (panel.style.display === 'block') {
          const section = panel.id;
          panel.innerHTML = '';
          const tblContainer = document.createElement('div');
          tblContainer.className = 'table-container';
          fetch(dataFiles[section])
            .then(res => res.json())
            .then(data => {
              tblContainer.appendChild(createTable(data));
              panel.appendChild(tblContainer);

              const photoModal = createPhotoModal();
              tblContainer.querySelectorAll('.dish-photo').forEach(img => {
                img.style.cursor = 'pointer';
                img.addEventListener('click', () => {
                  const modalImg = photoModal.querySelector('img');
                  modalImg.src = img.src;
                  modalImg.alt = img.alt;
                  photoModal.style.display = 'flex';
                });
              });
            });
        }
      });
    });
  });
});
