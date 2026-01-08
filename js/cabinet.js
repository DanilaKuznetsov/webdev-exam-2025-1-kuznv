let orders = [];
let currentOrdersPage = 1;
const ITEMS_PER_PAGE = 5;
let orderToDelete = null;
let currentCourse = null;
let coursesCache = {};

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    initCabinetListeners();
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

async function loadOrders() {
    try {
        orders = await api.getOrders();
        
        for (const order of orders) {
            if (order.course_id && !coursesCache[order.course_id]) {
                try {
                    coursesCache[order.course_id] = await api.getCourse(order.course_id);
                } catch (error) {
                    console.error(`Error loading course ${order.course_id}:`, error);
                }
            }
        }
        
        renderOrders();
    } catch (error) {
        showNotification('Ошибка загрузки заявок: ' + error.message, 'danger');
    }
}

function getCourseName(order) {
    if (order.course_id && coursesCache[order.course_id]) {
        return coursesCache[order.course_id].name;
    }
    return order.course_id ? `Программа #${order.course_id}` : `Наставник #${order.tutor_id}`;
}

function renderOrders() {
    const noOrders = document.getElementById('no-orders');
    const ordersTableContainer = document.getElementById('orders-table-container');
    
    if (orders.length === 0) {
        noOrders.style.display = 'block';
        ordersTableContainer.style.display = 'none';
        return;
    }
    
    noOrders.style.display = 'none';
    ordersTableContainer.style.display = 'block';
    
    const startIndex = (currentOrdersPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const ordersToShow = orders.slice(startIndex, endIndex);
    
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = ordersToShow.map((order, index) => `
        <tr>
            <td>${startIndex + index + 1}</td>
            <td>${getCourseName(order)}</td>
            <td>${formatDate(order.date_start)} ${order.time_start}</td>
            <td>${order.price} ₽</td>
            <td>
                <button class="btn btn-sm btn-info me-1 mb-1" onclick="showOrderDetails(${order.id})">
                    <i class="bi bi-eye"></i> Подробнее
                </button>
                <button class="btn btn-sm btn-success me-1 mb-1" onclick="editOrder(${order.id})">
                    <i class="bi bi-pencil"></i> Изменить
                </button>
                <button class="btn btn-sm btn-danger mb-1" onclick="confirmDeleteOrder(${order.id})">
                    <i class="bi bi-trash"></i> Удалить
                </button>
            </td>
        </tr>
    `).join('');
    
    renderOrdersPagination();
}

function renderOrdersPagination() {
    const pagination = document.getElementById('orders-pagination');
    const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        pagination.style.display = 'none';
        return;
    }
    
    pagination.style.display = 'block';
    const ul = pagination.querySelector('ul');
    ul.innerHTML = '';
    
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentOrdersPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            currentOrdersPage = i;
            renderOrders();
        });
        ul.appendChild(li);
    }
}

async function showOrderDetails(orderId) {
    try {
        const order = await api.getOrder(orderId);
        const course = order.course_id ? await api.getCourse(order.course_id) : null;
        
        const priceDetails = calculatePriceBreakdown(order, course);
        
        const content = document.getElementById('orderDetailsContent');
        content.innerHTML = `
            <div class="mb-3">
                <strong>Номер заявки:</strong> ${order.id}
            </div>
            ${course ? `
                <div class="mb-3">
                    <strong>Название программы:</strong> ${course.name}
                </div>
                <div class="mb-3">
                    <strong>Описание:</strong> ${course.description}
                </div>
                <div class="mb-3">
                    <strong>Преподаватель:</strong> ${course.teacher}
                </div>
            ` : `
                <div class="mb-3">
                    <strong>Наставник ID:</strong> ${order.tutor_id}
                </div>
            `}
            <div class="mb-3">
                <strong>Дата начала:</strong> ${formatDate(order.date_start)}
            </div>
            <div class="mb-3">
                <strong>Время:</strong> ${order.time_start}
            </div>
            <div class="mb-3">
                <strong>Продолжительность:</strong> ${order.duration} ч/нед
            </div>
            <div class="mb-3">
                <strong>Количество участников:</strong> ${order.persons}
            </div>
            <hr>
            <h6>Расчет стоимости:</h6>
            <div class="price-breakdown mb-3">
                ${priceDetails}
            </div>
            <div class="mb-3">
                <strong>Итоговая стоимость:</strong> <span class="fs-5 text-success">${order.price} ₽</span>
            </div>
            <hr>
            <h6>Применённые опции:</h6>
            <div>
                ${order.early_registration ? '<span class="badge bg-success me-1 mb-1">Ранняя регистрация (-10%)</span>' : ''}
                ${order.group_enrollment ? '<span class="badge bg-success me-1 mb-1">Групповая скидка (-15%)</span>' : ''}
                ${order.intensive_course ? '<span class="badge bg-warning me-1 mb-1">Интенсивный курс (+20%)</span>' : ''}
                ${order.supplementary ? '<span class="badge bg-info me-1 mb-1">Доп. материалы</span>' : ''}
                ${order.personalized ? '<span class="badge bg-info me-1 mb-1">Индивидуальные занятия</span>' : ''}
                ${order.excursions ? '<span class="badge bg-info me-1 mb-1">Экскурсии</span>' : ''}
                ${order.assessment ? '<span class="badge bg-info me-1 mb-1">Оценка уровня</span>' : ''}
                ${order.interactive ? '<span class="badge bg-info me-1 mb-1">Интерактивная платформа</span>' : ''}
            </div>
        `;
        
        const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
        modal.show();
    } catch (error) {
        showNotification('Ошибка загрузки данных заявки: ' + error.message, 'danger');
    }
}

function calculatePriceBreakdown(order, course) {
    if (!course) return '';
    
    const courseFeePerHour = course.course_fee_per_hour;
    const totalLength = course.total_length;
    const weekLength = course.week_length;
    const durationInHours = totalLength * weekLength;
    const persons = order.persons;
    
    let breakdown = `<p><small>Базовая стоимость: ${courseFeePerHour} ₽/час × ${durationInHours} часов = ${courseFeePerHour * durationInHours} ₽</small></p>`;
    
    const isWeekend = isWeekendOrHoliday(order.date_start);
    if (isWeekend) {
        breakdown += `<p class="surcharge"><small>Множитель за выходные: ×1.5</small></p>`;
    }
    
    const [hours] = order.time_start.split(':').map(Number);
    if (hours >= 9 && hours < 12) {
        breakdown += `<p class="surcharge"><small>Утренняя надбавка: +400 ₽</small></p>`;
    }
    if (hours >= 18 && hours < 20) {
        breakdown += `<p class="surcharge"><small>Вечерняя надбавка: +1000 ₽</small></p>`;
    }
    
    if (order.intensive_course) {
        breakdown += `<p class="surcharge"><small>Интенсивный курс: +20%</small></p>`;
    }
    
    if (order.supplementary) {
        breakdown += `<p class="surcharge"><small>Доп. материалы: +${2000 * persons} ₽</small></p>`;
    }
    
    if (order.personalized) {
        breakdown += `<p class="surcharge"><small>Индивидуальные занятия: +${1500 * totalLength} ₽</small></p>`;
    }
    
    if (order.assessment) {
        breakdown += `<p class="surcharge"><small>Оценка уровня: +300 ₽</small></p>`;
    }
    
    if (order.excursions) {
        breakdown += `<p class="surcharge"><small>Экскурсии: +25%</small></p>`;
    }
    
    if (order.interactive) {
        breakdown += `<p class="surcharge"><small>Интерактивная платформа: +50%</small></p>`;
    }
    
    breakdown += `<p><small>Количество участников: ×${persons}</small></p>`;
    
    if (order.early_registration) {
        breakdown += `<p class="discount"><small>Скидка за раннюю регистрацию: -10%</small></p>`;
    }
    
    if (order.group_enrollment) {
        breakdown += `<p class="discount"><small>Групповая скидка: -15%</small></p>`;
    }
    
    return breakdown;
}

async function editOrder(orderId) {
    try {
        const order = await api.getOrder(orderId);
        currentCourse = await api.getCourse(order.course_id);
        
        document.getElementById('edit-order-id').value = order.id;
        document.getElementById('edit-course-id').value = order.course_id;
        document.getElementById('edit-course-name').value = currentCourse.name;
        document.getElementById('edit-teacher-name').value = currentCourse.teacher;
        
        populateEditDateOptions(currentCourse.start_dates);
        document.getElementById('edit-date-start').value = order.date_start;
        
        onEditDateChange();
        document.getElementById('edit-time-start').value = order.time_start;
        
        document.getElementById('edit-persons').value = order.persons;
        document.getElementById('edit-supplementary').checked = order.supplementary;
        document.getElementById('edit-personalized').checked = order.personalized;
        document.getElementById('edit-excursions').checked = order.excursions;
        document.getElementById('edit-assessment').checked = order.assessment;
        document.getElementById('edit-interactive').checked = order.interactive;
        
        onEditTimeChange();
        calculateEditPrice();
        
        const modal = new bootstrap.Modal(document.getElementById('editOrderModal'));
        modal.show();
    } catch (error) {
        showNotification('Ошибка загрузки данных для редактирования: ' + error.message, 'danger');
    }
}

function populateEditDateOptions(startDates) {
    const dateSelect = document.getElementById('edit-date-start');
    dateSelect.innerHTML = '<option value="">Выберите дату</option>';
    
    const uniqueDates = [...new Set(startDates.map(dt => dt.split('T')[0]))];
    
    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = formatDate(date);
        dateSelect.appendChild(option);
    });
}

function onEditDateChange() {
    const selectedDate = document.getElementById('edit-date-start').value;
    const timeSelect = document.getElementById('edit-time-start');
    
    if (!selectedDate) {
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="">Сначала выберите дату</option>';
        return;
    }
    
    timeSelect.disabled = false;
    timeSelect.innerHTML = '<option value="">Выберите время</option>';
    
    const timesForDate = currentCourse.start_dates.filter(dt => dt.startsWith(selectedDate));
    
    timesForDate.forEach(datetime => {
        const time = datetime.split('T')[1].substring(0, 5);
        const option = document.createElement('option');
        option.value = time;
        
        const endTime = calculateEndTime(time, currentCourse.week_length);
        option.textContent = `${time} - ${endTime}`;
        
        timeSelect.appendChild(option);
    });
}

function onEditTimeChange() {
    const selectedDate = document.getElementById('edit-date-start').value;
    const selectedTime = document.getElementById('edit-time-start').value;
    
    if (selectedDate && selectedTime) {
        const durationInfo = `${currentCourse.total_length} недель (до ${calculateEndDate(selectedDate, currentCourse.total_length)})`;
        document.getElementById('edit-duration-info').value = durationInfo;
        calculateEditPrice();
    }
}

function calculateEditPrice() {
    if (!currentCourse) return;
    
    const dateStart = document.getElementById('edit-date-start').value;
    const timeStart = document.getElementById('edit-time-start').value;
    const persons = parseInt(document.getElementById('edit-persons').value) || 1;
    
    if (!dateStart || !timeStart) {
        document.getElementById('edit-total-price').textContent = '0';
        return;
    }
    
    const courseFeePerHour = currentCourse.course_fee_per_hour;
    const totalLength = currentCourse.total_length;
    const weekLength = currentCourse.week_length;
    const durationInHours = totalLength * weekLength;
    
    const isWeekend = isWeekendOrHoliday(dateStart);
    const weekendMultiplier = isWeekend ? 1.5 : 1;
    
    const [hours] = timeStart.split(':').map(Number);
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    
    if (hours >= 9 && hours < 12) morningSurcharge = 400;
    if (hours >= 18 && hours < 20) eveningSurcharge = 1000;
    
    let basePrice = (courseFeePerHour * durationInHours * weekendMultiplier) + 
                    morningSurcharge + eveningSurcharge;
    
    const isEarlyRegistration = checkEarlyRegistration(dateStart);
    const isGroupEnrollment = persons >= 5;
    const isIntensiveCourse = weekLength >= 5;
    
    document.getElementById('edit-early-registration-display').checked = isEarlyRegistration;
    document.getElementById('edit-group-enrollment-display').checked = isGroupEnrollment;
    document.getElementById('edit-intensive-course-display').checked = isIntensiveCourse;
    
    if (isIntensiveCourse) basePrice *= 1.2;
    
    const supplementary = document.getElementById('edit-supplementary').checked;
    const personalized = document.getElementById('edit-personalized').checked;
    const excursions = document.getElementById('edit-excursions').checked;
    const assessment = document.getElementById('edit-assessment').checked;
    const interactive = document.getElementById('edit-interactive').checked;
    
    if (supplementary) basePrice += 2000 * persons;
    if (personalized) basePrice += 1500 * totalLength;
    if (assessment) basePrice += 300;
    if (excursions) basePrice *= 1.25;
    if (interactive) basePrice *= 1.5;
    
    let finalPrice = basePrice * persons;
    
    if (isEarlyRegistration) finalPrice *= 0.9;
    if (isGroupEnrollment) finalPrice *= 0.85;
    
    document.getElementById('edit-total-price').textContent = Math.round(finalPrice);
}

async function saveEditOrder() {
    const orderId = parseInt(document.getElementById('edit-order-id').value);
    
    const orderData = {
        tutor_id: 0,
        course_id: parseInt(document.getElementById('edit-course-id').value),
        date_start: document.getElementById('edit-date-start').value,
        time_start: document.getElementById('edit-time-start').value,
        duration: currentCourse.week_length,
        persons: parseInt(document.getElementById('edit-persons').value),
        price: parseInt(document.getElementById('edit-total-price').textContent),
        early_registration: document.getElementById('edit-early-registration-display').checked,
        group_enrollment: document.getElementById('edit-group-enrollment-display').checked,
        intensive_course: document.getElementById('edit-intensive-course-display').checked,
        supplementary: document.getElementById('edit-supplementary').checked,
        personalized: document.getElementById('edit-personalized').checked,
        excursions: document.getElementById('edit-excursions').checked,
        assessment: document.getElementById('edit-assessment').checked,
        interactive: document.getElementById('edit-interactive').checked
    };
    
    try {
        await api.updateOrder(orderId, orderData);
        showNotification('Заявка успешно обновлена!', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editOrderModal'));
        modal.hide();
        
        coursesCache = {};
        await loadOrders();
    } catch (error) {
        showNotification('Ошибка при обновлении заявки: ' + error.message, 'danger');
    }
}

function confirmDeleteOrder(orderId) {
    orderToDelete = orderId;
    const modal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    modal.show();
}

async function deleteOrder() {
    try {
        await api.deleteOrder(orderToDelete);
        showNotification('Заявка успешно удалена!', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteOrderModal'));
        modal.hide();
        
        await loadOrders();
        orderToDelete = null;
    } catch (error) {
        showNotification('Ошибка при удалении заявки: ' + error.message, 'danger');
    }
}

function initCabinetListeners() {
    document.getElementById('edit-date-start').addEventListener('change', onEditDateChange);
    document.getElementById('edit-time-start').addEventListener('change', onEditTimeChange);
    document.getElementById('edit-persons').addEventListener('input', calculateEditPrice);
    
    const checkboxes = ['edit-supplementary', 'edit-personalized', 'edit-excursions', 
                       'edit-assessment', 'edit-interactive'];
    checkboxes.forEach(id => {
        document.getElementById(id).addEventListener('change', calculateEditPrice);
    });
    
    document.getElementById('saveEditOrder').addEventListener('click', saveEditOrder);
    document.getElementById('confirmDelete').addEventListener('click', deleteOrder);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function calculateEndDate(startDate, weeks) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (weeks * 7));
    return formatDate(date.toISOString().split('T')[0]);
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