interface BetSuggestionProps {
  recommendation: {
    action: string;
    reasoning: string;
    confidence: number;
    expectedValue: number;
  };
}

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  fold:     { bg: 'bg-red-900/80',    text: 'text-red-300',    border: 'border-red-700' },
  check:    { bg: 'bg-gray-800/80',   text: 'text-gray-300',   border: 'border-gray-600' },
  call:     { bg: 'bg-blue-900/80',   text: 'text-blue-300',   border: 'border-blue-700' },
  raise:    { bg: 'bg-green-900/80',  text: 'text-green-300',  border: 'border-green-700' },
  'all-in': { bg: 'bg-purple-900/80', text: 'text-purple-300', border: 'border-purple-700' },
};

export default function BetSuggestion({ recommendation }: BetSuggestionProps) {
  const { action, reasoning, confidence, expectedValue } = recommendation;
  const style = ACTION_STYLES[action] || ACTION_STYLES.check;

  return (
    <div className={`absolute top-20 left-4 ${style.bg} border ${style.border} rounded-xl p-4 w-56 text-sm`}>
      <div className="text-yellow-400 font-bold text-xs uppercase tracking-widest mb-3">AI Recommendation</div>

      <div className={`text-2xl font-bold uppercase ${style.text} mb-2`}>
        {action}
      </div>

      <div className="text-gray-300 text-xs mb-3 leading-relaxed">
        {reasoning}
      </div>

      <div className="flex justify-between text-xs">
        <div>
          <div className="text-gray-500">Confidence</div>
          <div className="text-white font-medium">{confidence}%</div>
        </div>
        <div className="text-right">
          <div className="text-gray-500">EV</div>
          <div className={expectedValue >= 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
            {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(0)}
          </div>
        </div>
      </div>

      <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
        <div
          className={`h-1 rounded-full transition-all ${style.text.replace('text-', 'bg-')}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}
