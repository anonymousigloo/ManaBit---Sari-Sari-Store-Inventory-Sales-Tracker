// reports.js
// Purpose: Handles sales history filtering, range summaries, and best-sellers report.
// Works with the global `sales` array and renders results to the DOM.

// ---- Date Helpers ----

// Returns a local date string "YYYY-MM-DD" from a Date object (no UTC conversion).
function toLocalDateString(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

// Returns a Date at midnight (00:00:00) for a given "YYYY-MM-DD" string in local time.
function parseDateLocal(dateStr) {
  var parts = dateStr.split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// ---- Preset Date Range Helpers ----
// Week starts on MONDAY.

// Returns today's date string "YYYY-MM-DD".
function getPresetToday() {
  return toLocalDateString(new Date());
}

// Returns the start (Monday) of the current week as "YYYY-MM-DD".
function getPresetWeekStart() {
  var now = new Date();
  var day = now.getDay(); // 0=Sun, 1=Mon, ...
  // Calculate how many days to subtract to get to Monday
  var diff = (day === 0) ? 6 : day - 1;
  var monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return toLocalDateString(monday);
}

// Returns the first day of the current month as "YYYY-MM-DD".
function getPresetMonthStart() {
  var now = new Date();
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-01";
}

// ---- Filtering ----

// Filters the sales array by date range and optional product name.
// startDate and endDate are "YYYY-MM-DD" strings (or "" for no bound).
// productName is a product name string (or "" for all products).
// The end date INCLUDES the whole day (up to 23:59:59).
function filterSalesByRange(salesList, startDate, endDate, productName) {
  var result = [];

  var start = startDate ? parseDateLocal(startDate) : null;
  var end = endDate ? parseDateLocal(endDate) : null;
  // Extend end date to include the entire day
  if (end) {
    end.setHours(23, 59, 59, 999);
  }

  for (var i = 0; i < salesList.length; i++) {
    var sale = salesList[i];
    var saleDate = new Date(sale.date);

    // Apply start date bound
    if (start && saleDate < start) {
      continue;
    }

    // Apply end date bound (inclusive of the whole day)
    if (end && saleDate > end) {
      continue;
    }

    // Apply product name filter
    if (productName && productName !== "" && sale.productName !== productName) {
      continue;
    }

    result.push(sale);
  }

  return result;
}

// Validates that start date is not after end date.
// Returns { valid: true } or { valid: false, message: "..." }.
function validateDateRange(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    return { valid: false, message: "Start date cannot be after end date." };
  }
  return { valid: true };
}

// Computes summary totals from a filtered list of sales.
// Returns { totalRevenue, unitsSold, transactions }.
function getRangeSummary(filteredSales) {
  var totalRevenue = 0;
  var unitsSold = 0;
  var transactions = filteredSales.length;

  for (var i = 0; i < filteredSales.length; i++) {
    totalRevenue += filteredSales[i].total;
    unitsSold += filteredSales[i].quantity;
  }

  return {
    totalRevenue: totalRevenue,
    unitsSold: unitsSold,
    transactions: transactions
  };
}

// Returns the top 5 best-selling products from a sales list.
// rankBy: "revenue" or "unitsSold"
// Uses reduce() to group by product name, then sorts descending.
function getBestSellers(salesList, rankBy) {
  // Group sales by product name
  var totals = salesList.reduce(function(acc, sale) {
    if (!acc[sale.productName]) {
      acc[sale.productName] = {
        productName: sale.productName,
        unitsSold: 0,
        revenue: 0
      };
    }
    acc[sale.productName].unitsSold += sale.quantity;
    acc[sale.productName].revenue += sale.total;
    return acc;
  }, {});

  // Determine sort key
  var key = rankBy === "revenue" ? "revenue" : "unitsSold";

  // Convert to array, sort descending, take top 5
  return Object.values(totals)
    .sort(function(a, b) { return b[key] - a[key]; })
    .slice(0, 5);
}

// ---- Render Functions ----

// Renders the history table and best sellers list in the Reports section.
// Parameters:
//   filteredSales - filtered array of sales to display
//   summary       - { totalRevenue, unitsSold, transactions }
//   bestSellers   - array from getBestSellers()
function renderHistory(filteredSales, summary, bestSellers) {
  // --- Range Summary ---
  var revEl = document.getElementById("range-revenue");
  var unitsEl = document.getElementById("range-units");
  var txnsEl = document.getElementById("range-txns");

  if (revEl) revEl.textContent = formatCurrency(summary.totalRevenue);
  if (unitsEl) unitsEl.textContent = summary.unitsSold;
  if (txnsEl) txnsEl.textContent = summary.transactions;

  // --- History Table ---
  var tbody = document.getElementById("history-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (filteredSales.length === 0) {
    var emptyRow = document.createElement("tr");
    var emptyCell = document.createElement("td");
    emptyCell.colSpan = 4;
    emptyCell.textContent = "No sales found for this period.";
    emptyCell.style.textAlign = "center";
    emptyCell.style.color = "#888";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
  } else {
    // Sort newest first
    var sorted = filteredSales.slice().sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    for (var i = 0; i < sorted.length; i++) {
      var sale = sorted[i];
      var row = document.createElement("tr");

      var dateCell = document.createElement("td");
      dateCell.textContent = formatDate(sale.date);

      var nameCell = document.createElement("td");
      nameCell.textContent = sale.productName;

      var qtyCell = document.createElement("td");
      qtyCell.textContent = sale.quantity;

      var totalCell = document.createElement("td");
      totalCell.textContent = formatCurrency(sale.total);

      row.appendChild(dateCell);
      row.appendChild(nameCell);
      row.appendChild(qtyCell);
      row.appendChild(totalCell);
      tbody.appendChild(row);
    }
  }

  // --- Best Sellers List ---
  renderBestSellers(bestSellers);
}

// Renders the Top 5 Best Sellers ordered list.
function renderBestSellers(bestSellers) {
  var list = document.getElementById("best-sellers-list");
  if (!list) return;
  list.innerHTML = "";

  if (bestSellers.length === 0) {
    var li = document.createElement("li");
    li.textContent = "No data available.";
    li.style.color = "#888";
    list.appendChild(li);
    return;
  }

  for (var i = 0; i < bestSellers.length; i++) {
    var item = bestSellers[i];
    var li = document.createElement("li");
    li.textContent = item.productName + " — " +
      item.unitsSold + " units sold, " +
      formatCurrency(item.revenue) + " revenue";
    list.appendChild(li);
  }
}
