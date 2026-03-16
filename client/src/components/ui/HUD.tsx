'use client';

import { useState, useCallback } from 'react';
import StatsOverlay from './StatsOverlay';
import BetSuggestion from './BetSuggestion';

interface HUDProps {
  tableId: string;
  tableName: string;
  onStandUp: () => void;
}

interface Card {
  rank: string;
  suit: string;
}

interface GameState {
  playerCards: Card[];
  communityCards: Card[];
  pot: number;
  playerStack: number;
  phase: string;
  numOpponents: number;
  callAmount: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
};

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-white',
  spades: 'text-white'
};

const DEMO_HANDS: Card[][] = [
  [{ rank: 'A', suit: 'hearts' }, { rank: 'K', suit: 'spades' }],
  [{ rank: 'Q', suit: 'diamonds' }, { rank: 'Q', suit: 'hearts' }],
  [{ rank: '7', suit: 'clubs' }, { rank: '2', suit: 'diamonds' }],
  [{ rank: 'J', suit: 'spades' }, { rank: 'T', suit: 'hearts' }],
];

const DEMO_COMMUNITY: Card[][] = [
  [],
  [{ rank: 'A', suit: 'clubs' }, { rank: 'K', suit: 'diamonds' }, { rank: '5', suit: 'hearts' }],
  [{ rank: 'A', suit: 'clubs' }, { rank: 'K', suit: 'diamonds' }, { rank: '5', suit: 'hearts' }, { rank: '9', suit: 'spades' }],
  [{ rank: '2', suit: 'clubs' }, { rank: '7', suit: 'diamonds' }, { rank: 'K', suit: 'hearts' }, { rank: '3', suit: 'spades' }, { rank: '8', suit: 'clubs' }],
];

export default function HUD({ tableId, tableName, onStandUp }: HUDProps) {
  const [gameState, setGameState] = useState<GameState>({
    playerCards: [],
    communityCards: [],
    pot: 200,
    playerStack: 5000,
    phase: 'preflop',
    numOpponents: 2,
    callAmount: 40
  });
  const [analysis, setAnalysis] = useState<null | {
    handRank: string;
    winProbability: number;
    equity: number;
    recommendation: { action: string; reasoning: string; confidence: number; expectedValue: number };
  }>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);

  const dealDemoHand = useCallback(() => {
    const idx = demoIndex % DEMO_HANDS.length;
    const commIdx = demoIndex % DEMO_COMMUNITY.length;
    const phases = ['preflop', 'flop', 'turn', 'river'];
    const phase = phases[commIdx] as string;

    setGameState(prev => ({
      ...prev,
      playerCards: DEMO_HANDS[idx],
      communityCards: DEMO_COMMUNITY[commIdx],
      phase,
      pot: 200 + Math.floor(Math.random() * 500),
      callAmount: [0, 40, 80, 120][commIdx] || 0
    }));
    setDemoIndex(d => d + 1);
    setAnalysis(null);
  }, [demoIndex]);

  const analyzeHand = async () => {
    if (gameState.playerCards.length < 2) return;
    setIsAnalyzing(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Evaluate hand
      const evalRes = await fetch(`${apiUrl}/hand/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCards: gameState.playerCards,
          communityCards: gameState.communityCards
        })
      });
      const evalData = await evalRes.json();

      // Monte Carlo simulation
      const simRes = await fetch(`${apiUrl}/hand/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerCards: gameState.playerCards,
          communityCards: gameState.communityCards,
          numOpponents: gameState.numOpponents,
          iterations: 5000
        })
      });
      const simData = await simRes.json();

      // Bet recommendation
      const betRes = await fetch(`${apiUrl}/bet/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winProbability: simData.result?.winProbability || 50,
          equity: simData.result?.equity || 50,
          potSize: gameState.pot,
          callAmount: gameState.callAmount,
          playerStack: gameState.playerStack,
          phase: gameState.phase,
          numOpponents: gameState.numOpponents
        })
      });
      const betData = await betRes.json();

      setAnalysis({
        handRank: evalData.result?.handRank || 'High Card',
        winProbability: simData.result?.winProbability || 0,
        equity: simData.result?.equity || 0,
        recommendation: betData.recommendation || { action: 'check', reasoning: 'No data', confidence: 0, expectedValue: 0 }
      });
    } catch {
      // Fallback demo analysis when API unavailable
      setAnalysis({
        handRank: 'Pair',
        winProbability: 45.2,
        equity: 38.5,
        recommendation: {
          action: 'call',
          reasoning: 'Demo mode - API not connected. Marginal hand, pot odds acceptable.',
          confidence: 60,
          expectedValue: 120
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  function CardDisplay({ card }: { card: Card }) {
    return (
      <div className="bg-white rounded-lg w-14 h-20 flex flex-col items-center justify-center shadow-lg border border-gray-300 cursor-default select-none">
        <div className={`text-2xl font-bold ${SUIT_COLORS[card.suit]}`}>{card.rank}</div>
        <div className={`text-xl ${SUIT_COLORS[card.suit]}`}>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    );
  }

  // Suppress unused variable warning for tableId
  void tableId;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Table name */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-yellow-400 px-6 py-2 rounded-full text-lg font-bold border border-yellow-600">
        {tableName}
      </div>

      {/* Stand Up button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <button
          onClick={onStandUp}
          className="bg-red-800 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Stand Up
        </button>
      </div>

      {/* Community Cards */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
        {gameState.communityCards.map((card, i) => (
          <CardDisplay key={i} card={card} />
        ))}
        {gameState.communityCards.length === 0 && (
          <div className="text-white/30 text-sm">Community cards will appear here</div>
        )}
      </div>

      {/* Pot display */}
      <div className="absolute top-2/3 left-1/2 -translate-x-1/2 text-yellow-400 font-bold text-lg">
        POT: ${gameState.pot}
      </div>

      {/* Player Hand */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-auto">
        <div className="flex gap-3">
          {gameState.playerCards.map((card, i) => (
            <CardDisplay key={i} card={card} />
          ))}
          {gameState.playerCards.length === 0 && (
            <div className="text-white/50 text-sm">No cards dealt yet</div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={dealDemoHand}
            className="bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Deal Hand
          </button>
          <button
            onClick={analyzeHand}
            disabled={gameState.playerCards.length < 2 || isAnalyzing}
            className="bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze Hand'}
          </button>
        </div>
      </div>

      {/* Stats overlay */}
      {analysis && (
        <StatsOverlay
          handRank={analysis.handRank}
          winProbability={analysis.winProbability}
          equity={analysis.equity}
        />
      )}

      {/* Bet suggestion */}
      {analysis && (
        <BetSuggestion recommendation={analysis.recommendation} />
      )}

      {/* Game info */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500">
        Stack: ${gameState.playerStack} | Phase: {gameState.phase.toUpperCase()} | Opponents: {gameState.numOpponents}
      </div>
    </div>
  );
}
