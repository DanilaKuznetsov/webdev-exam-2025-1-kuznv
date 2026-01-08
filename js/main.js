let courses = [];
let tutors = [];
let filteredCourses = [];
let selectedTutor = null;
let selectedCourse = null;
let currentCoursePage = 1;
const ITEMS_PER_PAGE = 5;

document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    loadTutors();
    initSearchListeners();
    initOrderForm();
});

function showNotification(message, type = 'success') {
    const notificationArea = document.getElementById('notification-area');
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show notification`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    notificationArea.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

async function loadCourses() {
    try {
        courses = await api.getCourses();
        filteredCourses = courses;
        renderCourses();
    } catch (error) {
        showNotification('Ошибка загрузки программ: ' + error.message, 'danger');
        console.error('Error loading courses:', error);
    }
}

async function loadTutors() {
    try {
        tutors = await api.getTutors();
        renderTutors();
        populateLanguageFilter();
    } catch (error) {
        showNotification('Ошибка загрузки наставников: ' + error.message, 'danger');
        console.error('Error loading tutors:', error);
    }
}

function renderCourses() {
    const coursesList = document.getElementById('courses-list');
    const startIndex = (currentCoursePage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const coursesToShow = filteredCourses.slice(startIndex, endIndex);

    if (coursesToShow.length === 0) {
        coursesList.innerHTML = '<div class="col-12"><p class="text-center text-muted">Программы не найдены</p></div>';
        return;
    }

    coursesList.innerHTML = coursesToShow.map(course => `
        <div class="col-md-6 col-lg-4">
            <div class="card course-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text text-muted">${course.description.substring(0, 100)}...</p>
                    <div class="mb-2">
                        <span class="badge bg-success">${getLevelText(course.level)}</span>
                    </div>
                    <p class="mb-1"><strong>Преподаватель:</strong> ${course.teacher}</p>
                    <p class="mb-1"><strong>Продолжительность:</strong> ${course.total_length} недель</p>
                    <p class="mb-1"><strong>Часов в неделю:</strong> ${course.week_length}</p>
                    <p class="mb-3"><strong>Стоимость:</strong> ${course.course_fee_per_hour} ₽/час</p>
                    <button class="btn btn-success w-100" onclick="openOrderModal(${course.id})">
                        Подать заявку
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    renderCoursesPagination();
}

function renderCoursesPagination() {
    const pagination = document.getElementById('courses-pagination');
    const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);

    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }

    pagination.style.display = 'block';
    const ul = pagination.querySelector('ul');
    ul.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentCoursePage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentCoursePage = i;
            renderCourses();
            document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
        });
        ul.appendChild(li);
    }
}

function renderTutors() {
    const tutorsList = document.getElementById('tutors-list');
    const searchLanguage = document.getElementById('tutor-search-language').value;
    const searchLevel = document.getElementById('tutor-search-level').value;
    const searchExperience = document.getElementById('tutor-search-experience').value;

    let filtered = tutors;

    if (searchLanguage) {
        filtered = filtered.filter(tutor => 
            tutor.languages_offered.includes(searchLanguage)
        );
    }

    if (searchLevel) {
        filtered = filtered.filter(tutor => tutor.language_level === searchLevel);
    }
    
    if (searchExperience) {
        const minExp = parseInt(searchExperience);
        filtered = filtered.filter(tutor => tutor.work_experience >= minExp);
    }

    if (filtered.length === 0) {
        tutorsList.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Наставники не найдены</td></tr>';
        return;
    }

    tutorsList.innerHTML = filtered.map(tutor => `
        <tr class="${selectedTutor && selectedTutor.id === tutor.id ? 'tutor-selected' : ''}" 
            onclick="selectTutor(${tutor.id})">
            <td>
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&size=50&background=random" 
                     alt="${tutor.name}" 
                     class="rounded-circle" 
                     width="50" 
                     height="50">
            </td>
            <td>${tutor.name}</td>
            <td><span class="badge bg-info">${getLevelText(tutor.language_level)}</span></td>
            <td>${tutor.languages_spoken.join(', ')}</td>
            <td>${tutor.work_experience}</td>
            <td>${tutor.price_per_hour} ₽</td>
            <td>
                <button class="btn btn-sm btn-success" onclick="event.stopPropagation(); selectTutorAndOrder(${tutor.id})">
                    Выбрать
                </button>
            </td>
        </tr>
    `).join('');
}

function populateLanguageFilter() {
    const languageSelect = document.getElementById('tutor-search-language');
    const languages = new Set();
    
    tutors.forEach(tutor => {
        tutor.languages_offered.forEach(lang => languages.add(lang));
    });

    Array.from(languages).sort().forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });
}

function selectTutor(tutorId) {
    selectedTutor = tutors.find(t => t.id === tutorId);
    renderTutors();
}

function selectTutorAndOrder(tutorId) {
    selectTutor(tutorId);
    showNotification('Наставник выбран! Функция заявки к наставнику в разработке.', 'info');
}

function getLevelText(level) {
    const levels = {
        'Beginner': 'Начальный',
        'Intermediate': 'Средний',
        'Advanced': 'Продвинутый'
    };
    return levels[level] || level;
}

function initSearchListeners() {
    document.getElementById('course-search-name').addEventListener('input', filterCourses);
    document.getElementById('course-search-level').addEventListener('change', filterCourses);
    document.getElementById('tutor-search-language').addEventListener('change', renderTutors);
    document.getElementById('tutor-search-level').addEventListener('change', renderTutors);
    document.getElementById('tutor-search-experience').addEventListener('input', renderTutors);
}

function filterCourses() {
    const searchName = document.getElementById('course-search-name').value.toLowerCase();
    const searchLevel = document.getElementById('course-search-level').value;

    filteredCourses = courses.filter(course => {
        const nameMatch = course.name.toLowerCase().includes(searchName);
        const levelMatch = !searchLevel || course.level === searchLevel;
        return nameMatch && levelMatch;
    });

    currentCoursePage = 1;
    renderCourses();
}

function initOrderForm() {
    document.getElementById('date-start').addEventListener('change', onDateChange);
    document.getElementById('time-start').addEventListener('change', onTimeChange);
    document.getElementById('persons').addEventListener('input', calculatePrice);
    
    const checkboxes = ['supplementary', 'personalized', 'excursions', 'assessment', 'interactive'];
    checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', calculatePrice);
    });
    
    document.getElementById('submitOrder').addEventListener('click', submitOrder);
}

async function openOrderModal(courseId) {
    try {
        selectedCourse = await api.getCourse(courseId);
        
        document.getElementById('course-id').value = selectedCourse.id;
        document.getElementById('tutor-id').value = 0;
        document.getElementById('course-name').value = selectedCourse.name;
        document.getElementById('teacher-name').value = selectedCourse.teacher;
        document.getElementById('order-id').value = '';
        
        populateDateOptions(selectedCourse.start_dates);
        
        document.getElementById('date-start').selectedIndex = 0;
        document.getElementById('time-start').selectedIndex = 0;
        document.getElementById('time-start').disabled = true;
        document.getElementById('persons').value = 1;
        
        resetCheckboxes();
        calculatePrice();
        
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
    } catch (error) {
        showNotification('Ошибка загрузки данных программы: ' + error.message, 'danger');
    }
}

function populateDateOptions(startDates) {
    const dateSelect = document.getElementById('date-start');
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    
    const uniqueDates = [...new Set(startDates.map(dt => dt.split('T')[0]))];
    
    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDate(date);
        dateSelect.appendChild(option);
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function resetCheckboxes() {
    document.getElementById('supplementary').checked = false;
    document.getElementById('personalized').checked = false;
    document.getElementById('excursions').checked = false;
    document.getElementById('assessment').checked = false;
    document.getElementById('interactive').checked = false;
    document.getElementById('early-registration-display').checked = false;
    document.getElementById('group-enrollment-display').checked = false;
    document.getElementById('intensive-course-display').checked = false;
}

function onDateChange() {
    const selectedDate = document.getElementById('date-start').value;
    const timeSelect = document.getElementById('time-start');
    
    if (!selectedDate) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        return;
    }
    
    timeSelect.disabled = false;
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    const timesForDate = selectedCourse.start_dates.filter(dt => dt.startsWith(selectedDate));
    
    timesForDate.forEach(datetime => {
        const time = datetime.split('T')[1].substring(0, 5);
        const option = document.createElement('option');
        option.value = time;
        
        const startTime = time;
        const endTime = calculateEndTime(time, selectedCourse.week_length);
        option.textContent = `${startTime} - ${endTime}`;
        
        timeSelect.appendChild(option);
    });
}

function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function onTimeChange() {
    const selectedDate = document.getElementById('date-start').value;
    const selectedTime = document.getElementById('time-start').value;
    
    if (selectedDate && selectedTime) {
        const durationInfo = `${selectedCourse.total_length} недель (до ${calculateEndDate(selectedDate)})`;
        document.getElementById('duration-info').value = durationInfo;
        calculatePrice();
    }
}

function calculateEndDate(startDate) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (selectedCourse.total_length * 7));
    return formatDate(date.toISOString().split('T')[0]);
}

function calculatePrice() {
    if (!selectedCourse) {
        return;
    }
    
    const dateStart = document.getElementById('date-start').value;
    const timeStart = document.getElementById('time-start').value;
    const persons = parseInt(document.getElementById('persons').value) || 1;
    
    if (!dateStart || !timeStart) {
        document.getElementById('total-price').textContent = '0';
        return;
    }
    
    const courseFeePerHour = selectedCourse.course_fee_per_hour;
    const totalLength = selectedCourse.total_length;
    const weekLength = selectedCourse.week_length;
    const durationInHours = totalLength * weekLength;
    
    const isWeekend = isWeekendOrHoliday(dateStart);
    const weekendMultiplier = isWeekend ? 1.5 : 1;
    
    const [hours] = timeStart.split(':').map(Number);
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    
    if (hours >= 9 && hours < 12) {
        morningSurcharge = 400;
    }
    if (hours >= 18 && hours < 20) {
        eveningSurcharge = 1000;
    }
    
    let basePrice = (courseFeePerHour * durationInHours * weekendMultiplier) + 
                    morningSurcharge + eveningSurcharge;
    
    const isEarlyRegistration = checkEarlyRegistration(dateStart);
    const isGroupEnrollment = persons >= 5;
    const isIntensiveCourse = weekLength >= 5;
    
    document.getElementById('early-registration-display').checked = isEarlyRegistration;
    document.getElementById('group-enrollment-display').checked = isGroupEnrollment;
    document.getElementById('intensive-course-display').checked = isIntensiveCourse;
    
    if (isIntensiveCourse) {
        basePrice *= 1.2;
    }
    
    const supplementary = document.getElementById('supplementary').checked;
    const personalized = document.getElementById('personalized').checked;
    const excursions = document.getElementById('excursions').checked;
    const assessment = document.getElementById('assessment').checked;
    const interactive = document.getElementById('interactive').checked;
    
    if (supplementary) {
        basePrice += 2000 * persons;
    }
    if (personalized) {
        basePrice += 1500 * totalLength;
    }
    if (assessment) {
        basePrice += 300;
    }
    
    if (excursions) {
        basePrice *= 1.25;
    }
    if (interactive) {
        basePrice *= 1.5;
    }
    
    let finalPrice = basePrice * persons;
    
    if (isEarlyRegistration) {
        finalPrice *= 0.9;
    }
    if (isGroupEnrollment) {
        finalPrice *= 0.85;
    }
    
    document.getElementById('total-price').textContent = Math.round(finalPrice);
}

function isWeekendOrHoliday(dateStr) {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
}

function checkEarlyRegistration(dateStr) {
    const startDate = new Date(dateStr);
    const today = new Date();
    const diffTime = startDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 30;
}

async function submitOrder() {
    const orderData = {
        tutor_id: parseInt(document.getElementById('tutor-id').value),
        course_id: parseInt(document.getElementById('course-id').value),
        date_start: document.getElementById('date-start').value,
        time_start: document.getElementById('time-start').value,
        duration: selectedCourse.week_length,
        persons: parseInt(document.getElementById('persons').value),
        price: parseInt(document.getElementById('total-price').textContent),
        early_registration: document.getElementById('early-registration-display').checked,
        group_enrollment: document.getElementById('group-enrollment-display').checked,
        intensive_course: document.getElementById('intensive-course-display').checked,
        supplementary: document.getElementById('supplementary').checked,
        personalized: document.getElementById('personalized').checked,
        excursions: document.getElementById('excursions').checked,
        assessment: document.getElementById('assessment').checked,
        interactive: document.getElementById('interactive').checked
    };
    
    if (!orderData.date_start || !orderData.time_start) {
        showNotification('Пожалуйста, заполните все обязательные поля', 'warning');
        return;
    }
    
    try {
        await api.createOrder(orderData);
        showNotification('Заявка успешно создана!', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('orderModal'));
        modal.hide();
        
        document.getElementById('orderForm').reset();
    } catch (error) {
        showNotification('Ошибка при создании заявки: ' + error.message, 'danger');
    }
}