// Real AI Receipt Parser using the Gemini Interactions API (3.7 Primary, 3.6 Fallback)

/**
 * Converts a File object to a Base64 string payload part
 */
function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      resolve({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Sends a receipt image to the Gemini Interactions API with model fallback
 */
export async function parseReceiptWithAI(imageFile) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY in your environment variables (.env).");
  }

  const imagePart = await fileToGenerativePart(imageFile);

  const prompt = `
    Analyze this store receipt image. Extract all line items purchased.
    For each item, determine:
    1. name: The name of the product.
    2. category: The product category (e.g., Groceries, Produce, Dairy, Household, General).
    3. isFood: Boolean (true if it is food/beverage/edible grocery, false if it is non-food/household like lightbulbs, cleaning supplies, paper towels, batteries).

    Return ONLY a valid JSON array of objects with keys: id, store, date, name, category, isFood, selected.
    Set "store" to "Scanned Receipt", "date" to "Today", and "selected" to true if isFood is true, or false if isFood is false.
    Example format:
    [
      { "id": "item_1", "store": "Scanned Receipt", "date": "Today", "name": "Organic Milk", "category": "Dairy", "isFood": true, "selected": true },
      { "id": "item_2", "store": "Scanned Receipt", "date": "Today", "name": "LED Lightbulbs", "category": "Household", "isFood": false, "selected": false }
    ]
  `;

  const INTERACTIONS_URL = "https://generativelanguage.googleapis.com/v1beta/interactions";
  const models = ["gemini-3.7-flash", "gemini-3.6-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await fetch(`${INTERACTIONS_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model,
          input: [
            { type: "text", text: prompt },
            { 
              type: "image", 
              data: imagePart.data, 
              mime_type: imagePart.mimeType 
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        let rawText = "";
        if (data.steps && Array.isArray(data.steps)) {
          for (const step of data.steps) {
            if (step.type === "model_output" && Array.isArray(step.content)) {
              for (const content of step.content) {
                if (content.type === "text") {
                  rawText += content.text;
                }
              }
            }
          }
        }

        if (rawText) {
          const cleanedJSON = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          return JSON.parse(cleanedJSON);
        }
      }

      const errorData = await response.json();
      lastError = new Error(errorData.error?.message || `Model ${model} failed.`);

      // If overloaded (503) or gateway error, proceed to fallback model
      if (response.status === 503 || response.status === 502) {
        continue;
      }
      break;

    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("All AI receipt parsing models are currently unavailable.");
}