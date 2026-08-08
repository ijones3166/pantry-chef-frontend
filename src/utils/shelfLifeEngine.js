// =================================================================================
// SHELF-LIFE DECAY ENGINE: Hardcoded storage duration baselines (in days)
// =================================================================================

const SHELF_LIFE_DATABASE = {
  // Produce
  "spinach": { Pantry: 1, Fridge: 5, Freezer: 90 },
  "kale": { Pantry: 1, Fridge: 5, Freezer: 90 },
  "avocado": { Pantry: 3, Fridge: 7, Freezer: 0 },
  "tomatoes": { Pantry: 4, Fridge: 7, Freezer: 0 },
  "carrots": { Pantry: 7, Fridge: 21, Freezer: 180 },
  "potatoes": { Pantry: 30, Fridge: 0, Freezer: 0 },
  "onions": { Pantry: 30, Fridge: 0, Freezer: 0 },
  "garlic": { Pantry: 60, Fridge: 0, Freezer: 0 },
  "berries": { Pantry: 1, Fridge: 5, Freezer: 180 },
  "lemons": { Pantry: 7, Fridge: 30, Freezer: 0 },
  "limes": { Pantry: 7, Fridge: 30, Freezer: 0 },

  // Proteins
  "chicken breast": { Pantry: 0, Fridge: 2, Freezer: 270 },
  "ground beef": { Pantry: 0, Fridge: 2, Freezer: 120 },
  "ribeye steak": { Pantry: 0, Fridge: 3, Freezer: 180 },
  "pork chops": { Pantry: 0, Fridge: 3, Freezer: 180 },
  "shrimp": { Pantry: 0, Fridge: 2, Freezer: 180 },
  "salmon fillet": { Pantry: 0, Fridge: 2, Freezer: 90 },
  "bacon": { Pantry: 0, Fridge: 7, Freezer: 30 },

  // Dairy
  "milk": { Pantry: 0, Fridge: 7, Freezer: 90 },
  "eggs": { Pantry: 0, Fridge: 35, Freezer: 0 },
  "butter": { Pantry: 1, Fridge: 30, Freezer: 180 },
  "cheddar": { Pantry: 0, Fridge: 21, Freezer: 180 },
  "mozzarella": { Pantry: 0, Fridge: 14, Freezer: 90 },
  "greek yogurt": { Pantry: 0, Fridge: 14, Freezer: 0 },

  // Grains & Pantry Staples
  "jasmine rice": { Pantry: 365, Fridge: 365, Freezer: 730 },
  "pasta": { Pantry: 730, Fridge: 730, Freezer: 730 },
  "flour": { Pantry: 270, Fridge: 365, Freezer: 730 },
  "all-purpose flour": { Pantry: 270, Fridge: 365, Freezer: 730 },
  "bread": { Pantry: 4, Fridge: 7, Freezer: 90 },
  "instant ramen": { Pantry: 365, Fridge: 365, Freezer: 365 },
  "coconut milk": { Pantry: 365, Fridge: 7, Freezer: 0 },
};

/**
 * Returns recommended shelf life in days based on item name and storage location.
 * @param {string} itemName - The name of the food item.
 * @param {string} location - "Pantry" | "Fridge" | "Freezer"
 * @returns {number} Estimated days until expiration.
 */
export const getRecommendedShelfLife = (itemName, location = "Pantry") => {
  if (!itemName) return 7; // Safe default
  const cleanName = itemName.toLowerCase().trim();

  // Exact match search
  if (SHELF_LIFE_DATABASE[cleanName]) {
    return SHELF_LIFE_DATABASE[cleanName][location] ?? 7;
  }

  // Partial match search (e.g. "organic spinach" matches "spinach")
  const matchedKey = Object.keys(SHELF_LIFE_DATABASE).find((key) =>
    cleanName.includes(key)
  );

  if (matchedKey) {
    return SHELF_LIFE_DATABASE[matchedKey][location] ?? 7;
  }

  // Default category fallbacks if unknown
  const defaults = {
    Pantry: 30,
    Fridge: 7,
    Freezer: 90,
  };

  return defaults[location] || 7;
};