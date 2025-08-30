import { useState, useEffect, useRef, useCallback } from 'react'
import { audioFeedback } from '../lib/audio'

// SpeechRecognition types are defined in src/types/speech.d.ts

export type VoiceRecognitionState = 
  | 'idle' 
  | 'listening' 
  | 'processing' 
  | 'error' 
  | 'not-supported'

export interface VoiceRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  confidenceThreshold?: number
  enableAudioFeedback?: boolean
}

export interface UseVoiceRecognitionReturn {
  state: VoiceRecognitionState
  transcript: string
  confidence: number
  isSupported: boolean
  isListening: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  // Push-to-Talk specific methods
  startPushToTalk: () => void
  stopPushToTalk: () => void
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    confidenceThreshold = 0.5,
    enableAudioFeedback = true
  } = options

  const [state, setState] = useState<VoiceRecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognitionAPI) {
      setIsSupported(true)
      setState('idle')
    } else {
      setIsSupported(false)
      setState('not-supported')
    }
  }, [])

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!isSupported) return null

    const SpeechRecognitionAPI = 
      window.SpeechRecognition || window.webkitSpeechRecognition

    const recognition = new SpeechRecognitionAPI()
    
    // Configure recognition settings
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language
    recognition.maxAlternatives = maxAlternatives

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('🎤 Voice recognition result:', { eventType: 'result', resultIndex: event.resultIndex, resultsLength: event.results.length })
      
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const alternative = result[0]

        if (result.isFinal) {
          finalTranscript += alternative.transcript
        } else {
          interimTranscript += alternative.transcript
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      const currentConfidence = event.results[event.results.length - 1]?.[0]?.confidence || 0

      console.log('🎤 Transcript update:', { 
        transcript: currentTranscript, 
        confidence: currentConfidence, 
        isFinal: !!finalTranscript 
      })

      setTranscript(currentTranscript)
      setConfidence(currentConfidence)

      // For Push-to-Talk: Always keep listening, never auto-stop based on confidence
      // The transcript will be submitted when user releases the button
    }

    // Handle start
    recognition.onstart = () => {
      console.log('🎤 Voice recognition started')
      setState('listening')
      setError(null)
      
      // Play start listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStartListeningSound()
      }
      
      // Set a timeout to automatically stop listening after 15 seconds (Push-to-Talk safety)
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Push-to-Talk timeout reached (15s)')
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, 15000)
    }

    // Handle end
    recognition.onend = () => {
      console.log('🎤 Voice recognition ended')
      setState('idle')
      
      // Play stop listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStopListeningSound()
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('🎤 Voice recognition error:', event.error)
      setState('error')
      
      let errorMessage = 'Speech recognition error'
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable microphone permissions.'
          break
        case 'no-speech':
          errorMessage = 'No speech detected. Please try speaking clearly.'
          break
        case 'audio-capture':
          errorMessage = 'No microphone found. Please check your microphone connection.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your internet connection.'
          break
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }
      
      setError(errorMessage)
      
      // Play error sound
      if (enableAudioFeedback) {
        audioFeedback.playErrorSound()
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    return recognition
  }, [isSupported, continuous, interimResults, language, maxAlternatives, confidenceThreshold, enableAudioFeedback])

  // Start listening function
  const startListening = useCallback(() => {
    if (!isSupported || state === 'listening') return

    try {
      // Clean up any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      // Create new recognition instance
      recognitionRef.current = initializeRecognition()
      
      if (recognitionRef.current) {
        setTranscript('')
        setConfidence(0)
        setError(null)
        recognitionRef.current.start()
      }
    } catch (err) {
      setState('error')
      setError('Failed to start speech recognition. Please try again.')
      console.error('Speech recognition start error:', err)
    }
  }, [isSupported, state, initializeRecognition])

  // Stop listening function
  const stopListening = useCallback(() => {
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop()
    }
  }, [state])

  // Reset transcript function
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
    setError(null)
    if (state !== 'listening') {
      setState('idle')
    }
  }, [state])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Push-to-Talk specific methods
  const startPushToTalk = useCallback(() => {
    console.log('🎤 Starting Push-to-Talk')
    if (!isSupported || state === 'listening') {
      console.log('🎤 Cannot start - not supported or already listening')
      return
    }
    startListening()
  }, [isSupported, state, startListening])

  const stopPushToTalk = useCallback(() => {
    console.log('🎤 Stopping Push-to-Talk')
    if (recognitionRef.current && state === 'listening') {
      recognitionRef.current.stop()
    }
  }, [state])

  return {
    state,
    transcript: transcript.trim(),
    confidence,
    isSupported,
    isListening: state === 'listening',
    error,
    startListening,
    stopListening,
    resetTranscript,
    // Push-to-Talk methods
    startPushToTalk,
    stopPushToTalk
  }
}