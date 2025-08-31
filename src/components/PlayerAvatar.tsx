import Avatar from 'boring-avatars'
import { cn } from '../lib/utils'
import { uiCopyService } from '../lib/uiCopy'

interface PlayerAvatarProps {
  playerId: string
  score: number
  isActive: boolean
  isYou?: boolean
  size?: number
}

function PlayerAvatar({ playerId, score, isActive, isYou = false, size = 60 }: PlayerAvatarProps) {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex flex-col items-center">
        {/* Avatar with pulse animation when active */}
        <div className={cn(
          "rounded-full transition-all duration-300 border-4",
          isActive 
            ? "border-blue-400 shadow-lg shadow-blue-400/50 scale-105" 
            : "border-gray-600"
        )}>
          <Avatar
            size={size}
            name={playerId}
            variant="marble"
            colors={['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F', '#FF8E53']}
          />
        </div>
        
        {/* Score display */}
        <div className={cn(
          "mt-2 px-3 py-1 rounded-full text-sm font-bold transition-all duration-300",
          isActive
            ? "bg-blue-500 text-white shadow-lg"
            : "bg-gray-700 text-gray-300"
        )}>
          {score}
        </div>
        
        {/* Player indicator */}
        <div className="text-xs text-gray-500 mt-1">
          {isYou ? uiCopyService.getValue('game.player.you') : uiCopyService.getValue('game.player.opponent')}
        </div>
      </div>
    </div>
  )
}

export default PlayerAvatar