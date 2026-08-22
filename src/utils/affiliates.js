// Centralized Affiliate & Retailer Deep-Link Generator

const AFFILIATE_CONFIG = {
  amazon: {
    tag: "pantrychef-20", // Replace with your Amazon Associates ID once active
    baseUrl: "https://www.amazon.com/s?k="
  },
  walmart: {
    // Replace YOUR_IMPACT_ID with your publisher ID from Impact.com
    trackingUrl: "https://walmart.sjv.io/c/YOUR_IMPACT_ID/SUB_ID?u=",
    searchUrl: "https://www.walmart.com/search?q="
  },
  target: {
    // Replace YOUR_IMPACT_ID with your publisher ID from Impact.com
    trackingUrl: "https://target.kgaa.net/c/YOUR_IMPACT_ID/SUB_ID?u=",
    searchUrl: "https://www.target.com/s?searchTerm="
  },
  instacart: {
    // Replace with your Instacart partner/affiliate link structure
    trackingUrl: "https://instacart.cello.so/YOUR_IMPACT_ID?url=",
    searchUrl: "https://www.instacart.com/store/s?k="
  }
};

/**
 * Generates an affiliate-tracked URL for a given store and search query
 */
export function getAffiliateLink(storeKey, searchQuery) {
  const store = AFFILIATE_CONFIG[storeKey];
  if (!store) return "#";

  const encodedQuery = encodeURIComponent(searchQuery);

  if (storeKey === "amazon") {
    return `${store.baseUrl}${encodedQuery}&tag=${store.tag}`;
  }

  // For Impact-managed networks (Walmart, Target, Instacart), encode the search URL into the tracking wrapper
  const rawSearchUrl = `${store.searchUrl}${encodedQuery}`;
  return `${store.trackingUrl}${encodeURIComponent(rawSearchUrl)}`;
}