import { useState, useEffect } from 'react'

const BuddyAnimation = ({ mood = 'happy', isDarkMode, isCompact = false }) => {
  const [currentAnimation, setCurrentAnimation] = useState('idle')
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 })

  // Track mouse for eye movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const rect = document.getElementById('buddy-face')?.getBoundingClientRect()
      if (rect) {
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
        const distance = Math.min(15, Math.sqrt((e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2) / 10)

        setEyePosition({
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Animation cycles based on mood
  useEffect(() => {
    const animations = {
      happy: ['idle', 'blink', 'smile', 'bounce'],
      thinking: ['idle', 'blink', 'ponder', 'nod'],
      excited: ['idle', 'blink', 'jump', 'wiggle'],
      focused: ['idle', 'blink', 'concentrate', 'type']
    }

    const cycle = animations[mood] || animations.happy
    let index = 0

    const interval = setInterval(() => {
      setCurrentAnimation(cycle[index % cycle.length])
      index++
    }, 2000)

    return () => clearInterval(interval)
  }, [mood])

  const getBuddyColor = () => {
    const colors = {
      happy: isDarkMode ? 'from-green-400 to-emerald-500' : 'from-green-500 to-emerald-600',
      thinking: isDarkMode ? 'from-yellow-400 to-orange-500' : 'from-yellow-500 to-orange-600',
      excited: isDarkMode ? 'from-purple-400 to-pink-500' : 'from-purple-500 to-pink-600',
      focused: isDarkMode ? 'from-blue-400 to-indigo-500' : 'from-blue-500 to-indigo-600'
    }
    return colors[mood] || colors.happy
  }

  const getAnimationClass = () => {
    const classes = {
      idle: '',
      blink: 'animate-pulse',
      smile: 'animate-bounce',
      bounce: 'animate-bounce',
      ponder: 'animate-pulse',
      nod: 'animate-bounce',
      jump: 'animate-bounce',
      wiggle: 'animate-pulse',
      concentrate: 'animate-pulse',
      type: 'animate-pulse'
    }
    return classes[currentAnimation] || ''
  }

  if (isCompact) {
    return (
      <div className="flex flex-col items-center">
        {/* Compact Buddy Avatar */}
        <div className="relative mb-3">
          <div
            id="buddy-face"
            className={`w-20 h-20 rounded-full bg-gradient-to-br ${getBuddyColor()} flex items-center justify-center shadow-lg ${getAnimationClass()}`}
          >
            {/* Eyes */}
            <div className="flex space-x-2 mb-1">
              <div className="relative w-4 h-4 bg-white rounded-full">
                <div
                  className="absolute w-2 h-2 bg-black rounded-full top-1 left-1 transition-transform duration-150"
                  style={{
                    transform: `translate(${eyePosition.x * 0.5}px, ${eyePosition.y * 0.5}px)`
                  }}
                />
              </div>
              <div className="relative w-4 h-4 bg-white rounded-full">
                <div
                  className="absolute w-2 h-2 bg-black rounded-full top-1 left-1 transition-transform duration-150"
                  style={{
                    transform: `translate(${eyePosition.x * 0.5}px, ${eyePosition.y * 0.5}px)`
                  }}
                />
              </div>
            </div>

            {/* Mouth based on mood */}
            <div className="absolute bottom-4">
              {mood === 'happy' && (
                <div className="w-4 h-2 border-b-2 border-white rounded-full"></div>
              )}
              {mood === 'thinking' && (
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
              {mood === 'excited' && (
                <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <span className="text-black text-xs">!</span>
                </div>
              )}
              {mood === 'focused' && (
                <div className="w-4 h-0.5 bg-white rounded-full"></div>
              )}
            </div>
          </div>

          {/* Floating particles for excited mood */}
          {mood === 'excited' && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping"></div>
              <div className="absolute -top-0.5 -right-2 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute -bottom-2 -left-0.5 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
            </div>
          )}
        </div>

        {/* Compact Mood Status */}
        <div className="text-center">
          <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {currentAnimation === 'idle' && '💤 Resting'}
            {currentAnimation === 'blink' && '👁️ Watching'}
            {currentAnimation === 'smile' && '😊 Happy'}
            {currentAnimation === 'bounce' && '🎾 Energetic'}
            {currentAnimation === 'ponder' && '🤔 Thinking'}
            {currentAnimation === 'nod' && '✅ Got it!'}
            {currentAnimation === 'jump' && '🚀 Excited'}
            {currentAnimation === 'wiggle' && '🎉 Celebrating'}
            {currentAnimation === 'concentrate' && '🎯 Focusing'}
            {currentAnimation === 'type' && '⌨️ Processing'}
          </div>
        </div>

      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col items-center justify-center p-6 ${isDarkMode ? 'bg-gray-950' : 'bg-white'}`}>
      {/* Buddy Avatar */}
      <div className="relative mb-6">
        <div
          id="buddy-face"
          className={`w-32 h-32 rounded-full bg-gradient-to-br ${getBuddyColor()} flex items-center justify-center shadow-lg ${getAnimationClass()}`}
        >
          {/* Eyes */}
          <div className="flex space-x-4 mb-2">
            <div className="relative w-6 h-6 bg-white rounded-full">
              <div
                className="absolute w-3 h-3 bg-black rounded-full top-1.5 left-1.5 transition-transform duration-150"
                style={{
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
                }}
              />
            </div>
            <div className="relative w-6 h-6 bg-white rounded-full">
              <div
                className="absolute w-3 h-3 bg-black rounded-full top-1.5 left-1.5 transition-transform duration-150"
                style={{
                  transform: `translate(${eyePosition.x}px, ${eyePosition.y}px)`
                }}
              />
            </div>
          </div>

          {/* Mouth based on mood */}
          <div className="absolute bottom-8">
            {mood === 'happy' && (
              <div className="w-8 h-4 border-b-4 border-white rounded-full"></div>
            )}
            {mood === 'thinking' && (
              <div className="w-2 h-2 bg-white rounded-full"></div>
            )}
            {mood === 'excited' && (
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <span className="text-black text-sm">!</span>
              </div>
            )}
            {mood === 'focused' && (
              <div className="w-6 h-1 bg-white rounded-full"></div>
            )}
          </div>
        </div>

        {/* Floating particles for excited mood */}
        {mood === 'excited' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-2 -left-2 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-3 w-1 h-1 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute -bottom-3 -left-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </div>
        )}
      </div>

      {/* Mood Status */}
      <div className="text-center mb-4">
        <div className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {mood.charAt(0).toUpperCase() + mood.slice(1)}
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          I'm feeling {mood} today!
        </div>
      </div>

      {/* Activity Indicator */}
      <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} w-full`}>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Current Activity</div>
        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {currentAnimation === 'idle' && '💤 Resting'}
          {currentAnimation === 'blink' && '👁️ Observing'}
          {currentAnimation === 'smile' && '😊 Happy'}
          {currentAnimation === 'bounce' && '🎾 Energetic'}
          {currentAnimation === 'ponder' && '🤔 Thinking'}
          {currentAnimation === 'nod' && '✅ Understanding'}
          {currentAnimation === 'jump' && '🚀 Excited'}
          {currentAnimation === 'wiggle' && '🎉 Celebrating'}
          {currentAnimation === 'concentrate' && '🎯 Focusing'}
          {currentAnimation === 'type' && '⌨️ Processing'}
        </div>
      </div>

      {/* Interactive Elements */}
      <div className="mt-6 space-y-2 w-full">
        <button
          onClick={() => setCurrentAnimation('bounce')}
          className={`w-full p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          👋 Wave Hello
        </button>
        <button
          onClick={() => setCurrentAnimation('wiggle')}
          className={`w-full p-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-gray-800 hover:bg-gray-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
          }`}
        >
          🎉 Celebrate
        </button>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-2 w-full text-xs">
        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Messages</div>
          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>42</div>
        </div>
        <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} text-center`}>
          <div className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Helped</div>
          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>15</div>
        </div>
      </div>
    </div>
  )
}

export default BuddyAnimation