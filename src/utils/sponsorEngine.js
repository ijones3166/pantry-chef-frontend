// =================================================================================
// SPONSOR INTENT & ANALYTICS ENGINE
// =================================================================================

/**
 * Logs impression or click analytics for sponsored content to Firestore
 */
const trackSponsorEvent = async (db, appId, effectiveUserId, sponsorId, eventType) => {
  if (!db || !sponsorId) return;
  try {
    await addDoc(collection(db, `/artifacts/${appId}/public/data/sponsorAnalytics`), {
      sponsorId: sponsorId,
      eventType: eventType, // "impression" or "click"
      userId: effectiveUserId || "anonymous",
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Failed to log sponsor analytics:", err);
  }
};

/**
 * Filters and injects sponsored content based on user search intent, 
 * with a default fallback if no query matches.
 */
const getIntentBasedSponsoredFeed = (organicRecipes, sponsoredPool, searchQuery) => {
  if (!sponsoredPool || sponsoredPool.length === 0) return organicRecipes;

  const query = (searchQuery || "").toLowerCase().trim();

  // 1. Try to find a sponsor matching the user's active search query
  let matchedSponsor = null;
  if (query) {
    matchedSponsor = sponsoredPool.find(s => 
      s.title.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      (s.sponsorMetadata?.keywords || []).some(keyword => query.includes(keyword))
    );
  }

  // 2. Fallback to default active sponsor if no intent match or query is empty
  const activeSponsor = matchedSponsor || sponsoredPool[0];

  // 3. Inject the intent-targeted sponsor at the top of the feed
  return [
    { ...activeSponsor, is_sponsored: true, isIntentMatched: !!matchedSponsor },
    ...organicRecipes
  ];
};