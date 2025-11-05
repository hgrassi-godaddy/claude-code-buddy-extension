import { useState, useEffect } from 'react'

const BuddyStatus = ({ mood = 'happy', isDarkMode }) => {
  const [currentMood, setCurrentMood] = useState(mood)
  const [friendshipLevel, setFriendshipLevel] = useState(75)

  useEffect(() => {
    setCurrentMood(mood)
  }, [mood])

  const getMoodDisplay = () => {
    const moods = {
      happy: { emoji: '😊', status: 'Happy', color: isDarkMode ? 'text-green-400' : 'text-green-600' },
      thinking: { emoji: '🤔', status: 'Thinking', color: isDarkMode ? 'text-yellow-400' : 'text-yellow-600' },
      excited: { emoji: '🤩', status: 'Excited', color: isDarkMode ? 'text-purple-400' : 'text-purple-600' },
      focused: { emoji: '🧠', status: 'Focused', color: isDarkMode ? 'text-blue-400' : 'text-blue-600' },
      helping: { emoji: '🛠️', status: 'Helping', color: isDarkMode ? 'text-orange-400' : 'text-orange-600' }
    }
    return moods[currentMood] || moods.happy
  }

  const moodData = getMoodDisplay()

  return (
    <div className={`p-1 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      {/* Buddy Box - MASSIVE (Half the sidebar) */}
      <div className={`mb-6 p-12 rounded-xl border-3 border-dashed min-h-[50vh] ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-100 border-gray-300'}`} style={{ borderWidth: '3px' }}>
        <div className="text-center flex flex-col justify-center h-full">
          <div className={`w-40 h-40 mx-auto rounded-2xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} flex items-center justify-center mb-6`} style={{ fontSize: '120px' }}>
            🤖
          </div>
          <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} mb-3`}>
            Buddy
          </div>
          <div className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Coming soon...
          </div>
        </div>
      </div>


      {/* Friendship Level - Tiny */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center space-x-0.5">
            <span className="text-red-500 text-xs">💖</span>
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {friendshipLevel}%
            </span>
          </div>
        </div>

        <div className={`w-full h-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden mb-1`}>
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-red-500 to-pink-600 transition-all duration-500 rounded-full"
            style={{ width: `${friendshipLevel}%` }}
          ></div>
        </div>

        <div className={`text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-500'} text-center`}>
          {friendshipLevel >= 80 && "Best buddies!"}
          {friendshipLevel >= 60 && friendshipLevel < 80 && "Great friends!"}
          {friendshipLevel >= 40 && friendshipLevel < 60 && "Good pals!"}
          {friendshipLevel >= 20 && friendshipLevel < 40 && "Getting closer!"}
          {friendshipLevel < 20 && "Just started!"}
        </div>
      </div>
    </div>
  )
}

export default BuddyStatus