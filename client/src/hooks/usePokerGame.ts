import { useState, useCallback } from 'react';

export interface Card {
  rank: string;
  suit: string;
}

export interface PokerGameState {
  playerCards: Card[];
  communityCards: Card[];
  pot: number;
  playerStack: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  numOpponents: number;
  callAmount: number;
  isSeated: boolean;
  tableId: string | null;
}

export interface Analysis {
  handRank: string;
  winProbability: number;
  equity: number;
  recommendation: {
    action: string;
    reasoning: string;
    confidence: number;
    expectedValue: number;
    raiseAmount?: number;
  };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export function usePokerGame() {
  const [gameState, setGameState] = useState<PokerGameState>({
    playerCards: [],
    communityCards: [],
    pot: 0,
    playerStack: 10000,
    phase: 'preflop',
    numOpponents: 2,
    callAmount: 0,
    isSeated: false,
    tableId: null,
  });

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sitDown = useCallback((tableId: string, buyIn: number = 1000) => {
    setGameState(prev => ({
      ...prev,
      isSeated: true,
      tableId,
      playerStack: buyIn,
    }));
  }, []);

  const standUp = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isSeated: false,
      tableId: null,
      playerCards: [],
      communityCards: [],
      pot: 0,
      phase: 'preflop',
    }));
    setAnalysis(null);
  }, []);

  const setCards = useCallback((playerCards: Card[], communityCards: Card[] = []) => {
    const phases: Record<number, PokerGameState['phase']> = {
      0: 'preflop',
      3: 'flop',
      4: 'turn',
      5: 'river',
    };
    const phase = phases[communityCards.length] || 'preflop';
    setGameState(prev => ({ ...prev, playerCards, communityCards, phase }));
    setAnalysis(null);
  }, []);

  const analyzeHand = useCallback(async () => {
    if (gameState.playerCards.length < 2) {
      setError('Need at least 2 cards to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const [evalRes, simRes] = await Promise.all([
        fetch(`${API_URL}/hand/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerCards: gameState.playerCards,
            communityCards: gameState.communityCards,
          }),
        }),
        fetch(`${API_URL}/hand/simulate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerCards: gameState.playerCards,
            communityCards: gameState.communityCards,
            numOpponents: gameState.numOpponents,
            iterations: 5000,
          }),
        }),
      ]);

      const [evalData, simData] = await Promise.all([evalRes.json(), simRes.json()]);

      const betRes = await fetch(`${API_URL}/bet/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winProbability: simData.result?.winProbability ?? 50,
          equity: simData.result?.equity ?? 50,
          potSize: gameState.pot,
          callAmount: gameState.callAmount,
          playerStack: gameState.playerStack,
          phase: gameState.phase,
          numOpponents: gameState.numOpponents,
        }),
      });
      const betData = await betRes.json();

      setAnalysis({
        handRank: evalData.result?.handRank ?? 'High Card',
        winProbability: simData.result?.winProbability ?? 0,
        equity: simData.result?.equity ?? 0,
        recommendation: betData.recommendation,
      });
    } catch (err) {
      setError('API unavailable - running in demo mode');
      // Demo fallback
      setAnalysis({
        handRank: 'Pair',
        winProbability: 45.2,
        equity: 38.5,
        recommendation: {
          action: 'call',
          reasoning: 'Demo mode. Connect server for real analysis.',
          confidence: 60,
          expectedValue: 120,
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [gameState]);

  const updatePot = useCallback((amount: number) => {
    setGameState(prev => ({ ...prev, pot: amount }));
  }, []);

  const updateCallAmount = useCallback((amount: number) => {
    setGameState(prev => ({ ...prev, callAmount: amount }));
  }, []);

  return {
    gameState,
    analysis,
    isAnalyzing,
    error,
    sitDown,
    standUp,
    setCards,
    analyzeHand,
    updatePot,
    updateCallAmount,
  };
}
