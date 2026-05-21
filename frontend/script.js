let expenses = [];
let chart;
let monthlyChart;
let editId = null;
let monthlyBudget =
  localStorage.getItem("budget") || 0;

// Reusable Toast Notification Function
function showToast(message, type = "success") {

  let bgColor = "#22c55e";

  // Error toast color
  if (type === "error") {
    bgColor = "#ef4444";
  }

  // Warning toast color
  if (type === "warning") {
    bgColor = "#f59e0b";
  }

  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "right",

    style: {
      background: bgColor,
      borderRadius: "10px",
    },

  }).showToast();
}

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

// Load
window.onload = async function () {
  fetchExpenses();

  let savedTheme = localStorage.getItem("theme");
  let btn = document.querySelector(".theme-btn");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    btn.innerText = "☀️";
  }
};

async function fetchExpenses() {
  try {
    const token = localStorage.getItem("token");

const res = await fetch("https://expensio-backend-c5pe.onrender.com/api/expenses", {
  headers: {
    authorization: token,
  },
});

    const data = await res.json();

    expenses = data;

    displayExpenses(expenses);
  } catch (error) {
    console.log(error);
  }
}

// Add / Update Expense
async function addExpense() {
  let desc = document.getElementById("desc").value;
  let amount = document.getElementById("amount").value;
  let category = document.getElementById("category").value;
  const btn = document.getElementById("addBtn");

  if (desc === "" || amount === "") {
    showToast("Please fill all fields", "warning");
    return;
  }

  let expense = {
    desc,
    amount: Number(amount),
    category,
  };

  try {
    // Show animated loading spinner
    btn.innerHTML = `
      <span class="spinner"></span>
      Processing...
`   ;
    btn.disabled = true;
    let url = "https://expensio-backend-c5pe.onrender.com/api/expenses";
    let method = "POST";

    // Update Mode
    if (editId) {
      url = `https://expensio-backend-c5pe.onrender.com/api/expenses/${editId}`;
      method = "PUT";
    }

    await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        authorization: localStorage.getItem("token"),
      },
      body: JSON.stringify(expense),
    });

    const isEditing = editId;

    editId = null;

    fetchExpenses();

    if (isEditing) {
      showToast("Expense Updated ✏️");
    } else {
      showToast("Expense Added ✅");
    }

    document.getElementById("desc").value = "";
    document.getElementById("amount").value = "";
    btn.innerHTML = "Add Expense";
    btn.disabled = false;
  } catch (error) {
    btn.innerText = "Add";
    btn.disabled = false;
    console.log(error);
  }
}

// Display
function displayExpenses(data) {
  let list = document.getElementById("list");
  list.innerHTML = "";

  let total = 0;

  data.forEach((item, index) => {
    let li = document.createElement("li");

 li.innerHTML = `

  <div class="expense-info">

    <div class="expense-top">

      <h3>${item.desc}</h3>

      <span class="category-badge ${item.category}">
        ${item.category}
      </span>

    </div>

    <small>
      ${
        item.createdAt
          ? new Date(item.createdAt).toLocaleString()
          : "Old Expense"
      }
    </small>

  </div>

  <div class="expense-actions">

    <h2>₹${item.amount}</h2>

    <div>

      <button onclick="editExpense(${index})">
        Edit
      </button>

      <button onclick="deleteExpense('${item._id}')">
        Delete
      </button>

    </div>

  </div>
`;

    list.appendChild(li);
    total += item.amount;
  });

  document.getElementById("total").innerText = total;

  let foodTotal = 0;
  let travelTotal = 0;
  let shoppingTotal = 0;

  expenses.forEach((item) => {
    if (item.category === "Food") {
      foodTotal += item.amount;
    }

    if (item.category === "Travel") {
       travelTotal += item.amount;
    }

    if (item.category === "Shopping") {
      shoppingTotal  += item.amount;
    }
  });

  document.getElementById("totalStat").innerText = `₹${total}`;
  document.getElementById("foodStat").innerText = `₹${foodTotal}`;
  document.getElementById("travelStat").innerText = `₹${travelTotal}`;
  document.getElementById("shoppingStat").innerText = `₹${shoppingTotal}`;
  

  document.getElementById("emptyMsg").style.display =
    data.length === 0 ? "block" : "none";

  document.getElementById("chartsSection").style.display =
    data.length === 0 ? "none" : "grid";

  renderChart();
  renderMonthlyChart();
  updateBudgetUI();
}
// Render Monthly Expense Analytics Chart
function renderMonthlyChart() {

  // Object to store monthly totals
  const monthlyTotals = {};

  // Loop through all expenses
  expenses.forEach((item) => {

    // Skip old expenses without createdAt
    if (!item.createdAt) return;

    // Convert createdAt into Date object
    const date = new Date(item.createdAt);

    // Get short month name (Jan, Feb, Mar...)
    const month = date.toLocaleString("default", {
      month: "short",
    });

    // Initialize month total if not present
    if (!monthlyTotals[month]) {
      monthlyTotals[month] = 0;
    }

    // Add current expense amount
    monthlyTotals[month] += item.amount;
  });

  // Extract month names
  const labels = Object.keys(monthlyTotals);

  // Extract month totals
  const data = Object.values(monthlyTotals);

  // Get canvas element
  const ctx = document.getElementById("monthlyChart");

  // Destroy old chart before rendering new one
  if (monthlyChart) {
    monthlyChart.destroy();
  }

  // Create bar chart
  monthlyChart = new Chart(ctx, {
    type: "bar",

    data: {
      labels: labels,

      datasets: [
        {
          label: "Monthly Expenses",

          data: data,

          borderRadius: 10,

          backgroundColor: "#6366f1",

          borderRadius: 12,

          borderSkipped: false,
        },
      ],
    },

    options: {
      responsive: true,

      plugins: {
        legend: {
          display: false,
        },
      },

      scales: {

         y: {
          beginAtZero: true,

          grid: {
            color: "rgba(200,200,200,0.1)",
          },
         },

         x: {
          grid: {
            display: false,
          },
         },
      },
    },
  });
}

// Delete
async function deleteExpense(id) {
  try {
    await fetch(`https://expensio-backend-c5pe.onrender.com/api/expenses/${id}`, {
      method: "DELETE",

      headers: {
        authorization: localStorage.getItem("token"),
      },
    });

    fetchExpenses();
    showToast("Expense Deleted 🗑️", "error");
  } catch (error) {
    console.log(error);
  }
}

// Edit
function editExpense(index) {
  let item = expenses[index];

  document.getElementById("desc").value = item.desc;
  document.getElementById("amount").value = item.amount;
  document.getElementById("category").value = item.category;
  document.getElementById("addBtn").innerText = "Update";

  editId = item._id;
}

// Filter
function filterExpenses() {
  let selected = document.getElementById("filter").value;

  let filtered = expenses.filter(
    (item) => selected === "All" || item.category === selected,
  );

  displayExpenses(filtered);
}

function searchExpenses() {
  let searchValue = document
    .getElementById("search")
    .value.toLowerCase();

  let filtered = expenses.filter((item) =>
    item.desc.toLowerCase().includes(searchValue)
  );

  displayExpenses(filtered);
}

// Save
function saveData() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("dark");

  let isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  document.querySelector(".theme-btn").innerText = isDark ? "☀️" : "🌙";
}

// Chart
function renderChart() {
  let totals = {
    Food: 0,
    Travel: 0,
    Shopping: 0,
  };

  expenses.forEach((item) => {
    totals[item.category] += item.amount;
  });

  let ctx = document.getElementById("expenseChart");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Food", "Travel", "Shopping"],
      datasets: [
        {
          data: [totals.Food, totals.Travel, totals.Shopping],
          backgroundColor: ["#8b5cf6", "#06b6d4", "#f59e0b"],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",

          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: "circle",
            font: {
               size: 13,
            }
          }
        },
      },
    },
  });
}

function logoutUser() {
  localStorage.removeItem("token");

  showToast("Logged out successfully");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 1500);
}

// pdf
async function downloadPDF() {

  const { jsPDF } = window.jspdf;

  const doc = new jsPDF();

  // Header
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, 210, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("Expense Report", 20, 20);

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Date
  const today = new Date().toLocaleDateString();

  doc.setFontSize(11);
  doc.text(`Generated on: ${today}`, 20, 40);

  // Table Header
  let y = 55;

  doc.setFillColor(240, 240, 240);
  doc.rect(20, y, 170, 10, "F");

  doc.setFontSize(12);

  doc.text("No.", 25, y + 7);
  doc.text("Description", 45, y + 7);
  doc.text("Category", 110, y + 7);
  doc.text("Amount", 160, y + 7);

  y += 15;

  // Expense Rows 
  expenses.forEach((item, index) => {

    doc.setFontSize(11);

    doc.text(`${index + 1}`, 25, y);
    doc.text(item.desc, 45, y);
    doc.text(item.category, 110, y);
    doc.text(`Rs. ${item.amount}`, 160, y);

    y += 10;
  });

  // Divider Line
  doc.line(20, y, 190, y);

  y += 15;

  // Total
  let total = expenses.reduce((sum, item) => sum + item.amount, 0);

  doc.setFontSize(16);
  doc.setTextColor(99, 102, 241);

  doc.text(`Total Expense: Rs. ${total}`, 20, y);

  // Footer
  y += 20;

  doc.setFontSize(10);
  doc.setTextColor(120);

  doc.text(
    "Generated by Expense Management System",
    20,
    y
  );

  // Chart Image
const canvas = document.getElementById("expenseChart");

const chartImage = canvas.toDataURL("image/png");

// Add chart title
y += 10;

doc.setFontSize(15);
doc.setTextColor(0, 0, 0);

doc.text("Expense Analytics Chart", 20, y);

y += 10;

// Add chart image
doc.addImage(chartImage, "PNG", 20, y, 160, 90);

  doc.save("Expense_Report.pdf");

  showToast("PDF Downloaded 📄");
}


function sortExpenses(type) {

  let sortedExpenses = [...expenses];

  if (type === "latest") {
    sortedExpenses.sort(
      (a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  else if (type === "oldest") {
    sortedExpenses.sort(
      (a, b) =>
        new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  else if (type === "high") {
    sortedExpenses.sort((a, b) => b.amount - a.amount);
  }

  else if (type === "low") {
    sortedExpenses.sort((a, b) => a.amount - b.amount);
  }

  displayExpenses(sortedExpenses);
}

function saveBudget() {

  const budget =
    document.getElementById("budgetInput").value;

  monthlyBudget = Number(budget);

  localStorage.setItem("budget", monthlyBudget);

  updateBudgetUI();

  showToast("Budget Saved 💰");
}

function updateBudgetUI() {

  let totalExpense = expenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const status =
    document.getElementById("budgetStatus");

  if (!monthlyBudget || monthlyBudget === 0) {

    status.innerText = "No budget set";

    return;
  }

  let remaining =
    monthlyBudget - totalExpense;

  if (remaining < 0) {

    status.innerHTML =
      `⚠️ Budget Exceeded by ₹${Math.abs(remaining)}`;

    status.style.color = "#ef4444";
  }

  else {

    status.innerHTML =
      `₹${remaining} Remaining`;

    status.style.color = "#10b981";
  }
}