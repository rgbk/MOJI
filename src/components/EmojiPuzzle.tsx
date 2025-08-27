import { cn } from '../lib/utils'

interface EmojiPuzzleProps {
  emoji: string
  type: string
  showError?: boolean
  clue?: string
}

function EmojiPuzzle({ emoji, type, showError = false, clue }: EmojiPuzzleProps) {
  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      {/* Emoji Display */}
      <div className={cn(
        "text-8xl sm:text-9xl transition-all duration-300 select-none",
        showError && "animate-shake text-red-400"
      )}>
        {emoji}
      </div>

      {/* Type Badge */}
      <div className="bg-gray-800 border border-gray-600 rounded-full px-6 py-2">
        <span className="text-gray-300 text-sm font-medium uppercase tracking-wider">
          {type.replace('-', ' + ')}
        </span>
      </div>

      {/* Clue display */}
      {clue && (
        <div className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-6 py-3 max-w-sm">
          <div className="text-purple-300 text-xs uppercase tracking-wide font-medium mb-1">Clue</div>
          <span className="text-purple-100 font-medium">{clue}</span>
        </div>
      )}

      {/* Error feedback */}
      {showError && (
        <div className="animate-bounce bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2">
          <span className="text-red-400 font-medium">Wrong! Try again...</span>
        </div>
      )}
    </div>
  )
}

export default EmojiPuzzle