export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type HandRank =
  | 'High Card'
  | 'Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface HandResult {
  handRank: HandRank;
  rankValue: number; // 1-10 for comparison
  strength: number;  // 0-1 normalized strength
  description: string;
  bestCards: Card[];
}

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const HAND_RANK_VALUES: Record<HandRank, number> = {
  'High Card': 1,
  'Pair': 2,
  'Two Pair': 3,
  'Three of a Kind': 4,
  'Straight': 5,
  'Flush': 6,
  'Full House': 7,
  'Four of a Kind': 8,
  'Straight Flush': 9,
  'Royal Flush': 10
};

function getCombinations(cards: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (cards.length < k) return [];
  const [first, ...rest] = cards;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

function evaluateFiveCards(cards: Card[]): HandResult {
  const ranks = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const rankCounts = new Map<number, number>();
  ranks.forEach(r => rankCounts.set(r, (rankCounts.get(r) || 0) + 1));

  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);
  const uniqueRanks = Array.from(rankCounts.keys()).sort((a, b) => b - a);
  const isFlush = new Set(suits).size === 1;
  const isStraight = uniqueRanks.length === 5 &&
    (uniqueRanks[0] - uniqueRanks[4] === 4 ||
     (uniqueRanks[0] === 14 && uniqueRanks[1] === 5)); // A-2-3-4-5

  const topRank = ranks[0];

  let handRank: HandRank;

  if (isFlush && isStraight) {
    handRank = topRank === 14 && uniqueRanks[1] === 13 ? 'Royal Flush' : 'Straight Flush';
  } else if (counts[0] === 4) {
    handRank = 'Four of a Kind';
  } else if (counts[0] === 3 && counts[1] === 2) {
    handRank = 'Full House';
  } else if (isFlush) {
    handRank = 'Flush';
  } else if (isStraight) {
    handRank = 'Straight';
  } else if (counts[0] === 3) {
    handRank = 'Three of a Kind';
  } else if (counts[0] === 2 && counts[1] === 2) {
    handRank = 'Two Pair';
  } else if (counts[0] === 2) {
    handRank = 'Pair';
  } else {
    handRank = 'High Card';
  }

  const rankValue = HAND_RANK_VALUES[handRank];
  // Normalize strength: rank (0-9) * base + kicker contribution
  const strength = (rankValue - 1) / 9 + (topRank / 14) / 9;

  return {
    handRank,
    rankValue,
    strength: Math.min(strength, 1),
    description: `${handRank} (${cards.map(c => `${c.rank}${c.suit[0]}`).join(' ')})`,
    bestCards: cards
  };
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandResult {
  const allCards = [...holeCards, ...communityCards];
  if (allCards.length < 5) {
    // Not enough cards - evaluate what we have
    return evaluateFiveCards(allCards.length >= 5 ? allCards.slice(0, 5) : [...allCards, ...Array(5 - allCards.length).fill(allCards[0])]);
  }

  const combos = getCombinations(allCards, 5);
  let best: HandResult | null = null;

  for (const combo of combos) {
    const result = evaluateFiveCards(combo);
    if (!best || result.rankValue > best.rankValue ||
        (result.rankValue === best.rankValue && result.strength > best.strength)) {
      best = result;
    }
  }

  return best!;
}

export function compareHands(hand1: HandResult, hand2: HandResult): number {
  if (hand1.rankValue !== hand2.rankValue) {
    return hand1.rankValue - hand2.rankValue;
  }
  return hand1.strength - hand2.strength;
}
