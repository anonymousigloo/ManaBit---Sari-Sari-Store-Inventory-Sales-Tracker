// inventory.js
// Purpose: Manages all product-related operations.
// Provides functions to add, update, delete, restock, filter, and sort products.
// Works with the global `products` array defined in main.js.

// Valid category options (matches the HTML dropdowns)
var CATEGORIES = [
  "Canned Goods",
  "Instant Noodles",
  "Beverages",
  "Snacks",
  "Condiments",
  "Toiletries",
  "Household",
  "Others"
];

// Checks if a product's stock is at or below its low stock level.
// Returns true if the product is considered low stock.
function isLowStock(product) {
  return product.stock <= product.lowStockLevel;
}

// Validates product form data. Returns { valid: true } or { valid: false, message: "..." }.
function validateProduct(data, existingId) {
  // Name must not be empty
  if (!data.name || data.name.trim() === "") {
    return { valid: false, message: "Product name cannot be empty." };
  }

  // Category must be chosen
  if (!data.category || data.category === "") {
    return { valid: false, message: "Please select a category." };
  }

  // Price must be a number greater than 0
  if (isNaN(data.price) || data.price <= 0) {
    return { valid: false, message: "Price must be a number greater than 0." };
  }

  // Stock must be a whole number >= 0
  if (isNaN(data.stock) || data.stock < 0 || Math.floor(data.stock) !== data.stock) {
    return { valid: false, message: "Stock must be a whole number (0 or more)." };
  }

  // Low stock level must be a whole number >= 0
  if (isNaN(data.lowStockLevel) || data.lowStockLevel < 0 || Math.floor(data.lowStockLevel) !== data.lowStockLevel) {
    return { valid: false, message: "Low stock level must be a whole number (0 or more)." };
  }

  // Check for duplicate name (case-insensitive, trimmed)
  // If existingId is provided, skip the product being edited
  var trimmedName = data.name.trim().toLowerCase();
  for (var i = 0; i < products.length; i++) {
    var p = products[i];
    if (p.name.trim().toLowerCase() === trimmedName && p.id !== existingId) {
      return { valid: false, message: "Product already exists." };
    }
  }

  return { valid: true };
}

// Adds a new product to the global products array and saves to localStorage.
// Returns { success: true/false, message: "..." }.
function addProduct(productData) {
  var data = {
    name: productData.name.trim(),
    category: productData.category,
    price: Number(productData.price),
    stock: Math.floor(Number(productData.stock)),
    lowStockLevel: Math.floor(Number(productData.lowStockLevel))
  };

  var validation = validateProduct(data, null);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Create the product object with a unique id
  var newProduct = {
    id: Date.now() + "_" + Math.floor(Math.random() * 10000),
    name: data.name,
    category: data.category,
    price: data.price,
    stock: data.stock,
    lowStockLevel: data.lowStockLevel
  };

  products.push(newProduct);
  saveData("products", products);
  return { success: true, message: "Product added successfully!" };
}

// Updates an existing product's details. The product id stays the same.
// Returns { success: true/false, message: "..." }.
function updateProduct(id, productData) {
  var data = {
    name: productData.name.trim(),
    category: productData.category,
    price: Number(productData.price),
    stock: Math.floor(Number(productData.stock)),
    lowStockLevel: Math.floor(Number(productData.lowStockLevel))
  };

  // Pass the current id so the duplicate check skips this product
  var validation = validateProduct(data, id);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  // Find the product and update it
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === id) {
      products[i].name = data.name;
      products[i].category = data.category;
      products[i].price = data.price;
      products[i].stock = data.stock;
      products[i].lowStockLevel = data.lowStockLevel;
      break;
    }
  }

  saveData("products", products);
  return { success: true, message: "Product updated successfully!" };
}

// Removes a product from the products array by id and saves to localStorage.
function deleteProduct(id) {
  products = products.filter(function(p) {
    return p.id !== id;
  });
  saveData("products", products);
}

// Adds quantity to a product's stock. Quantity must be a whole number > 0.
// Returns { success: true/false, message: "..." }.
function restock(id, quantity) {
  var qty = Number(quantity);

  // Quantity must be a whole number greater than 0
  if (isNaN(qty) || qty <= 0 || Math.floor(qty) !== qty) {
    return { success: false, message: "Restock quantity must be a whole number greater than 0." };
  }

  // Find the product and add to stock
  for (var i = 0; i < products.length; i++) {
    if (products[i].id === id) {
      products[i].stock += qty;
      saveData("products", products);
      return { success: true, message: "Restocked " + qty + " units successfully!" };
    }
  }

  return { success: false, message: "Product not found." };
}

// Filters, searches, and sorts the products array.
// Does NOT change the original array -- returns a new array.
// Parameters:
//   productList  - array of products to filter
//   searchText   - text to search in product name (case-insensitive)
//   category     - category to filter by, or "" for all
//   sortBy       - "name", "price", or "stock"
//   lowOnly      - if true, only return low-stock products
function getFilteredProducts(productList, searchText, category, sortBy, lowOnly) {
  var result = [];

  // Step 1: Apply filters
  for (var i = 0; i < productList.length; i++) {
    var p = productList[i];

    // Search filter: check if name includes search text (case-insensitive)
    if (searchText && p.name.toLowerCase().indexOf(searchText.toLowerCase()) === -1) {
      continue;
    }

    // Category filter
    if (category && category !== "" && p.category !== category) {
      continue;
    }

    // Low stock only filter
    if (lowOnly && !isLowStock(p)) {
      continue;
    }

    result.push(p);
  }

  // Step 2: Sort the filtered results
  result.sort(function(a, b) {
    if (sortBy === "price") {
      return a.price - b.price;
    } else if (sortBy === "stock") {
      return a.stock - b.stock;
    } else {
      // Default: sort by name A-Z
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
  });

  return result;
}
