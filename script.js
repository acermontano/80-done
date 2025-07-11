// Helper function to display messages
function showMessage(message, type = 'info') {
    const messageDisplay = document.getElementById('message-display');
    if (messageDisplay) {
        messageDisplay.textContent = message;
        messageDisplay.className = `message-box ${type}`;
        messageDisplay.style.display = 'block';
        setTimeout(() => {
            messageDisplay.style.display = 'none';
        }, 3000);
    } else {
        console.log(`Message: ${message}`);
    }
}

// Helper function to generate distinct colors for the pie chart
function generateColors(numColors) {
    const colors = [];
    const baseHue = Math.floor(Math.random() * 360);
    for (let i = 0; i < numColors; i++) {
        const hue = (baseHue + (i * (360 / numColors))) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`);
    }
    return colors;
}

// Global variables for chart instances
let myPieChart;
let monthlyChart;

// Function to update the pie chart (for expenses by category)
function updatePieChart() {
    const ctx = document.getElementById('myPieChart');
    if (!ctx) {
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const categorySpending = {};
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            if (categorySpending[transaction.category]) {
                categorySpending[transaction.category] += transaction.amount;
            } else {
                categorySpending[transaction.category] = transaction.amount;
            }
        }
    });

    const labels = Object.keys(categorySpending);
    const data = Object.values(categorySpending);
    const backgroundColors = generateColors(labels.length);

    if (myPieChart) {
        myPieChart.data.labels = labels;
        myPieChart.data.datasets[0].data = data;
        myPieChart.data.datasets[0].backgroundColor = backgroundColors;
        myPieChart.update();
    } else {
        myPieChart = new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Spending Breakdown by Category',
                        color: '#ffffff'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += 'PHP ' + context.parsed.toFixed(2);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}

// Function to update the monthly spending comparison chart (Income vs. Expense)
function updateMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) {
        return;
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const monthlyData = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!monthlyData[yearMonth]) {
            monthlyData[yearMonth] = { income: 0, expense: 0 };
        }

        if (transaction.type === 'income') {
            monthlyData[yearMonth].income += transaction.amount;
        } else if (transaction.type === 'expense') {
            monthlyData[yearMonth].expense += transaction.amount;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const monthlyIncomes = sortedMonths.map(month => monthlyData[month].income);
    const monthlyExpenses = sortedMonths.map(month => monthlyData[month].expense);

    if (monthlyChart) {
        monthlyChart.data.labels = sortedMonths;
        monthlyChart.data.datasets[0].data = monthlyIncomes;
        monthlyChart.data.datasets[1].data = monthlyExpenses;
        monthlyChart.update();
    } else {
        monthlyChart = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyIncomes,
                        backgroundColor: 'rgba(29, 185, 84, 0.8)',
                        borderColor: 'rgba(29, 185, 84, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: monthlyExpenses,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Monthly Income vs. Expenses',
                        color: '#ffffff'
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff'
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#ffffff',
                            callback: function(value) {
                                return 'PHP ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
}


// Function to render transactions in the list
function renderTransactions(filterCategory = 'all', filterType = 'all') {
    const transactionList = document.getElementById('transaction-list');
    if (!transactionList) return;

    transactionList.innerHTML = '';
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const filteredTransactions = transactions.filter(transaction => {
        const categoryMatch = filterCategory === 'all' || transaction.category === filterCategory;
        const typeMatch = filterType === 'all' || transaction.type === filterType;
        return categoryMatch && typeMatch;
    });

    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No transactions yet.';
        transactionList.appendChild(listItem);
    } else {
        filteredTransactions.forEach((transaction, index) => {
            const listItem = document.createElement('li');
            const sign = transaction.type === 'expense' ? '-' : '+' ;
            const amountColor = transaction.type === 'expense' ? 'red' : '#1DB954';

            const originalIndex = transactions.findIndex(t =>
                t.description === transaction.description &&
                t.amount === transaction.amount &&
                t.category === transaction.category &&
                t.type === transaction.type &&
                t.date === transaction.date
            );

            listItem.innerHTML = `
                <span>${transaction.description} (${transaction.category}) - <span style="color: ${amountColor};">${sign}PHP ${transaction.amount.toFixed(2)}</span></span>
                ${transactionList.id === 'transaction-list' ? `<span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>` : ''}
                <button class="delete-btn" data-original-index="${originalIndex}">Delete</button>
            `;
            transactionList.appendChild(listItem);
        });
    }
    updatePieChart();
    updateMonthlyChart();
    updateRemainingBudget();
    updateBalance();
    updateCurrentMonthlyIncome();
    attachDeleteButtonListeners();
}

// Attach event listeners for delete buttons (delegation for dynamic elements)
function attachDeleteButtonListeners() {
    const transactionList = document.getElementById('transaction-list');
    if (transactionList) {
        transactionList.removeEventListener('click', handleDeleteClick);
        transactionList.addEventListener('click', handleDeleteClick);
    }
}

function handleDeleteClick(event) {
    if (event.target.classList.contains('delete-btn')) {
        const originalIndex = parseInt(event.target.dataset.originalIndex);
        deleteTransaction(originalIndex);
    }
}

// Function to delete a transaction
function deleteTransaction(index) {
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    if (index > -1 && index < transactions.length) {
        transactions.splice(index, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        showMessage('Transaction deleted successfully!', 'success');
        renderTransactions();
        updatePieChart();
        updateMonthlyChart();
        updateRemainingBudget();
        updateBalance();
        updateCurrentMonthlyIncome();
    } else {
        showMessage('Error: Transaction not found.', 'error');
    }
}


// Function to update the remaining budget display
function updateRemainingBudget() {
    const currentBudgetSpan = document.getElementById('current-budget');
    const remainingBudgetSpan = document.getElementById('remaining-budget');
    if (!currentBudgetSpan || !remainingBudgetSpan) return;

    const currentBudget = parseFloat(localStorage.getItem('spendifyBudget')) || 0;
    currentBudgetSpan.textContent = currentBudget.toFixed(2);

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const totalExpenses = transactions.reduce((sum, transaction) => {
        return transaction.type === 'expense' ? sum + transaction.amount : sum;
    }, 0);

    const remaining = currentBudget - totalExpenses;
    remainingBudgetSpan.textContent = remaining.toFixed(2);
}

// Function to update the current balance display
function updateBalance() {
    const balanceAmount = document.getElementById('balance-amount');
    if (!balanceAmount) return;

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const netBalance = transactions.reduce((sum, transaction) => {
        return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
    }, 0);

    balanceAmount.textContent = `PHP ${netBalance.toFixed(2)}`;
}

// Function to update the current monthly income display
function updateCurrentMonthlyIncome() {
    const currentMonthlyIncomeSpan = document.getElementById('current-monthly-income');
    if (!currentMonthlyIncomeSpan) return;

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const totalMonthlyIncome = transactions.reduce((sum, transaction) => {
        const transactionDate = new Date(transaction.date);
        if (transaction.type === 'income' &&
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear) {
            return sum + transaction.amount;
        }
        return sum;
    }, 0);

    currentMonthlyIncomeSpan.textContent = totalMonthlyIncome.toFixed(2);
}


// Event Listeners for DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    
    const incomeInput = document.getElementById('income-input');
    const setIncomeBtn = document.getElementById('set-income-btn');

    if (setIncomeBtn) {
        setIncomeBtn.addEventListener('click', () => {
            const income = parseFloat(incomeInput.value);
            if (!isNaN(income) && income >= 0) {
                const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                transactions.push({
                    description: 'Monthly Income',
                    amount: income,
                    category: 'salary',
                    type: 'income',
                    date: new Date().toISOString()
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));
                showMessage('Monthly income added successfully!', 'success');
                incomeInput.value = '';
                renderTransactions();
            } else {
                showMessage('Please enter a valid positive number for your monthly income.', 'error');
            }
        });
    }

    const toggleButton = document.getElementById('toggle-achievements');
    const achievementList = document.getElementById('achievement-list');
    if (toggleButton && achievementList) {
        toggleButton.addEventListener('click', () => {
            achievementList.classList.toggle('hidden');
        });
    }

    const transactionForm = document.getElementById('transaction-form');
    const filterCategory = document.getElementById('filter-category');
    const filterType = document.getElementById('filter-type');

    if (transactionForm) {
        transactionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const type = document.getElementById('transaction-type').value;

            if (description && !isNaN(amount) && amount > 0 && category && type) {
                const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                transactions.push({
                    description,
                    amount,
                    category,
                    type,
                    date: new Date().toISOString()
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));
                showMessage('Transaction added successfully!', 'success');
                transactionForm.reset();
                renderTransactions(filterCategory ? filterCategory.value : 'all', filterType ? filterType.value : 'all');
            } else {
                showMessage('Please fill in all transaction details correctly.', 'error');
            }
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', () => {
            renderTransactions(filterCategory.value, filterType ? filterType.value : 'all');
        });
    }

    if (filterType) {
        filterType.addEventListener('change', () => {
            renderTransactions(filterCategory ? filterCategory.value : 'all', filterType.value);
        });
    }

    const budgetInput = document.getElementById('budget-input');
    const setBudgetBtn = document.getElementById('set-budget-btn');

    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            const budget = parseFloat(budgetInput.value);
            if (!isNaN(budget) && budget >= 0) {
                localStorage.setItem('spendifyBudget', budget);
                showMessage('Budget set successfully!', 'success');
                budgetInput.value = '';
                updateRemainingBudget();
            } else {
                showMessage('Please enter a valid positive number for your budget.', 'error');
            }
        });
    }

    renderTransactions();
    updatePieChart();
    updateMonthlyChart();
    updateBalance();
    updateRemainingBudget();
    updateCurrentMonthlyIncome();


    window.addEventListener('storage', (event) => {
        if (event.key === 'transactions' || event.key === 'spendifyBudget') {
            console.log('localStorage change detected in another tab/window. Updating UI...');
            renderTransactions();
            updateBalance();
            updateRemainingBudget();
            updateCurrentMonthlyIncome();
        }
    });

    const settingsButton = document.getElementById('settingsButton');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const themeSelect = document.getElementById('theme');
    const currencySelect = document.getElementById('currency');
    const spendingLimitInput = document.getElementById('spending-limit');
    const setLimitButton = document.getElementById('set-limit');
    const setAlertsButton = document.getElementById('set-alerts');
    const alertSettingsDiv = document.getElementById('alert-settings');
    const recurringDescriptionInput = document.getElementById('recurring-description');
    const recurringAmountInput = document.getElementById('recurring-amount');
    const addRecurringButton = document.getElementById('add-recurring');
    const recurringList = document.getElementById('recurring-list');
    const notificationButton = document.getElementById('notificationButton');


    if (settingsButton && settingsDropdown) {
        settingsButton.addEventListener('click', () => {
            settingsDropdown.style.display = settingsDropdown.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', (event) => {
            if (!settingsButton.contains(event.target) && !settingsDropdown.contains(event.target)) {
                settingsDropdown.style.display = 'none';
            }
        });
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', (event) => {
            document.body.className = event.target.value;
        });
    }

    if (currencySelect) {
        currencySelect.addEventListener('change', (event) => {
            localStorage.setItem('selectedCurrency', event.target.value);
            updateBalance();
            renderTransactions();
        });
        const savedCurrency = localStorage.getItem('selectedCurrency') || 'PHP';
        currencySelect.value = savedCurrency;
    }

    if (setLimitButton) {
        setLimitButton.addEventListener('click', () => {
            const limit = parseFloat(spendingLimitInput.value);
            if (!isNaN(limit) && limit >= 0) {
                localStorage.setItem('spendingLimit', limit);
                showMessage('Spending limit set!', 'success');
            } else {
                showMessage('Please enter a valid spending limit.', 'error');
            }
        });
        const savedLimit = localStorage.getItem('spendingLimit');
        if (spendingLimitInput && savedLimit) {
            spendingLimitInput.value = savedLimit;
        }
    }

    if (setAlertsButton && alertSettingsDiv) {
        setAlertsButton.addEventListener('click', () => {
            alertSettingsDiv.style.display = 'block';
            showMessage('Alerts for billing dates and spending limits will be set.', 'info');
        });
    }

    function renderRecurringPayments() {
        if (!recurringList) return;
        recurringList.innerHTML = '';
        const recurringPayments = JSON.parse(localStorage.getItem('recurringPayments')) || [];
        recurringPayments.forEach((payment, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${payment.description}: PHP ${payment.amount.toFixed(2)} <button class="delete-recurring-btn" data-index="${index}">Delete</button>`;
            recurringList.appendChild(li);
        });
    }

    if (addRecurringButton) {
        addRecurringButton.addEventListener('click', () => {
            const description = recurringDescriptionInput.value.trim();
            const amount = parseFloat(recurringAmountInput.value);
            if (description && !isNaN(amount) && amount > 0) {
                const recurringPayments = JSON.parse(localStorage.getItem('recurringPayments')) || [];
                recurringPayments.push({ description, amount });
                localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
                showMessage('Recurring payment added!', 'success');
                recurringDescriptionInput.value = '';
                recurringAmountInput.value = '';
                renderRecurringPayments();
            } else {
                showMessage('Please enter valid recurring payment details.', 'error');
            }
        });
    }

    if (recurringList) {
        recurringList.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-recurring-btn')) {
                const index = parseInt(event.target.dataset.index);
                let recurringPayments = JSON.parse(localStorage.getItem('recurringPayments')) || [];
                if (index > -1 && index < recurringPayments.length) {
                    recurringPayments.splice(index, 1);
                    localStorage.setItem('recurringPayments', JSON.stringify(recurringPayments));
                    showMessage('Recurring payment deleted.', 'info');
                    renderRecurringPayments();
                }
            }
        });
    }
    renderRecurringPayments();

    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            showMessage('No new notifications.', 'info');
        });
    }

    // --- User Profile Specific Logic ---
    const userNameInput = document.getElementById('user-name');
    const userTitleInput = document.getElementById('user-title');
    const aboutMeTextarea = document.getElementById('about-me');
    const hobbiesTextarea = document.getElementById('hobbies');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const profilePic = document.getElementById('profile-pic'); // Assuming you want to update this too later

    // Function to load user profile data
    function loadUserProfile() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
        if (userNameInput) userNameInput.value = userProfile.name || 'John Doe';
        if (userTitleInput) userTitleInput.value = userProfile.title || 'Financial Enthusiast';
        if (aboutMeTextarea) aboutMeTextarea.value = userProfile.aboutMe || '';
        if (hobbiesTextarea) hobbiesTextarea.value = (userProfile.hobbies || []).join('\n'); // Join array into new lines
        // You might also update the profile picture if a URL is stored
        // if (profilePic && userProfile.profilePicUrl) profilePic.src = userProfile.profilePicUrl;
    }

    // Function to save user profile data
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', () => {
            const userProfile = {
                name: userNameInput ? userNameInput.value : 'John Doe',
                title: userTitleInput ? userTitleInput.value : 'Financial Enthusiast',
                aboutMe: aboutMeTextarea ? aboutMeTextarea.value : '',
                hobbies: hobbiesTextarea ? hobbiesTextarea.value.split('\n').map(h => h.trim()).filter(h => h) : [], // Split by new line
                // profilePicUrl: profilePic ? profilePic.src : 'https://i.pravatar.cc/150'
            };
            localStorage.setItem('userProfile', JSON.stringify(userProfile));
            showMessage('Profile saved successfully!', 'success');
        });
    }

    // Load profile data when the userprof.html page loads
    if (document.querySelector('.profile-container')) { // Check if we are on the profile page
        loadUserProfile();
    }
    // --- End User Profile Specific Logic ---

});

document.addEventListener('DOMContentLoaded', () => {
    // Correctly target the logout button by its ID 'logoutButton'
    const logoutButton = document.getElementById('logoutButton'); 

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            // Optionally, clear local storage or session storage here if needed for a full logout
            // localStorage.clear(); 
            // sessionStorage.clear();
            window.location.href = 'login spendify.html'; 
        });
    }
});
