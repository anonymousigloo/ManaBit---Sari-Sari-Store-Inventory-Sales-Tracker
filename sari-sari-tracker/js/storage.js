// storage.js
// Purpose: Handles saving and loading data from localStorage.
// All other modules use these functions instead of touching localStorage directly.

// Saves data to localStorage under the given key (converts to JSON string).
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // Storage might be full or blocked -- show a friendly message
    console.error("Could not save data:", error);
    // showMessage is defined in ui.js and loaded after this file,
    // but we guard against it not existing yet.
    if (typeof showMessage === "function") {
      showMessage(null, "Warning: Could not save data. Storage may be full.", "error");
    }
  }
}

// Loads and parses data from localStorage.
// Returns an empty array [] if the key doesn't exist or the data is corrupted.
function loadData(key) {
  try {
    var raw = localStorage.getItem(key);
    if (raw === null) {
      return [];
    }
    var parsed = JSON.parse(raw);
    // Make sure the parsed result is actually an array
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    // Corrupted JSON -- return empty array so the app doesn't crash
    console.error("Could not load data for key '" + key + "':", error);
    return [];
  }
}

// Removes a key from localStorage (used for full reset).
function clearData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Could not clear data:", error);
  }
}
