import { useState, useRef, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'

const ChatInterface = ({ messages, onSendMessage, isTyping, isDarkMode, userBubbleColor, onBubbleColorChange }) => {
  const [inputMessage, setInputMessage] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      onSendMessage(inputMessage.trim())
      setInputMessage('')
    }
  }

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getBuddyAutoColor = () => {
    // Light blue color for Buddy
    return '#60a5fa' // Light blue - friendly and calm
  }

  const getBubbleStyle = (messageType) => {
    if (messageType === 'user') {
      return {
        backgroundColor: userBubbleColor,
        color: 'white'
      }
    } else {
      // Buddy's bubbles - colorful auto-color
      return {
        backgroundColor: getBuddyAutoColor(),
        color: 'white'
      }
    }
  }

  const getBubbleClasses = (messageType) => {
    // Not used anymore - we use inline styles for all bubbles
    return 'text-white'
  }

  const presetColors = [
    '#3b82f6', // Blue
    '#10b981', // Green
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#ef4444', // Red
    '#06b6d4', // Teal
    '#6366f1'  // Indigo
  ]

  const formatMessage = (content) => {
    // Simple formatting for code blocks and line breaks
    return content.split('\n').map((line, index) => (
      <div key={index}>
        {line.startsWith('```') ? (
          <code className="bg-gray-800 px-2 py-1 rounded text-green-300 block mt-1 mb-1 font-mono text-sm">
            {line.replace(/```/g, '')}
          </code>
        ) : line.startsWith('`') && line.endsWith('`') ? (
          <code className="bg-gray-800 px-1 rounded text-green-300 font-mono text-sm">
            {line.slice(1, -1)}
          </code>
        ) : (
          line
        )}
      </div>
    ))
  }

  return (
    <div className={`h-full flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Messages Area - Full Screen Chat like ChatGPT */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          {messages.map((message) => (
            <div key={message.id} className={`mb-4 flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="flex flex-col max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                {/* Message Bubble */}
                <div
                  className="shadow-sm"
                  style={{
                    ...getBubbleStyle(message.type),
                    borderRadius: '20px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    paddingTop: '16px',
                    paddingBottom: '16px'
                  }}
                >
                  <div className="text-[15px] leading-relaxed break-words hyphens-auto whitespace-pre-wrap">
                    {formatMessage(message.content)}
                  </div>
                </div>
                {/* Timestamp only */}
                <div className={`text-xs mt-1 px-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="mb-4 flex justify-start">
              <div className="flex flex-col max-w-sm sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                {/* Typing Bubble */}
                <div
                  className="shadow-sm"
                  style={{
                    ...getBubbleStyle('claude'),
                    borderRadius: '20px',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    paddingTop: '16px',
                    paddingBottom: '16px'
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-white bg-opacity-70 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white bg-opacity-70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white bg-opacity-70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
                {/* No label, just visual indication through bubble position */}
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Sticky Bottom like ChatGPT */}
      <div className={`border-t ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} p-4`}>
        <div className="max-w-4xl mx-auto">
          {/* Color Picker Row */}
          <div className="mb-3 relative">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Your bubble color:
              </span>
              <div className="flex items-center space-x-2">
                {/* Preset Colors */}
                <div className="flex space-x-1">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => onBubbleColorChange(color)}
                      className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                        userBubbleColor === color
                          ? 'ring-2 ring-offset-1 ring-blue-500 scale-110'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Color ${color}`}
                    />
                  ))}
                </div>

                {/* Custom Color Picker Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className={`w-8 h-6 rounded border-2 border-dashed transition-colors ${
                      isDarkMode ? 'border-gray-500 hover:border-gray-400' : 'border-gray-400 hover:border-gray-600'
                    }`}
                    title="Custom color picker"
                  >
                    <span className="text-xs">+</span>
                  </button>

                  {/* Color Picker Popup */}
                  {showColorPicker && (
                    <div className={`absolute bottom-full right-0 mb-2 p-3 rounded-lg shadow-xl border z-50 ${
                      isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`} style={{
                      position: 'fixed',
                      bottom: '120px',
                      right: '20px',
                      zIndex: 1000
                    }}>
                      <div className="mb-2">
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Choose custom color
                        </span>
                      </div>
                      <HexColorPicker
                        color={userBubbleColor}
                        onChange={onBubbleColorChange}
                        style={{ width: '200px', height: '150px' }}
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <input
                          type="text"
                          value={userBubbleColor}
                          onChange={(e) => onBubbleColorChange(e.target.value)}
                          className={`text-xs px-2 py-1 rounded border ${
                            isDarkMode
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="#000000"
                        />
                        <button
                          type="button"
                          onClick={() => setShowColorPicker(false)}
                          className={`ml-2 text-xs px-2 py-1 rounded ${
                            isDarkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message Buddy..."
                disabled={isTyping}
                maxLength={500}
                rows={1}
                style={{
                  width: '100%',
                  minHeight: '52px',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  paddingLeft: '32px',
                  paddingRight: '60px',
                  borderRadius: '16px',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #d1d5db',
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  color: isDarkMode ? '#ffffff' : '#111827',
                  fontSize: '16px',
                  lineHeight: '1.5',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  textIndent: '0px',
                  margin: '0px',
                  webkitAppearance: 'none',
                  appearance: 'none',
                  resize: 'none',
                  overflow: 'hidden'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? '#4b5563' : '#d1d5db'
                  e.target.style.boxShadow = 'none'
                }}
                onInput={(e) => {
                  // Auto-resize textarea
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '8px',
                  border: 'none',
                  background: 'transparent',
                  cursor: !inputMessage.trim() || isTyping ? 'not-allowed' : 'pointer',
                  color: !inputMessage.trim() || isTyping
                    ? (isDarkMode ? '#6b7280' : '#9ca3af')
                    : '#3b82f6'
                }}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className={`flex justify-between items-center mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <span>Press Enter to send • Shift+Enter for new line</span>
              <span className={inputMessage.length > 450 ? 'text-red-500' : ''}>{inputMessage.length}/500</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface