import schemesData from '../../data/schemes.json';
import { type UserProfile } from '../auth';

export interface Scheme {
  schemeId: string;
  nameKey: string;
  descriptionKey: string;
  benefit: string;
  category: 'income' | 'credit' | 'insurance' | 'infrastructure' | 'input';
  eligibility: {
    states: string[] | 'ALL';
    crops: string[] | 'ALL';
    maxLandAcres: number | null;
  };
  applyUrl: string;
  lastDate: string | null;
  isActive: boolean;
}

export interface MatchedScheme extends Scheme {
  matched: boolean;
  matchReasons: string[];
}

/**
 * Match schemes to a farmer's profile.
 * Matched schemes appear first, with reasons why they match.
 */
export function matchSchemes(user: UserProfile): MatchedScheme[] {
  const schemes = schemesData as Scheme[];

  return schemes
    .filter(s => s.isActive)
    .map(scheme => {
      const reasons: string[] = [];
      let matched = true;

      // State check
      if (scheme.eligibility.states !== 'ALL') {
        if (scheme.eligibility.states.includes(user.state)) {
          reasons.push(`Available in ${user.state}`);
        } else {
          matched = false;
        }
      } else {
        reasons.push('Available nationwide');
      }

      // Crop check
      if (scheme.eligibility.crops !== 'ALL' && user.primaryCrops?.length) {
        const matchingCrops = user.primaryCrops.filter(c =>
          (scheme.eligibility.crops as string[]).includes(c.toLowerCase())
        );
        if (matchingCrops.length > 0) {
          reasons.push(`Covers your crops: ${matchingCrops.join(', ')}`);
        } else {
          matched = false;
        }
      }

      // Land size check
      if (scheme.eligibility.maxLandAcres !== null && user.landSizeAcres) {
        if (user.landSizeAcres <= scheme.eligibility.maxLandAcres) {
          reasons.push(`For farms up to ${scheme.eligibility.maxLandAcres} acres`);
        } else {
          matched = false;
        }
      }

      return { ...scheme, matched, matchReasons: reasons };
    })
    .sort((a, b) => {
      // Matched first, then by category
      if (a.matched && !b.matched) return -1;
      if (!a.matched && b.matched) return 1;
      return 0;
    });
}
