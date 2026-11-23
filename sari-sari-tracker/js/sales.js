// sales.js
// Purpose: Handles recording sales, computing totals, and retrieving daily sales data.
// Works with the global `products` and `sales` arrays defined in main.js.

// Computes the total price for a sale (price * quantity).
// Returns 0 if either value is invalid.
function computeTotal(price, quantity) {
  var p = Number(price);
  var q = Number(quantity);
  if (isNaN(p) || isNaN(q)) {
    return 0;
  }
  return p * q;
}

// Checks if two Date objects fall on the same local calendar day.
function isSameLocalDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Records a sale: validates inputs, deducts stock, creates a Sale record.
// Parameters:
//   productId - the id of the product being sold
//   quantity  - how many units to sell (string from input, will be parsed)
// Returns { success: true/false, message: "..." }.
function recordSale(productId, quantity) {
  // Validation 1: A product must be selected
  if (!productId || productId === "") {
    return { success: false, message: "Please select a product." };
  }

  // Validation 2: Quantity must be a whole number > 0
  var qty = Number(quantity);
  if (quantity === "" || isNaN(qty) || qty <= 0 || Math.floor(qty) !== qty) {
    return { success: false, message: "Quantity must be a whole number greater than 0." };
  }

  // Find the product in the global products array
  var productIndex = -1;
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === productId) {
      productIndex = i;
      break;
    }
  }

  // Product must exist
  if (productIndex === -1) {
    return { success: false, message: "Product not found. Please refresh and try again." };
  }

  var product = products[productIndex];

  // Validation 3: Must have enough stock
  if (qty > product.stock) {
    return { success: false, message: "Not enough stock. Only " + product.stock + " left." };
  }

  // All validations passed -- deduct stock
  products[productIndex].stock -= qty;

  // Create the Sale record (copy name and price so history is preserved)
  var newSale = {
    id: Date.now() + "_" + Math.floor(Math.random() * 10000),
    productId: product.id,
    productName: product.name,
    quantity: qty,
    unitPrice: product.price,
    total: computeTotal(product.price, qty),
    date: new Date().toISOString()
  };

  sales.push(newSale);

  // Save both arrays to localStorage
  saveData("products", products);
  saveData("sales", sales);

  return { success: true, message: "Sale recorded successfully!" };
}

// Returns a summary of today's sales using the user's local date.
// Returns { totalSales, itemsSold, transactions }.
function getTodaySummary() {
  var today = new Date();
  var totalSales = 0;
  var itemsSold = 0;
  var transactions = 0;

  for (var i = 0; i < sales.length; i++) {
    var saleDate = new Date(sales[i].date);
    if (isSameLocalDay(saleDate, today)) {
      totalSales += sales[i].total;
      itemsSold += sales[i].quantity;
      transactions += 1;
    }
  }

  return {
    totalSales: totalSales,
    itemsSold: itemsSold,
    transactions: transactions
  };
}

// Returns an array of today's sales, newest first (for the Sales Log table).
function getTodaySales() {
  var today = new Date();
  var todaySales = [];

  for (var i = 0; i < sales.length; i++) {
    var saleDate = new Date(sales[i].date);
    if (isSameLocalDay(saleDate, today)) {
      todaySales.push(sales[i]);
    }
  }

  // Sort newest first (reverse chronological)
  todaySales.sort(function(a, b) {
    return new Date(b.date) - new Date(a.date);
  });

  return todaySales;
}
