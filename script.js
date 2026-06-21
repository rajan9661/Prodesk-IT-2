

// ========== DOM REFERENCES ==========
const salaryInput = document.getElementById('salaryInput');
const setSalaryBtn = document.getElementById('setSalaryBtn');
const expenseForm = document.getElementById('expenseForm');
const expenseNameInput = document.getElementById('expenseName');
const expenseAmountInput = document.getElementById('expenseAmount');
const errorMsg = document.getElementById('errorMsg');

const displaySalary = document.getElementById('displaySalary');
const displaySpent = document.getElementById('displaySpent');
const displayRemaining = document.getElementById('displayRemaining');
const expenseList = document.getElementById('expenseList');


let salary = 0;
let expenses = [];
let pieChart = null; // will hold the Chart.js instance

// ========== INIT (runs on page load) ==========
function init() {
    loadFromStorage();
    renderAll();
}

// ========== STORAGE HELPERS ==========
function loadFromStorage() {
    // Parse salary
    const savedSalary = localStorage.getItem('cf_salary');
    salary = savedSalary ? Number(savedSalary) : 0;

    // Parse expenses (wrapped in try-catch to handle corrupt data)
    try {
        const savedExpenses = localStorage.getItem('cf_expenses');
        expenses = savedExpenses ? JSON.parse(savedExpenses) : [];
    } catch (err) {
        console.warn('Corrupt expense data; resetting.', err);
        expenses = [];
    }
}

function saveToStorage() {
    localStorage.setItem('cf_salary', salary);
    localStorage.setItem('cf_expenses', JSON.stringify(expenses));
}

// ========== RENDER FUNCTIONS ==========
function renderAll() {
    renderSummary();
    renderExpenseList();
    renderChart();
}

function renderSummary() {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = salary - totalSpent;

    displaySalary.textContent = formatCurrency(salary);
    displaySpent.textContent = formatCurrency(totalSpent);
    displayRemaining.textContent = formatCurrency(remaining);

    // Threshold alert: if remaining < 10% of salary, add warning class
    const parentDiv = displayRemaining.closest('.stat');
    if (salary > 0 && remaining < salary * 0.1) {
        parentDiv.classList.add('warning');
    } else {
        parentDiv.classList.remove('warning');
    }
}

function renderExpenseList() {
    expenseList.innerHTML = ''; // clear existing items

    expenses.forEach(exp => {
        const li = document.createElement('li');

        const info = document.createElement('span');
        info.textContent = `${exp.name} — ${formatCurrency(exp.amount)}`;

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.className = 'delete-btn';
        delBtn.setAttribute('aria-label', 'Delete expense');
        delBtn.addEventListener('click', () => deleteExpense(exp.id));

        li.appendChild(info);
        li.appendChild(delBtn);
        expenseList.appendChild(li);
    });
}

function renderChart() {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = Math.max(salary - totalSpent, 0);

    const ctx = document.getElementById('balanceChart').getContext('2d');

    // Destroy previous chart instance to avoid stacking issues
    if (pieChart) {
        pieChart.destroy();
    }

    pieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Spent', 'Remaining'],
            datasets: [{
                data: [totalSpent, remaining],
                backgroundColor: ['#f87171', '#34d399']
            }]
        },
        options: {
            responsive: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// ========== UTILITY ==========
function formatCurrency(num) {
    return '₹' + num.toLocaleString('en-IN');
}

function generateId() {
    // Simple unique id using timestamp + random suffix
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function showError(msg) {
    errorMsg.textContent = msg;
}
function clearError() {
    errorMsg.textContent = '';
}

// ========== EVENT HANDLERS ==========

// Set salary button
setSalaryBtn.addEventListener('click', () => {
    const value = Number(salaryInput.value);

    if (!salaryInput.value || value < 0) {
        showError('Enter a valid salary (0 or more).');
        return;
    }

    clearError();
    salary = value;
    saveToStorage();
    renderAll();
});

// Expense form submission
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = expenseNameInput.value.trim();
    const amount = Number(expenseAmountInput.value);

    // Validation: non-empty name, positive amount
    if (!name) {
        showError('Expense name cannot be empty.');
        return;
    }
    if (!expenseAmountInput.value || amount <= 0) {
        showError('Enter a positive expense amount.');
        return;
    }

    clearError();

    // Create new expense object
    const newExpense = {
        id: generateId(),
        name,
        amount
    };

    expenses.push(newExpense);
    saveToStorage();
    renderAll();

    // Reset form inputs
    expenseNameInput.value = '';
    expenseAmountInput.value = '';
});

// Delete expense (called from dynamically created buttons)
function deleteExpense(id) {
    expenses = expenses.filter(exp => exp.id !== id);
    saveToStorage();
    renderAll();
}

// ========== KICK OFF ==========
init();
