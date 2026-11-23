// main.js
// Purpose: App entry point. Holds the global state (products, sales arrays),
// loads data on startup, attaches all event listeners, and wires everything together.

// ---- Global State ----
// These arrays are shared with all other JS files (globals).
var products = [];
var sales = [];

// Tracks which product is being edited (null means "add mode").
var editingProductId = null;

// ---- Helper: Get product by id ----
function getProductById(id) {
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === id) return products[i];
  }
  return null;
}

// ---- Edit Mode Helpers ----

// Enters edit mode: fills the product form with the given product's data.
function enterEditMode(productId) {
  var product = getProductById(productId);
  if (!product) return;

  editingProductId = productId;

  document.getElementById("product-name").value = product.name;
  document.getElementById("product-category").value = product.category;
  document.getElementById("product-price").value = product.price;
  document.getElementById("product-stock").value = product.stock;
  document.getElementById("product-low-stock").value = product.lowStockLevel;

  document.getElementById("product-form-title").textContent = "Edit Product";
  document.getElementById("product-submit-btn").textContent = "Update Product";
  document.getElementById("cancel-btn").style.display = "inline-block";

  // Scroll to form
  document.getElementById("product-form").scrollIntoView({ behavior: "smooth" });
}

// Exits edit mode and resets the product form.
function exitEditMode() {
  editingProductId = null;
  document.getElementById("product-form").reset();
  document.getElementById("product-form-title").textContent = "Add / Edit Product";
  document.getElementById("product-submit-btn").textContent = "Save Product";
  document.getElementById("cancel-btn").style.display = "none";
}

// ---- Startup ----

// Runs when the page finishes loading.
window.addEventListener("load", function() {
  // Load persisted data from localStorage
  products = loadData("products");
  sales = loadData("sales");

  // Set default date range for history (All time)
  // Leave blank = no filter = show all
  document.getElementById("history-start").value = "";
  document.getElementById("history-end").value = "";

  // Render everything
  renderAll();

  // ---- Attach Event Listeners ----

  // Event 1: Product form submit (Add or Update)
  document.getElementById("product-form").addEventListener("submit", function(e) {
    e.preventDefault(); // Prevent page reload
    var msgArea = document.getElementById("product-msg");

    var productData = {
      name: document.getElementById("product-name").value,
      category: document.getElementById("product-category").value,
      price: document.getElementById("product-price").value,
      stock: document.getElementById("product-stock").value,
      lowStockLevel: document.getElementById("product-low-stock").value
    };

    var result;
    if (editingProductId) {
      result = updateProduct(editingProductId, productData);
    } else {
      result = addProduct(productData);
    }

    showMessage(msgArea, result.message, result.success ? "success" : "error");

    if (result.success) {
      exitEditMode();
      renderAll();
    }
  });

  // Event 14: Cancel button (exit edit mode)
  document.getElementById("cancel-btn").addEventListener("click", function() {
    exitEditMode();
  });

  // Events 2, 3, 4: Edit, Delete, Restock -- use event delegation on the table body
  document.getElementById("inventory-tbody").addEventListener("click", function(e) {
    var btn = e.target;
    var action = btn.getAttribute("data-action");
    var id = btn.getAttribute("data-id");

    if (!action || !id) return;

    if (action === "edit") {
      // Event 2: Edit button
      enterEditMode(id);

    } else if (action === "delete") {
      // Event 3: Delete button
      if (confirm("Are you sure you want to delete this product?")) {
        deleteProduct(id);
        // If we were editing this product, exit edit mode
        if (editingProductId === id) {
          exitEditMode();
        }
        renderAll();
      }

    } else if (action === "restock") {
      // Event 4: Restock button
      var product = getProductById(id);
      if (!product) return;

      var input = prompt("How many units to add to \"" + product.name + "\"?");
      if (input === null) return; // User cancelled

      var result = restock(id, input);
      var msgArea = document.getElementById("product-msg");
      showMessage(msgArea, result.message, result.success ? "success" : "error");

      if (result.success) {
        renderAll();
      }
    }
  });

  // Event 5: Sale product dropdown changes -- show price and stock
  document.getElementById("sale-product").addEventListener("change", function() {
    document.getElementById("sale-quantity").value = "";
    updateSaleInfo();
  });

  // Event 6: Sale quantity input -- compute live total
  document.getElementById("sale-quantity").addEventListener("input", function() {
    updateSaleInfo();
  });

  // Event 7: Record Sale button
  document.getElementById("record-sale-btn").addEventListener("click", function() {
    var productId = document.getElementById("sale-product").value;
    var quantity = document.getElementById("sale-quantity").value;
    var msgArea = document.getElementById("sale-msg");

    var result = recordSale(productId, quantity);
    showMessage(msgArea, result.message, result.success ? "success" : "error");

    if (result.success) {
      // Reset quantity input but keep product selected for convenience
      document.getElementById("sale-quantity").value = "";
      renderAll();
    }
  });

  // Event 8: Search box -- live filter
  document.getElementById("search-box").addEventListener("input", function() {
    renderProducts();
  });

  // Event 9: Category filter dropdown
  document.getElementById("filter-category").addEventListener("change", function() {
    renderProducts();
  });

  // Event 10: Sort dropdown
  document.getElementById("sort-by").addEventListener("change", function() {
    renderProducts();
  });

  // Event 11: Low stock checkbox
  document.getElementById("low-stock-check").addEventListener("change", function() {
    renderProducts();
  });

  // Event 12: Clear All Sales button
  document.getElementById("clear-sales-btn").addEventListener("click", function() {
    if (confirm("Clear all sales? This cannot be undone. Products are kept.")) {
      sales = [];
      saveData("sales", sales);
      renderAll();
    }
  });

  // Event 13: Reset Data button (clears everything)
  document.getElementById("reset-data-btn").addEventListener("click", function() {
    if (confirm("Reset ALL data? This will remove all products and sales. This cannot be undone.")) {
      products = [];
      sales = [];
      saveData("products", products);
      saveData("sales", sales);
      exitEditMode();
      renderAll();
    }
  });

  // Event 16: History start date changes
  document.getElementById("history-start").addEventListener("change", function() {
    renderReports();
  });

  // Event 17: History end date changes
  document.getElementById("history-end").addEventListener("change", function() {
    renderReports();
  });

  // Event 18: Preset buttons (Today / This Week / This Month / All)
  document.getElementById("preset-today").addEventListener("click", function() {
    var today = getPresetToday();
    document.getElementById("history-start").value = today;
    document.getElementById("history-end").value = today;
    renderReports();
  });

  document.getElementById("preset-week").addEventListener("click", function() {
    document.getElementById("history-start").value = getPresetWeekStart();
    document.getElementById("history-end").value = getPresetToday();
    renderReports();
  });

  document.getElementById("preset-month").addEventListener("click", function() {
    document.getElementById("history-start").value = getPresetMonthStart();
    document.getElementById("history-end").value = getPresetToday();
    renderReports();
  });

  document.getElementById("preset-all").addEventListener("click", function() {
    document.getElementById("history-start").value = "";
    document.getElementById("history-end").value = "";
    renderReports();
  });

  // Event 19: Rank By dropdown
  document.getElementById("rank-by").addEventListener("change", function() {
    renderReports();
  });

  // Event 20: History product filter
  document.getElementById("history-product-filter").addEventListener("change", function() {
    renderReports();
  });

  // Event 21: Clear Filters button
  document.getElementById("clear-filters-btn").addEventListener("click", function() {
    document.getElementById("history-start").value = "";
    document.getElementById("history-end").value = "";
    document.getElementById("history-product-filter").value = "";
    document.getElementById("rank-by").value = "unitsSold";
    renderReports();
  });
});
