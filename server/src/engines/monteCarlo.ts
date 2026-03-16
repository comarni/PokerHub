import { Card, Rank, Suit, evaluateHand, compareHands } from './handEvaluator';

const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
const SUITS: Suit[] = ['hearts','diamonds','clubs','spades'];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function cardEquals(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

function removeKnownCards(deck: Card[], known: Card[]): Card[] {
  return deck.filter(c => !known.some(k => cardEquals(c, k)));
}

export interface MonteCarloInput {
  playerCards: Card[];
  communityCards: Card[];
  numOpponents: number;
  iterations?: number;
}

export interface MonteCarloResult {
  winProbability: number;
  tieProbability: number;
  loseProbability: number;
  equity: number;
  iterations: number;
}

export function runMonteCarlo(input: MonteCarloInput): MonteCarloResult {
  const { playerCards, communityCards, numOpponents, iterations = 10000 } = input;

  let wins = 0;
  let ties = 0;
  let losses = 0;

  const knownCards = [...playerCards, ...communityCards];
  const cardsNeeded = 5 - communityCards.length;

  for (let i = 0; i < iterations; i++) {
    const deck = removeKnownCards(createDeck(), knownCards);
    const shuffled = shuffleDeck(deck);
    let idx = 0;

    // Deal remaining community cards
    const simCommunity = [...communityCards];
    for (let c = 0; c < cardsNeeded; c++) {
      simCommunity.push(shuffled[idx++]);
    }

    // Evaluate player hand
    const playerResult = evaluateHand(playerCards, simCommunity);

    // Simulate opponents
    let playerWins = true;
    let playerTies = false;

    for (let o = 0; o < numOpponents; o++) {
      const oppCards: Card[] = [shuffled[idx++], shuffled[idx++]];
      const oppResult = evaluateHand(oppCards, simCommunity);
      const cmp = compareHands(playerResult, oppResult);

      if (cmp < 0) {
        playerWins = false;
        playerTies = false;
        break;
      } else if (cmp === 0) {
        playerTies = true;
        playerWins = false;
      }
    }

    if (playerWins) wins++;
    else if (playerTies) ties++;
    else losses++;
  }

  const winProb = wins / iterations;
  const tieProb = ties / iterations;
  const lossProb = losses / iterations;
  const equity = winProb + tieProb / (numOpponents + 1);

  return {
    winProbability: Math.round(winProb * 10000) / 100,
    tieProbability: Math.round(tieProb * 10000) / 100,
    loseProbability: Math.round(lossProb * 10000) / 100,
    equity: Math.round(equity * 10000) / 100,
    iterations
  };
}
