interface StatsOverlayProps {
  handRank: string;
  winProbability: number;
  equity: number;
}

const HAND_COLORS: Record<string, string> = {
  'Royal Flush': 'text-purple-400',
  'Straight Flush': 'text-purple-300',
  'Four of a Kind': 'text-yellow-400',
  'Full House': 'text-yellow-300',
  'Flush': 'text-blue-400',
  'Straight': 'text-blue-300',
  'Three of a Kind': 'text-green-400',
  'Two Pair': 'text-green-300',
  'Pair': 'text-white',
  'High Card': 'text-gray-400',
};

export default function StatsOverlay({ handRank, winProbability, equity }: StatsOverlayProps) {
  const handColor = HAND_COLORS[handRank] || 'text-white';
  const probColor = winProbability >= 60 ? 'text-green-400' : winProbability >= 40 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="absolute top-20 right-4 bg-black/80 border border-gray-700 rounded-xl p-4 w-52 text-sm">
      <div className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3">Hand Analysis</div>

      <div className="mb-2">
        <div className="text-gray-400 text-xs mb-1">Hand Rank</div>
        <div className={`font-bold text-base ${handColor}`}>{handRank}</div>
      </div>

      <div className="mb-2">
        <div className="text-gray-400 text-xs mb-1">Win Probability</div>
        <div className={`font-bold ${probColor}`}>{winProbability.toFixed(1)}%</div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
          <div
            className={`h-1.5 rounded-full transition-all duration-500 ${
              winProbability >= 60 ? 'bg-green-400' : winProbability >= 40 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${Math.min(winProbability, 100)}%` }}
          />
        </div>
      </div>

      <div>
        <div className="text-gray-400 text-xs mb-1">Equity</div>
        <div className="font-bold text-blue-400">{equity.toFixed(1)}%</div>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
          <div
            className="h-1.5 rounded-full bg-blue-400 transition-all duration-500"
            style={{ width: `${Math.min(equity, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
