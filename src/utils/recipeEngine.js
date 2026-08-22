export const LOCAL_SIDE_PAIRINGS = {
  "ribeye steak": ["Garlic Mashed Potatoes", "Grilled Asparagus", "Caesar Salad"],
  "burger": ["French Fries", "Onion Rings", "Coleslaw"],
  "chicken breast": ["Roasted Broccoli", "Jasmine Rice", "Steamed Asparagus"],
  "salmon fillet": ["Garlic Butter Asparagus", "Quinoa Salad", "Lemon Herb Rice"],
  "tacos": ["Mexican Rice", "Refried Beans", "Elote (Street Corn)"],
  "chili": ["Cornbread", "Tortilla Chips", "Side Salad"],
  "roast chicken": ["Roasted Potatoes", "Glazed Carrots", "Dinner Rolls"]
};

/**
 * Checks local pairing database first before fallback.
 * @param {string} recipeTitle - Title of the recipe
 * @param {Array} ingredients - List of recipe ingredients
 * @returns {Array<string>} Recommended side dishes
 */

export const getLocalSidePairings = (recipeTitle, ingredients = []) => {
  if (!recipeTitle && ingredients.length === 0) return [];
  
  const searchString = (recipeTitle + " " + ingredients.map(i => typeof i === 'string' ? i : i.name).join(" ")).toLowerCase();

  for (const [key, sides] of Object.entries(LOCAL_SIDE_PAIRINGS)) {
    if (searchString.includes(key)) {
      return sides;
    }
  }

  return ["Garlic Bread", "House Green Salad", "Roasted Seasonal Vegetables"];
};

export const calculatePantryMatch = (recipeIngredients, inventory) => {
  if (!recipeIngredients || recipeIngredients.length === 0) return 100;
  
  const pantryItems = new Set((inventory || []).map(item => (item.name || "").toLowerCase().trim()));
  
  let matchedCount = 0;
  recipeIngredients.forEach(ing => {
    const ingName = (typeof ing === 'string' ? ing : (ing.name || ing.item || "")).toLowerCase().trim();
    const ingWords = ingName.split(/[\s,()]+/);
    
    const isPresent = Array.from(pantryItems).some(pantryItem => {
      if (pantryItem === ingName) return true;
      return ingWords.includes(pantryItem) && pantryItem.length > 2;
    });

    if (isPresent) {
      matchedCount++;
    }
  });

  return Math.round((matchedCount / recipeIngredients.length) * 100);
};

export const calculateRecipeCost = (recipeIngredients, inventory) => {
  if (!recipeIngredients) return 0;
  return recipeIngredients.reduce((totalCost, ing) => {
    const invMatch = inventory.find(
      (inv) => inv.name.toLowerCase().includes(ing.name.toLowerCase()) ||
               ing.name.toLowerCase().includes(inv.name.toLowerCase())
    );
    const unitCost = invMatch?.lastCost || 1.50;
    return totalCost + unitCost * (ing.quantity || 1);
  }, 0);
};