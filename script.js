// Helper function to display messages
function showMessage(message, type = 'info') {
    const messageDisplay = document.getElementById('message-display');
    if (messageDisplay) {
        messageDisplay.textContent = message;
        messageDisplay.className = `message-box ${type}`; // Add type for styling (e.g., 'error', 'success')
        messageDisplay.style.display = 'block';
        setTimeout(() => {
            messageDisplay.style.display = 'none';
        }, 3000); // Hide after 3 seconds
    } else {
        console.log(`Message: ${message}`); // Fallback for debugging if element not found
    }
}

// Helper function to generate distinct colors for the pie chart
function generateColors(numColors) {
    const colors = [];
    const baseHue = Math.floor(Math.random() * 360); // Start with a random hue
    for (let i = 0; i < numColors; i++) {
        // Distribute hues evenly around the color wheela
        const hue = (baseHue + (i * (360 / numColors))) % 360;
        colors.push(`hsla(${hue}, 70%, 60%, 0.8)`); // Use HSLA for better control over vibrancy and transparency
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
        return; // Exit if element not found (expected if not on a page with this canvas)
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Aggregate spending by category for expenses only
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

    // If a chart instance already exists, update its data
    if (myPieChart) {
        myPieChart.data.labels = labels;
        myPieChart.data.datasets[0].data = data;
        myPieChart.data.datasets[0].backgroundColor = backgroundColors;
        myPieChart.update();
    } else {
        // Otherwise, create a new chart instance
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
                maintainAspectRatio: false, // Allow canvas to resize freely
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: '#ffffff' // White color for legend text
                        }
                    },
                    title: {
                        display: true,
                        text: 'Spending Breakdown by Category',
                        color: '#ffffff' // White color for title
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
        return; // Exit if element not found (expected if not on a page with this canvas)
    }

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Aggregate income and expenses by month
    const monthlyData = {}; // { 'YYYY-MM': { income: 0, expense: 0 } }
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
                        backgroundColor: 'rgba(29, 185, 84, 0.8)', // Green for income
                        borderColor: 'rgba(29, 185, 84, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: monthlyExpenses,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)', // Red for expenses
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
    if (!transactionList) return; // Exit if element not found (e.g., on SPENDIFYpage.html if it doesn't have a transaction list)

    transactionList.innerHTML = '';
    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    const filteredTransactions = transactions.filter(transaction => {
        const categoryMatch = filterCategory === 'all' || transaction.category === filterCategory;
        const typeMatch = filterType === 'all' || transaction.type === filterType;
        return categoryMatch && typeMatch;
    });

    // Sort transactions by date, newest first
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filteredTransactions.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No transactions yet.';
        transactionList.appendChild(listItem);
    } else {
        filteredTransactions.forEach((transaction, index) => {
            const listItem = document.createElement('li');
            const sign = transaction.type === 'expense' ? '-' : '+' ;
            const amountColor = transaction.type === 'expense' ? 'red' : '#1DB954'; // Red for expense, green for income

            // Find the original index for deletion (important after filtering/sorting)
            const originalIndex = transactions.findIndex(t =>
                t.description === transaction.description &&
                t.amount === transaction.amount &&
                t.category === transaction.category &&
                t.type === transaction.type &&
                t.date === transaction.date // Use date for better uniqueness
            );

            listItem.innerHTML = `
                <span>${transaction.description} (${transaction.category}) - <span style="color: ${amountColor};">${sign}PHP ${transaction.amount.toFixed(2)}</span></span>
                ${transactionList.id === 'transaction-list' ? `<span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>` : ''}
                <button class="delete-btn" data-original-index="${originalIndex}">Delete</button>
            `;
            transactionList.appendChild(listItem);
        });
    }
    // Trigger chart and budget updates after rendering transactions
    updatePieChart();
    updateMonthlyChart(); // Update monthly chart as well
    updateRemainingBudget(); // For SPENDIFYpage.html
    updateBalance(); // For SPENDIFYpage.html
    updateCurrentMonthlyIncome(); // For SPENDIFYpage.html
    attachDeleteButtonListeners(); // Attach/re-attach listeners for delete buttons
}

// Attach event listeners for delete buttons (delegation for dynamic elements)
function attachDeleteButtonListeners() {
    const transactionList = document.getElementById('transaction-list');
    if (transactionList) {
        // Remove existing listener to prevent duplicates
        transactionList.removeEventListener('click', handleDeleteClick);
        // Add the new listener
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
        transactions.splice(index, 1); // Remove the transaction at the given index
        localStorage.setItem('transactions', JSON.stringify(transactions));
        showMessage('Transaction deleted successfully!', 'success');
        // Re-render and update all relevant UI elements
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
    if (!currentBudgetSpan || !remainingBudgetSpan) return; // Exit if elements not found

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
    if (!balanceAmount) return; // Exit if element not found

    const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Calculate net balance from all transactions
    const netBalance = transactions.reduce((sum, transaction) => {
        return transaction.type === 'income' ? sum + transaction.amount : sum - transaction.amount;
    }, 0);

    balanceAmount.textContent = `PHP ${netBalance.toFixed(2)}`;
}

// Function to update the current monthly income display
function updateCurrentMonthlyIncome() {
    const currentMonthlyIncomeSpan = document.getElementById('current-monthly-income');
    if (!currentMonthlyIncomeSpan) return; // Exit if element not found

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
    
    // Monthly Income Section Logic
    const incomeInput = document.getElementById('income-input');
    const setIncomeBtn = document.getElementById('set-income-btn');

    if (setIncomeBtn) {
        setIncomeBtn.addEventListener('click', () => {
            const income = parseFloat(incomeInput.value);
            if (!isNaN(income) && income >= 0) {
                const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                // Add income as a transaction with current date
                transactions.push({
                    description: 'Monthly Income',
                    amount: income,
                    category: 'salary',
                    type: 'income',
                    date: new Date().toISOString() // Store date in ISO format
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));
                showMessage('Monthly income added successfully!', 'success');
                incomeInput.value = '';
                renderTransactions(); // Re-render to update all displays
            } else {
                showMessage('Please enter a valid positive number for your monthly income.', 'error');
            }
        });
    }

    // Achievements Toggle (if applicable on a page)
    const toggleButton = document.getElementById('toggle-achievements');
    const achievementList = document.getElementById('achievement-list');
    if (toggleButton && achievementList) {
        toggleButton.addEventListener('click', () => {
            achievementList.classList.toggle('hidden');
        });
    }

    // Transaction Form Logic (primarily for SPENDIFYpage.html)
    const transactionForm = document.getElementById('transaction-form');
    const filterCategory = document.getElementById('filter-category');
    const filterType = document.getElementById('filter-type');

    if (transactionForm) {
        transactionForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const description = document.getElementById('description').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const category = document.getElementById('category').value;
            const type = document.getElementById('transaction-type').value; // Get transaction type

            if (description && !isNaN(amount) && amount > 0 && category && type) {
                const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
                transactions.push({
                    description,
                    amount,
                    category,
                    type,
                    date: new Date().toISOString() // Store current date
                });
                localStorage.setItem('transactions', JSON.stringify(transactions));
                showMessage('Transaction added successfully!', 'success');
                transactionForm.reset();
                renderTransactions(filterCategory ? filterCategory.value : 'all', filterType ? filterType.value : 'all'); // Re-render with current filters
            } else {
                showMessage('Please fill in all transaction details correctly.', 'error');
            }
        });
    }

    // Filter Controls Logic (for CHART.html, but can be on any page with filters)
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

    // Budget Section Logic (primarily for SPENDIFYpage.html)
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

    // Initial renders on page load for all relevant elements
    // These functions will check if their respective elements exist before trying to update them
    renderTransactions();
    updatePieChart();
    updateMonthlyChart();
    updateBalance();
    updateRemainingBudget();
    updateCurrentMonthlyIncome(); // This was missing in the original combined version


    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', (event) => {
        // Check if the 'transactions' or 'spendifyBudget' keys in localStorage were changed
        if (event.key === 'transactions' || event.key === 'spendifyBudget') {
            console.log('localStorage change detected in another tab/window. Updating UI...');
            // Trigger all relevant UI updates
            renderTransactions(); // This will re-render list and update charts
            updateBalance();
            updateRemainingBudget();
            updateCurrentMonthlyIncome();
        }
    });

    // Settings Dropdown Logic (from SPENDIFYpage.html context)
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

        // Close dropdown if clicked outside
        document.addEventListener('click', (event) => {
            if (!settingsButton.contains(event.target) && !settingsDropdown.contains(event.target)) {
                settingsDropdown.style.display = 'none';
            }
        });
    }

    // Theme selection
    if (themeSelect) {
        themeSelect.addEventListener('change', (event) => {
            document.body.className = event.target.value; // Assuming 'dark' or 'light' classes are defined
        });
    }

    // Currency selection (you might want to integrate this with the balance display)
    if (currencySelect) {
        currencySelect.addEventListener('change', (event) => {
            localStorage.setItem('selectedCurrency', event.target.value);
            // You would need to update all currency displays on the page here
            updateBalance(); // This function should adapt to selected currency
            renderTransactions(); // This function should adapt to selected currency
        });
        // Set initial currency display
        const savedCurrency = localStorage.getItem('selectedCurrency') || 'PHP';
        currencySelect.value = savedCurrency;
    }

    // Spending Limit
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

    // Set Alerts (simplified as per original script)
    if (setAlertsButton && alertSettingsDiv) {
        setAlertsButton.addEventListener('click', () => {
            alertSettingsDiv.style.display = 'block';
            showMessage('Alerts for billing dates and spending limits will be set.', 'info');
        });
    }

    // Recurring Payments
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
    renderRecurringPayments(); // Initial render for recurring payments on load

    // Notification Button (placeholder for now)
    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            showMessage('No new notifications.', 'info');
        });
    }

});