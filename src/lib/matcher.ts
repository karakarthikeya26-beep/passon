import { Listing, LookingFor, Match } from '../types';

export function calculateMatches(
  requests: LookingFor[],
  listings: Listing[]
): Match[] {
  const matches: Match[] = [];

  // Filter only active available listings and open requests
  const activeListings = listings.filter((l) => l.status === 'AVAILABLE');
  const openRequests = requests.filter((r) => r.status === 'OPEN');

  openRequests.forEach((request) => {
    activeListings.forEach((listing) => {
      // Don't match user's own listings with their own requests
      if (listing.owner_id === request.student_id) return;

      let score = 0;
      const reasons: string[] = [];

      // 1. Category Alignment (High Weight: 40 pts)
      if (listing.category === request.category) {
        score += 40;
        reasons.push(`Matching category (${listing.category})`);
      }

      // 2. Keyword Overlap (30 pts)
      const requestTitleWords = request.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const listingTitleWords = listing.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const listingDescWords = listing.description.toLowerCase().split(/\s+/).filter(w => w.length > 2);

      const matchingKeywords = requestTitleWords.filter(
        word => listingTitleWords.includes(word) || listingDescWords.includes(word)
      );

      if (matchingKeywords.length > 0) {
        score += Math.min(matchingKeywords.length * 15, 30);
        reasons.push(`Keyword match ("${matchingKeywords.slice(0, 2).join('", "')}")`);
      }

      // 3. Exchange Mode Compatibility (20 pts)
      const reqMode = request.mode; // 'BUY' | 'EXCHANGE' | 'DONATE' | 'ANY'
      const listMode = listing.mode; // 'Sell' | 'Exchange' | 'Donate' | 'Hand Over'

      if (reqMode === 'ANY') {
        score += 20;
        reasons.push('Compatible exchange preference');
      } else if (reqMode === 'BUY' && (listMode === 'Sell' || listMode === 'Hand Over')) {
        score += 20;
        reasons.push('Compatible buy/sell preference');
      } else if (reqMode === 'EXCHANGE' && listMode === 'Exchange') {
        score += 20;
        reasons.push('Direct exchange preference match');
      } else if (reqMode === 'DONATE' && (listMode === 'Donate' || listMode === 'Hand Over')) {
        score += 20;
        reasons.push('Direct donation/handover match');
      }

      // 4. Availability & Active listing bonus (10 pts)
      if (listing.status === 'AVAILABLE') {
        score += 10;
      }

      // If overall score >= 50, it is a valid surfaced match!
      if (score >= 50) {
        matches.push({
          id: `match-${request.id}-${listing.id}`,
          listing_id: listing.id,
          listing,
          request_id: request.id,
          request,
          match_score: score,
          match_reason: reasons.join(' + '),
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        });
      }
    });
  });

  return matches.sort((a, b) => b.match_score - a.match_score);
}
