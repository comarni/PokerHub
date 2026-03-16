export type BetAction = 'fold' | 'check' | 'call' | 'raise' | 'all-in';
export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river';
export type RiskLevel = 'low' | 'medium' | 'high' | 'very-high';

export interface BetInput {
  winProbability: number;  // 0-100
  equity: number;          // 0-100
  potSize: number;
  callAmount: number;
  playerStack: number;
  phase: GamePhase;
  numOpponents: number;
}

export interface BetRecommendation {
  action: BetAction;
  raiseAmount?: number;
  potOdds: number;
  expectedValue: number;
  riskLevel: RiskLevel;
  reasoning: string;
  confidence: number; // 0-100
}

export function recommendBet(input: BetInput): BetRecommendation {
  const { winProbability, equity, potSize, callAmount, playerStack, phase, numOpponents } = input;

  // Pot odds calculation
  const potOdds = callAmount > 0 ? (callAmount / (potSize + callAmount)) * 100 : 0;

  // Expected Value calculation
  const ev = (equity / 100) * potSize - ((100 - equity) / 100) * callAmount;

  // Position-adjusted strength
  const effectiveStrength = equity / 100;

  let action: BetAction;
  let raiseAmount: number | undefined;
  let riskLevel: RiskLevel;
  let reasoning: string;
  let confidence: number;

  // Decision tree
  if (effectiveStrength >= 0.80) {
    // Very strong hand
    if (potSize > 0) {
      action = 'raise';
      raiseAmount = Math.min(Math.round(potSize * 0.75), playerStack);
      riskLevel = 'low';
      reasoning = `Strong hand (${equity.toFixed(1)}% equity). Value bet to build pot.`;
      confidence = 85;
    } else {
      action = 'raise';
      raiseAmount = Math.round(potSize * 0.5 + callAmount * 3);
      riskLevel = 'low';
      reasoning = `Premium hand. Aggressive play recommended.`;
      confidence = 90;
    }
  } else if (effectiveStrength >= 0.60) {
    // Good hand
    if (callAmount === 0) {
      action = 'raise';
      raiseAmount = Math.round(potSize * 0.5);
      riskLevel = 'medium';
      reasoning = `Good equity (${equity.toFixed(1)}%). Semi-bluff or value raise.`;
      confidence = 70;
    } else if (equity > potOdds * 1.2) {
      action = 'call';
      riskLevel = 'medium';
      reasoning = `Equity (${equity.toFixed(1)}%) exceeds pot odds (${potOdds.toFixed(1)}%). Profitable call.`;
      confidence = 75;
    } else {
      action = 'call';
      riskLevel = 'medium';
      reasoning = `Marginal but profitable. EV: ${ev.toFixed(0)} chips.`;
      confidence = 60;
    }
  } else if (effectiveStrength >= 0.40) {
    // Marginal hand
    if (callAmount === 0) {
      action = 'check';
      riskLevel = 'medium';
      reasoning = `Marginal hand. Free look preferred.`;
      confidence = 65;
    } else if (equity > potOdds) {
      action = 'call';
      riskLevel = 'high';
      reasoning = `Barely profitable. Pot odds: ${potOdds.toFixed(1)}% vs equity: ${equity.toFixed(1)}%.`;
      confidence = 50;
    } else {
      action = 'fold';
      riskLevel = 'low';
      reasoning = `Pot odds unfavorable. Fold to preserve stack.`;
      confidence = 70;
    }
  } else if (effectiveStrength >= 0.25) {
    // Weak hand - consider bluff
    if (callAmount === 0 && phase !== 'river') {
      action = 'check';
      riskLevel = 'medium';
      reasoning = `Weak hand but free card available.`;
      confidence = 60;
    } else if (callAmount > playerStack * 0.20) {
      action = 'fold';
      riskLevel = 'low';
      reasoning = `Weak hand. Bet size too large relative to equity.`;
      confidence = 80;
    } else {
      action = 'fold';
      riskLevel = 'low';
      reasoning = `Insufficient equity (${equity.toFixed(1)}%) to continue.`;
      confidence = 75;
    }
  } else {
    // Very weak hand
    if (callAmount === 0) {
      action = 'check';
      riskLevel = 'low';
      reasoning = `Check with weak hand. Don't invest chips.`;
      confidence = 85;
    } else {
      action = 'fold';
      riskLevel = 'low';
      reasoning = `Fold. Equity too low (${equity.toFixed(1)}%) to continue.`;
      confidence = 90;
    }
  }

  // Stack-to-pot ratio check for all-in
  if (action === 'raise' && raiseAmount && raiseAmount >= playerStack * 0.9) {
    action = 'all-in';
    raiseAmount = playerStack;
    reasoning += ' Stack committed - all-in optimal.';
  }

  return {
    action,
    raiseAmount,
    potOdds: Math.round(potOdds * 100) / 100,
    expectedValue: Math.round(ev * 100) / 100,
    riskLevel,
    reasoning,
    confidence
  };
}
