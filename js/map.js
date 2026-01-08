let myMap;
let placemarks = [];
let clusterer;

const resources = [
    {
        id: 1,
        name: 'Центральная библиотека иностранной литературы',
        type: 'library',
        coords: [59.939098, 30.315868],
        address: 'Невский пр-т, 20, Санкт-Петербург',
        hours: 'Пн-Пт: 10:00-20:00, Сб-Вс: 10:00-18:00',
        phone: '+7 (812) 123-45-67',
        description: 'Библиотека с крупнейшей коллекцией иностранной литературы. Книги, журналы, аудиокниги на 30+ языках.'
    },
    {
        id: 2,
        name: 'Lingvo Coffee',
        type: 'cafe',
        coords: [59.935834, 30.325984],
        address: 'ул. Малая Садовая, 5, Санкт-Петербург',
        hours: 'Ежедневно: 12:00-22:00',
        phone: '+7 (812) 234-56-78',
        description: 'Языковое кафе для практики английского, испанского и французского языков в непринужденной обстановке.'
    },
    {
        id: 3,
        name: 'Санкт-Петербургский государственный университет',
        type: 'education',
        coords: [59.940117, 30.298795],
        address: 'Университетская наб., 7-9, Санкт-Петербург',
        hours: 'Пн-Пт: 9:00-18:00',
        phone: '+7 (812) 328-20-00',
        description: 'ВУЗ с факультетом иностранных языков и языковыми курсами для всех желающих.'
    },
    {
        id: 4,
        name: 'LingvoExpert Language Center',
        type: 'private',
        coords: [59.933665, 30.306215],
        address: 'Невский пр-т, 28, Санкт-Петербург',
        hours: 'Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00',
        phone: '+7 (812) 333-22-11',
        description: 'Частный языковой центр с программами для всех уровней. Занятия с носителями языка.'
    },
    {
        id: 5,
        name: 'Культурный центр на Фонтанке',
        type: 'community',
        coords: [59.928093, 30.337839],
        address: 'наб. реки Фонтанки, 46, Санкт-Петербург',
        hours: 'Ежедневно: 8:00-23:00',
        phone: '+7 (812) 312-36-48',
        description: 'Общественный центр с бесплатными разговорными клубами и культурными мероприятиями.'
    },
    {
        id: 6,
        name: 'Российская национальная библиотека',
        type: 'library',
        coords: [59.933908, 30.335989],
        address: 'ул. Садовая, 18, Санкт-Петербург',
        hours: 'Пн-Пт: 9:00-21:00, Сб: 9:00-18:00',
        phone: '+7 (812) 310-71-37',
        description: 'Одна из крупнейших библиотек мира с уникальной коллекцией иностранных изданий.'
    },
    {
        id: 7,
        name: 'Polyglot Meeting Club',
        type: 'cafe',
        coords: [59.931100, 30.360900],
        address: 'Лиговский пр-т, 74, Санкт-Петербург',
        hours: 'Вт-Вс: 14:00-22:00',
        phone: '+7 (812) 987-65-43',
        description: 'Клуб для практики 20+ языков. Еженедельные встречи, мастер-классы и тематические вечера.'
    },
    {
        id: 8,
        name: 'Bridge Language School',
        type: 'private',
        coords: [59.927308, 30.345544],
        address: 'ул. Рубинштейна, 15, Санкт-Петербург',
        hours: 'Пн-Пт: 9:00-21:00, Сб: 10:00-17:00',
        phone: '+7 (812) 456-78-90',
        description: 'Языковая школа с индивидуальными и групповыми программами. Подготовка к международным экзаменам.'
    },
    {
        id: 9,
        name: 'Центр языкового образования СПбПУ',
        type: 'education',
        coords: [59.918889, 30.318333],
        address: 'Политехническая ул., 29, Санкт-Петербург',
        hours: 'Пн-Пт: 9:00-20:00',
        phone: '+7 (812) 552-78-99',
        description: 'Университетский центр с программами изучения 15+ языков для студентов и сотрудников.'
    },
    {
        id: 10,
        name: 'Дом культуры "Лофт Проект ЭТАЖИ"',
        type: 'community',
        coords: [59.926944, 30.347222],
        address: 'Лиговский пр-т, 74, Санкт-Петербург',
        hours: 'Ежедневно: 10:00-22:00',
        phone: '+7 (812) 458-50-05',
        description: 'Современный культурный центр с языковыми воркшопами, разговорными клубами и библиотекой.'
    }
];

function initMap() {
    ymaps.ready(() => {
        myMap = new ymaps.Map('map', {
            center: [59.9311, 30.3609],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
        });

        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedGreenClusterIcons',
            groupByCoordinates: false,
            clusterDisableClickZoom: false,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
        });

        createPlacemarks(resources);
        initMapListeners();
    });
}

function createPlacemarks(data) {
    placemarks.forEach(pm => myMap.geoObjects.remove(pm));
    placemarks = [];
    clusterer.removeAll();

    data.forEach(resource => {
        const placemark = new ymaps.Placemark(
            resource.coords,
            {
                balloonContentHeader: `<h6 class="mb-2">${resource.name}</h6>`,
                balloonContentBody: `
                    <div style="max-width: 300px;">
                        <p class="mb-2"><strong>Тип:</strong> ${getTypeText(resource.type)}</p>
                        <p class="mb-2"><strong>Адрес:</strong> ${resource.address}</p>
                        <p class="mb-2"><strong>Часы работы:</strong> ${resource.hours}</p>
                        <p class="mb-2"><strong>Телефон:</strong> <a href="tel:${resource.phone}">${resource.phone}</a></p>
                        <p class="mb-0"><strong>Описание:</strong> ${resource.description}</p>
                    </div>
                `,
                hintContent: resource.name
            },
            {
                preset: getIconPreset(resource.type),
                iconColor: getIconColor(resource.type)
            }
        );

        placemarks.push(placemark);
        clusterer.add(placemark);
    });

    myMap.geoObjects.add(clusterer);
}

function getIconPreset(type) {
    const presets = {
        'education': 'islands#blueEducationIcon',
        'community': 'islands#orangeCommunityIcon',
        'library': 'islands#greenLibraryIcon',
        'private': 'islands#violetPrivateIcon',
        'cafe': 'islands#redCafeIcon'
    };
    return presets[type] || 'islands#grayIcon';
}

function getIconColor(type) {
    const colors = {
        'education': '#3b5998',
        'community': '#ff6b35',
        'library': '#2ecc71',
        'private': '#9b59b6',
        'cafe': '#e74c3c'
    };
    return colors[type] || '#808080';
}

function getTypeText(type) {
    const types = {
        'education': 'Образовательное учреждение',
        'community': 'Общественный центр',
        'library': 'Публичная библиотека',
        'private': 'Частный языковой центр',
        'cafe': 'Языковое кафе/клуб'
    };
    return types[type] || type;
}

function filterResources() {
    const searchText = document.getElementById('resource-search').value.toLowerCase();
    const typeFilter = document.getElementById('resource-type-filter').value;

    let filtered = resources;

    if (searchText) {
        filtered = filtered.filter(r => 
            r.name.toLowerCase().includes(searchText) ||
            r.address.toLowerCase().includes(searchText) ||
            r.description.toLowerCase().includes(searchText)
        );
    }

    if (typeFilter) {
        filtered = filtered.filter(r => r.type === typeFilter);
    }

    createPlacemarks(filtered);

    if (filtered.length > 0) {
        const bounds = filtered.map(r => r.coords);
        myMap.setBounds(myMap.geoObjects.getBounds(), {
            checkZoomRange: true,
            zoomMargin: 50
        });
    }
}

function resetMap() {
    document.getElementById('resource-search').value = '';
    document.getElementById('resource-type-filter').selectedIndex = 0;
    createPlacemarks(resources);
    myMap.setCenter([59.9311, 30.3609], 12);
}

function initMapListeners() {
    document.getElementById('search-on-map').addEventListener('click', filterResources);
    document.getElementById('reset-map').addEventListener('click', resetMap);
    
    document.getElementById('resource-search').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterResources();
        }
    });
}

if (typeof ymaps !== 'undefined') {
    initMap();
}