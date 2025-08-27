import { useState } from 'react'

interface AnswerInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onClueRequest: () => void
  clueCount: number
  placeholder?: string
  disabled?: boolean
}

function AnswerInput({ 
  value, 
  onChange, 
  onSubmit, 
  onClueRequest,
  clueCount,
  placeholder = "Type your answer...",
  disabled = false 
}: AnswerInputProps) {

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim())
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  const handleClueRequest = () => {
    onClueRequest()
  }

  const handleVoiceInput = () => {
    console.log('Voice input - coming in Phase 2!')
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Main input area */}
      <div className="flex items-center space-x-2 mb-4">
        {/* Voice input button (placeholder) */}
        <button
          onClick={handleVoiceInput}
          disabled={disabled}
          className="flex-shrink-0 w-12 h-12 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-full flex items-center justify-center transition-colors duration-200"
          title="Voice input (coming soon)"
        >
          <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full h-12 px-6 pr-16 bg-gray-800 border border-gray-600 rounded-full text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors duration-200 disabled:opacity-50"
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
          
          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || disabled}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 rounded-full flex items-center justify-center transition-colors duration-200"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>

        {/* Clue button */}
        <button
          onClick={handleClueRequest}
          disabled={disabled || clueCount >= 3}
          className="flex-shrink-0 px-4 h-12 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-800 rounded-full text-white font-medium transition-colors duration-200"
          title="Request a clue"
        >
          CLUE ({clueCount}/3)
        </button>
      </div>

      {/* Input tips for mobile */}
      <div className="text-center text-xs text-gray-500">
        <p>Type your answer and press Enter or tap the arrow</p>
      </div>
    </div>
  )
}

export default AnswerInput