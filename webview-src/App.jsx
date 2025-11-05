import { useState, useRef, useEffect } from 'react'
import ChatInterface from './components/ChatInterface'
import FileUpload from './components/FileUpload'
import BuddyStatus from './components/BuddyStatus'
import BuddyAnimation from './components/BuddyAnimation'

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'claude',
      content: "Hey there! I'm your coding buddy! 🤖✨\nReady to tackle some code together?",
      timestamp: new Date()
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [buddyMood, setBuddyMood] = useState('happy')
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [userBubbleColor, setUserBubbleColor] = useState('#3b82f6') // Default blue

  // Apply dark mode class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const addMessage = (content, type = 'user') => {
    const newMessage = {
      id: Date.now(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, newMessage])
  }

  const simulateClaudeResponse = (userMessage) => {
    setIsTyping(true)

    // Simulate API call delay
    setTimeout(() => {
      const responses = [
        "Great question! Let me help you with that...",
        "I see what you're working on! Here's my suggestion:",
        "Nice code! I noticed a few things we could improve:",
        "That's a clever approach! Let me add to that idea:",
        "Hmm, interesting problem! Let's think through this together:"
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      addMessage(randomResponse, 'claude')
      setIsTyping(false)

      // Random mood change
      const moods = ['happy', 'thinking', 'excited', 'focused']
      setBuddyMood(moods[Math.floor(Math.random() * moods.length)])
    }, 1500)
  }

  return (
    <div className={`h-screen w-screen flex ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`} style={{
      backgroundColor: isDarkMode ? '#111827' : '#ffffff',
      color: isDarkMode ? '#ffffff' : '#111827'
    }}>
      {/* Left Sidebar - ChatGPT Style with Buddy */}
      <div className={`w-80 flex-shrink-0 ${isDarkMode ? 'bg-gray-950 border-gray-700' : 'bg-gray-50 border-gray-200'} border-r flex flex-col`} style={{
        backgroundColor: isDarkMode ? '#030712' : '#f9fafb',
        borderColor: isDarkMode ? '#374151' : '#e5e7eb'
      }}>

        {/* Header with Dark Mode Toggle */}
        <div className={`p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Claude Buddy
            </h1>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'hover:bg-gray-800 text-gray-300 hover:text-white'
                  : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>

        {/* Buddy Animation & Status */}
        <div className="p-4">
          <BuddyAnimation mood={buddyMood} isDarkMode={isDarkMode} isCompact={true} />
          <div className="mt-4">
            <BuddyStatus mood={buddyMood} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="px-4 flex-1 overflow-y-auto">
          <FileUpload
            isDarkMode={isDarkMode}
            onFileUpload={(file) => {
              addMessage(`📁 Uploaded: ${file.name}`)
              simulateClaudeResponse(`analyze ${file.name}`)
            }}
          />

          {/* Quick Actions */}
          <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  addMessage("Help me debug this code")
                  simulateClaudeResponse("debug")
                }}
                className={`w-full text-left p-2 text-sm rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                🐛 Debug Code
              </button>
              <button
                onClick={() => {
                  addMessage("Review my code for improvements")
                  simulateClaudeResponse("review")
                }}
                className={`w-full text-left p-2 text-sm rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                👀 Code Review
              </button>
              <button
                onClick={() => {
                  addMessage("Explain this algorithm")
                  simulateClaudeResponse("explain")
                }}
                className={`w-full text-left p-2 text-sm rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                📚 Explain Code
              </button>
              <button
                onClick={() => {
                  addMessage("Help me refactor this")
                  simulateClaudeResponse("refactor")
                }}
                className={`w-full text-left p-2 text-sm rounded transition-colors ${
                  isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                ⚡ Refactor
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area - Full Center like ChatGPT */}
      <div className="flex-1">
        <ChatInterface
          messages={messages}
          onSendMessage={(message) => {
            addMessage(message)
            simulateClaudeResponse(message)
          }}
          isTyping={isTyping}
          isDarkMode={isDarkMode}
          userBubbleColor={userBubbleColor}
          onBubbleColorChange={setUserBubbleColor}
        />
      </div>
    </div>
  )
}

export default App
