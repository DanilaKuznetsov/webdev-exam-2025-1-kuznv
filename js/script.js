const API_BASE = 'https://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY = 'fd63a9de-01a4-4c2f-b9a3-9e6884626a1f';

// Загрузка данных
async function loadData() {
    await Promise.all([
        fetchData('courses', 'coursesTable'),
        fetchData('tutors', 'tutorsTable'),
        fetchData('orders', 'ordersTable')
    ]);
}

async function fetchData(endpoint, tableId) {
    try {
        const res = await fetch(`${API_BASE}/api/${endpoint}`, {
            headers: { 'X-API-Key': API_KEY }
        });
        const data = await res.json();
        populateTable(tableId, data);
    } catch (e) {
        console.error('API error:', e);
    }
}

function populateTable(tableId, data) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    tbody.innerHTML = data.map(item => {
        const row = `<tr><td>${item.id}</td>`;
        if (tableId.includes('courses')) row += `<td>${item.name}</td><td>${item.teacher}</td><td>${item.coursefeeperhour}</td>`;
        if (tableId.includes('tutors')) row += `<td>${item.name}</td><td>${item.workexperience}</td><td>${item.priceperhour}</td>`;
        if (tableId.includes('orders')) row += `<td>${item.datestart}</td><td>${item.price}</td><td><button onclick="editOrder(${item.id})">Edit</button> <button onclick="deleteOrder(${item.id})">Delete</button></td>`;
        return row + '</tr>';
    }).join('');
}

// CRUD Orders
document.getElementById('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const order = {
        tutorid: parseInt(document.getElementById('tutorid').value),
        courseid: parseInt(document.getElementById('courseid').value),
        datestart: document.getElementById('datestart').value,
        timestart: document.getElementById('timestart').value,
        duration: parseInt(document.getElementById('duration').value),
        persons: parseInt(document.getElementById('persons').value),
        earlyregistration: document.getElementById('earlyregistration').checked
    };
    await createOrder(order);
    loadData();
});

async function createOrder(order) {
    const res = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
        body: JSON.stringify(order)
    });
    return res.json();
}

async function deleteOrder(id) {
    await fetch(`${API_BASE}/api/orders/${id}`, { method: 'DELETE', headers: { 'X-API-Key': API_KEY } });
    loadData();
}

// Расчет цены (3.3.5)
function calculatePrice() {
    const fee = 200; // courseFeePerHour пример
    const duration = parseInt(document.getElementById('duration').value) || 1;
    const persons = parseInt(document.getElementById('persons').value) || 1;
    let price = fee * duration;
    if (document.getElementById('earlyregistration').checked) price *= 0.9;
    alert(`Цена: ${price * persons} руб`);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) { return new bootstrap.Tooltip(tooltipTriggerEl); });
});
