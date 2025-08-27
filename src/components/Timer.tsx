import { useEffect, useState } from 'react'

interface TimerProps {
  timeLeft: number
  maxTime: number
}

function Timer({ timeLeft, maxTime }: TimerProps) {
  const [animatedWidth, setAnimatedWidth] = useState(100)
  
  useEffect(() => {
    const percentage = (timeLeft / maxTime) * 100
    setAnimatedWidth(percentage)
  }, [timeLeft, maxTime])

  const isLowTime = timeLeft <= 10
  const barColor = isLowTime ? 'bg-red-500' : 'bg-yellow-400'
  const glowColor = isLowTime ? 'shadow-red-500/50' : 'shadow-yellow-400/50'

  return (
    <div className="w-full mb-8">
      {/* Timer display */}
      <div className="text-center mb-2">
        <span className={`text-2xl font-bold ${isLowTime ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
          {timeLeft}s
        </span>
      </div>
      
      {/* Timer bar container */}
      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden shadow-inner">
        {/* Background glow effect */}
        <div 
          className={`absolute inset-0 ${barColor} opacity-20 blur-sm`}
          style={{ width: `${animatedWidth}%` }}
        />
        
        {/* Main timer bar */}
        <div 
          className={`h-full ${barColor} shadow-lg ${glowColor} transition-all duration-1000 ease-linear relative overflow-hidden`}
          style={{ width: `${animatedWidth}%` }}
        >
          {/* Burning effect - animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          
          {/* Street Fighter style edges */}
          <div className="absolute left-0 top-0 h-full w-2 bg-gradient-to-r from-white/60 to-transparent" />
          <div className="absolute right-0 top-0 h-full w-2 bg-gradient-to-l from-white/60 to-transparent" />
        </div>

        {/* Center time indicator */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="text-xs font-bold text-white drop-shadow-lg">
            ⏱
          </div>
        </div>
      </div>

      {/* Decorative side elements (Street Fighter style) */}
      <div className="flex justify-between mt-1">
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full opacity-60" />
          ))}
        </div>
        <div className="flex space-x-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-2 h-2 bg-yellow-400 rounded-full opacity-60" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Timer