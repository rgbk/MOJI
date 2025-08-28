import { useState, useEffect, useRef, useCallback } from 'react'
import { audioFeedback } from '../lib/audio'

// TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare var SpeechRecognition: SpeechRecognitionConstructor
declare var webkitSpeechRecognition: SpeechRecognitionConstructor

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

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

      setTranscript(currentTranscript)
      setConfidence(currentConfidence)

      // If we have a final result with good confidence, stop listening
      if (finalTranscript && currentConfidence >= confidenceThreshold) {
        setState('processing')
        
        // Play success sound
        if (enableAudioFeedback) {
          audioFeedback.playSuccessSound()
        }
        
        recognition.stop()
      }
    }

    // Handle start
    recognition.onstart = () => {
      setState('listening')
      setError(null)
      
      // Play start listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStartListeningSound()
      }
      
      // Set a timeout to automatically stop listening after 10 seconds
      timeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, 10000)
    }

    // Handle end
    recognition.onend = () => {
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

  return {
    state,
    transcript: transcript.trim(),
    confidence,
    isSupported,
    isListening: state === 'listening',
    error,
    startListening,
    stopListening,
    resetTranscript
  }
}