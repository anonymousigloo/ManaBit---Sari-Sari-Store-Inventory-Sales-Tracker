// ui.js
// Purpose: All DOM rendering functions and display helpers.
// Called after any data change to keep the UI in sync.

// ---- Format Helpers ----

// Formats a number as Philippine peso currency (e.g., ₱15.00).
function formatCurrency(n) {
  var amount = Number(n);
  if (isNaN(amount)) amount = 0;
  return "₱" + amount.toFixed(2);
}

// Formats an ISO date string as a readable local date (e.g., Nov 23, 2026).
function formatDate(isoString) {
  var d = new Date(isoString);
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
}

// Formats an ISO date string as a readable local time (e.g., 06:45 PM).
function formatTime(isoString) {
  var d = new Date(isoString);
  var hours = d.getHours();
  var minutes = String(d.getMinutes()).padStart(2, "0");
  var ampm = hours >= 12 ? "PM" : "AM";
  var hour12 = hours % 12 || 12;
  return hour12 + ":" + minutes + " " + ampm;
}

// ---- Message Display ----

// Shows a success or error message in a given element, then auto-hides it after 3.5 seconds.
// areaElement: the DOM element to put the message in (can be null for a fallback alert)
// text: the message string
// type: "success" or "error"
function showMessage(areaElement, text, type) {
  if (!areaElement) {
    // Fallback: use a generic message area if no element is given
    console.warn("showMessage called with no element:", text);
    return;
  }
  areaElement.textContent = text;
  areaElement.className = "message " + (type === "success" ? "msg-success" : "msg-error");
  areaElement.style.display = "block";

  // Clear after 3.5 seconds
  setTimeout(function() {
    areaElement.textContent = "";
    areaElement.style.display = "none";
  }, 3500);
}

// ---- Inventory Table ----

// Rebuilds the inventory table body with filtered and sorted products.
// Shows a "LOW" badge for low-stock items. Uses textContent to avoid XSS.
function renderProducts() {
  var tbody = document.getElementById("inventory-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  var searchText = document.getElementById("search-box").value;
  var category = document.getElementById("filter-category").value;
  var sortBy = document.getElementById("sort-by").value;
  var lowOnly = document.getElementById("low-stock-check").checked;

  var filtered = getFilteredProducts(products, searchText, category, sortBy, lowOnly);

  if (filtered.length === 0) {
    var emptyRow = document.createElement("tr");
    var emptyCell = document.createElement("td");
    emptyCell.colSpan = 5;
    emptyCell.textContent = "No products found.";
    emptyCell.style.textAlign = "center";
    emptyCell.style.color = "#888";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }

  for (var i = 0; i < filtered.length; i++) {
    var p = filtered[i];
    var row = document.createElement("tr");

    // Name cell with optional LOW badge
    var nameCell = document.createElement("td");
    nameCell.textContent = p.name;
    if (isLowStock(p)) {
      var badge = document.createElement("span");
      badge.textContent = " LOW";
      badge.className = "low-badge";
      nameCell.appendChild(badge);
    }

    var catCell = document.createElement("td");
    catCell.textContent = p.category;

    var priceCell = document.createElement("td");
    priceCell.textContent = formatCurrency(p.price);

    var stockCell = document.createElement("td");
    stockCell.textContent = p.stock;

    // Action buttons with data-id for event delegation
    var actionsCell = document.createElement("td");
    actionsCell.className = "actions-cell";

    var editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "btn btn-edit";
    editBtn.setAttribute("data-id", p.id);
    editBtn.setAttribute("data-action", "edit");

    var restockBtn = document.createElement("button");
    restockBtn.textContent = "Restock";
    restockBtn.className = "btn btn-restock";
    restockBtn.setAttribute("data-id", p.id);
    restockBtn.setAttribute("data-action", "restock");

    var deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "btn btn-delete";
    deleteBtn.setAttribute("data-id", p.id);
    deleteBtn.setAttribute("data-action", "delete");

    actionsCell.appendChild(editBtn);
    actionsCell.appendChild(restockBtn);
    actionsCell.appendChild(deleteBtn);

    row.appendChild(nameCell);
    row.appendChild(catCell);
    row.appendChild(priceCell);
    row.appendChild(stockCell);
    row.appendChild(actionsCell);
    tbody.appendChild(row);
  }
}

// ---- Product Dropdowns ----

// Rebuilds the product <select> dropdowns:
//   - Sale form dropdown (marks out-of-stock products)
//   - History product filter dropdown
function renderProductDropdowns() {
  // Sale form dropdown
  var saleSelect = document.getElementById("sale-product");
  if (saleSelect) {
    var currentSaleVal = saleSelect.value;
    saleSelect.innerHTML = '<option value="">-- Select Product --</option>';

    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var opt = document.createElement("option");
      opt.value = p.id;
      if (p.stock === 0) {
        opt.textContent = p.name + " (Out of stock)";
        opt.disabled = true;
      } else {
        opt.textContent = p.name + " (Stock: " + p.stock + ")";
      }
      saleSelect.appendChild(opt);
    }

    // Restore selection if still valid
    if (currentSaleVal) {
      saleSelect.value = currentSaleVal;
      // If the product no longer exists or is out of stock, reset
      if (!saleSelect.value) {
        saleSelect.value = "";
        updateSaleInfo();
      }
    }
  }

  // History product filter dropdown
  var historySelect = document.getElementById("history-product-filter");
  if (historySelect) {
    var currentHistVal = historySelect.value;
    historySelect.innerHTML = '<option value="">All Products</option>';

    // Get unique product names from all sales
    var seen = {};
    for (var j = 0; j < products.length; j++) {
      var pName = products[j].name;
      if (!seen[pName]) {
        seen[pName] = true;
        var opt2 = document.createElement("option");
        opt2.value = pName;
        opt2.textContent = pName;
        historySelect.appendChild(opt2);
      }
    }
    // Also add products that only appear in sales history (deleted products)
    for (var k = 0; k < sales.length; k++) {
      var sName = sales[k].productName;
      if (!seen[sName]) {
        seen[sName] = true;
        var opt3 = document.createElement("option");
        opt3.value = sName;
        opt3.textContent = sName + " (deleted)";
        historySelect.appendChild(opt3);
      }
    }

    // Restore previous selection if still available
    historySelect.value = currentHistVal || "";
  }
}

// ---- Sales Log ----

// Rebuilds today's sales log table (newest first).
function renderSales() {
  var tbody = document.getElementById("sales-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  var todaySales = getTodaySales();

  if (todaySales.length === 0) {
    var emptyRow = document.createElement("tr");
    var emptyCell = document.createElement("td");
    emptyCell.colSpan = 4;
    emptyCell.textContent = "No sales recorded today.";
    emptyCell.style.textAlign = "center";
    emptyCell.style.color = "#888";
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    return;
  }

  for (var i = 0; i < todaySales.length; i++) {
    var sale = todaySales[i];
    var row = document.createElement("tr");

    var timeCell = document.createElement("td");
    timeCell.textContent = formatTime(sale.date);

    var nameCell = document.createElement("td");
    nameCell.textContent = sale.productName;

    var qtyCell = document.createElement("td");
    qtyCell.textContent = sale.quantity;

    var totalCell = document.createElement("td");
    totalCell.textContent = formatCurrency(sale.total);

    row.appendChild(timeCell);
    row.appendChild(nameCell);
    row.appendChild(qtyCell);
    row.appendChild(totalCell);
    tbody.appendChild(row);
  }
}

// ---- Today's Summary Cards ----

// Updates the three summary cards (Total Sales, Items Sold, Transactions).
function renderSummary() {
  var summary = getTodaySummary();

  var salesEl = document.getElementById("summary-sales");
  var itemsEl = document.getElementById("summary-items");
  var txnsEl = document.getElementById("summary-txns");

  if (salesEl) salesEl.textContent = formatCurrency(summary.totalSales);
  if (itemsEl) itemsEl.textContent = summary.itemsSold;
  if (txnsEl) txnsEl.textContent = summary.transactions;
}

// ---- Sale Form Info ----

// Updates the price and stock display when a product is selected in the sale form.
function updateSaleInfo() {
  var saleSelect = document.getElementById("sale-product");
  var priceDisplay = document.getElementById("sale-price-display");
  var stockDisplay = document.getElementById("sale-stock-display");
  var totalDisplay = document.getElementById("sale-total-display");
  var qtyInput = document.getElementById("sale-quantity");

  var selectedId = saleSelect ? saleSelect.value : "";

  // Find the selected product
  var selectedProduct = null;
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === selectedId) {
      selectedProduct = products[i];
      break;
    }
  }

  if (selectedProduct) {
    if (priceDisplay) priceDisplay.textContent = formatCurrency(selectedProduct.price);
    if (stockDisplay) stockDisplay.textContent = selectedProduct.stock;
  } else {
    if (priceDisplay) priceDisplay.textContent = "—";
    if (stockDisplay) stockDisplay.textContent = "—";
    if (totalDisplay) totalDisplay.textContent = "—";
    return;
  }

  // Compute live total if quantity is filled
  if (qtyInput && qtyInput.value !== "") {
    var qty = Number(qtyInput.value);
    if (!isNaN(qty) && qty > 0) {
      if (totalDisplay) totalDisplay.textContent = formatCurrency(computeTotal(selectedProduct.price, qty));
    } else {
      if (totalDisplay) totalDisplay.textContent = "—";
    }
  } else {
    if (totalDisplay) totalDisplay.textContent = "—";
  }
}

// ---- Render Reports Section ----

// Reads current filter controls and re-renders the history and best sellers sections.
function renderReports() {
  var startDate = document.getElementById("history-start") ? document.getElementById("history-start").value : "";
  var endDate = document.getElementById("history-end") ? document.getElementById("history-end").value : "";
  var productName = document.getElementById("history-product-filter") ? document.getElementById("history-product-filter").value : "";
  var rankBy = document.getElementById("rank-by") ? document.getElementById("rank-by").value : "unitsSold";
  var msgArea = document.getElementById("reports-msg");

  // Validate date range
  var rangeCheck = validateDateRange(startDate, endDate);
  if (!rangeCheck.valid) {
    if (msgArea) showMessage(msgArea, rangeCheck.message, "error");
    return; // Keep previous results unchanged
  }

  // Clear any previous error
  if (msgArea) {
    msgArea.textContent = "";
    msgArea.style.display = "none";
  }

  var filtered = filterSalesByRange(sales, startDate, endDate, productName);
  var summary = getRangeSummary(filtered);
  var bestSellers = getBestSellers(filtered, rankBy);

  renderHistory(filtered, summary, bestSellers);
}

// ---- Render Everything ----

// Calls all render functions so the whole UI is refreshed after any data change.
function renderAll() {
  renderProducts();
  renderProductDropdowns();
  renderSales();
  renderSummary();
  renderReports();
}
