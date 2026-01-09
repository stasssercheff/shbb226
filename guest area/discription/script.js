// Пути к JSON-файлам
const dataFiles = {
  descriptiondish: 'data/descriptiondish.json',
  descriptiondesert: 'data/descriptiondesert.json',
  descriptionbuns: 'data/descriptionbuns.json',
  descriptionbread: 'data/descriptionbread.json',
};


// На главную
function goHome() {
  // Переходим в корень сайта
  location.href = location.origin + location.pathname.split('/')[1] + '/';
}

// На уровень выше (одну папку вверх)
function goBack() {
    const currentPath = window.location.pathname;
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    const upperPath = parentPath.substring(0, parentPath.lastIndexOf("/"));
    window.location.href = upperPath + "/index.html";
}



// Функция создания таблицы для раздела
function createTable(sectionArray) {
  if (!sectionArray) return document.createElement('div');

  const table = document.createElement('table');
  table.classList.add('dish-table');

  // Шапка таблицы
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  [
    currentLang === 'ru' ? 'Ингредиенты' : 'Ingredients',
    currentLang === 'ru' ? 'Гр.' : 'Gr.',
    currentLang === 'ru' ? 'Описание' : 'Description',
    currentLang === 'ru' ? 'Фото' : 'Photo'
  ].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Тело таблицы
  const tbody = document.createElement('tbody');

  sectionArray.forEach(dish => {
    // Название блюда
    const trName = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = dish.name[currentLang];
    tdName.colSpan = 4;
    tdName.style.fontWeight = '600';
    tdName.style.textAlign = 'left';
    trName.appendChild(tdName);
    tbody.appendChild(trName);

    // Строка с ингредиентами, количеством, описанием и фото
    const tr = document.createElement('tr');

    // Ингредиенты
    const tdIngr = document.createElement('td');
    const ul = document.createElement('ul');
    ul.className = 'ingredients-list';
    dish.ingredients.forEach(ing => {
      const li = document.createElement('li');
      li.textContent = ing[currentLang];
      ul.appendChild(li);
    });
    tdIngr.appendChild(ul);

    // Выход
    const tdAmount = document.createElement('td');
    tdAmount.textContent = dish.amount || '';

    // Описание
    const tdDesc = document.createElement('td');
    tdDesc.textContent = dish.process[currentLang] || '';

    // Фото
    const tdPhoto = document.createElement('td');
    if (dish.photo) {
      const img = document.createElement('img');
      img.src = dish.photo;
      img.alt = dish.name[currentLang];
      img.className = 'dish-photo';
      img.style.maxWidth = '120px';
      img.style.cursor = 'pointer';
      tdPhoto.appendChild(img);
    }

    tr.appendChild(tdIngr);
    tr.appendChild(tdAmount);
    tr.appendChild(tdDesc);
    tr.appendChild(tdPhoto);

    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  return table;
}

// Создание модалки для фото
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

    photoModal.addEventListener('click', () => {
      photoModal.style.display = 'none';
    });

    modalImg.style.maxWidth = '90%';
    modalImg.style.maxHeight = '90%';
    modalImg.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
  }
  return photoModal;
}

// Загрузка данных
async function loadSection(section) {
  const panel = document.getElementById(section);

  // Закрываем другие панели
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

    // Кликабельность фото
    const photoModal = createPhotoModal();
    tblContainer.querySelectorAll('img.dish-photo').forEach(img => {
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

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      loadSection(btn.dataset.section);
    });
  });

  // Перерисовка при смене языка
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        document.querySelectorAll('.section-panel').forEach(panel => {
          if (panel.style.display === 'block') {
            loadSection(panel.id); // заново грузим данные с учётом нового currentLang
          }
        });
      });
    });
  });
});
