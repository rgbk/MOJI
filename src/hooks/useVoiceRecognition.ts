import { useState, useEffect, useRef, useCallback } from 'react'
import { audioFeedback } from '../lib/audio'
import { BROWSER_INFO } from '../utils/browserDetection'

export type VoiceRecognitionState = 
  | 'idle' 
  | 'starting'
  | 'listening' 
  | 'processing' 
  | 'error' 
  | 'not-supported'

export interface UseVoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  confidenceThreshold?: number
  enableAudioFeedback?: boolean
}

export interface PerformanceMetrics {
  startTime?: number
  permissionTime?: number
  recognitionStartTime?: number
  firstResultTime?: number
  finalResultTime?: number
  totalDuration?: number
  resultCount: number
  isMobile: boolean
  browser: string
}

export interface UseVoiceRecognitionReturn {
  state: VoiceRecognitionState
  transcript: string
  confidence: number
  isSupported: boolean
  isListening: boolean
  error: string | null
  permissionGranted: boolean | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  requestPermission: () => Promise<boolean>
  // Push-to-Talk specific methods
  startPushToTalk: () => void
  stopPushToTalk: () => void
  // Performance metrics
  metrics: PerformanceMetrics
}

// Safari-specific detection for proper permission handling
function getSpeechRecognitionClass(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null
  
  // Check for native SpeechRecognition first
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition
  }
  
  // Check for webkit prefixed version (Safari, Chrome)
  if ('webkitSpeechRecognition' in window) {
    return (window as any).webkitSpeechRecognition
  }
  
  return null
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {},
  roomId?: string
): UseVoiceRecognitionReturn {
  const {
    language = 'en-US',
    continuous = true,  // Changed to true for toggle recording
    interimResults = true,
    confidenceThreshold = 0.5,
    enableAudioFeedback = true
  } = options

  const [state, setState] = useState<VoiceRecognitionState>('idle')
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    resultCount: 0,
    isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    browser: BROWSER_INFO.browserName || 'unknown'
  })

  const recognitionRef = useRef<any>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isStartingRef = useRef(false)
  const lastStartTime = useRef<number>(0)
  const debounceDelay = metrics.isMobile ? 500 : 100 // Higher debounce for mobile

  // Get the speech recognition class
  const SpeechRecognitionClass = getSpeechRecognitionClass()
  const isSupported = SpeechRecognitionClass !== null

  // Store permission in localStorage to persist across Safari navigation
  useEffect(() => {
    if (roomId && permissionGranted !== null) {
      const storageKey = `moji-mic-permission-${roomId}`
      localStorage.setItem(storageKey, permissionGranted ? 'granted' : 'denied')
      console.log('🎤 Saved permission to storage:', { roomId, granted: permissionGranted })
    }
  }, [roomId, permissionGranted])
  
  // Initialize permission from localStorage on mount
  useEffect(() => {
    console.log('🎤 PERMISSION: Initializing for roomId:', roomId)
    if (roomId) {
      const storageKey = `moji-mic-permission-${roomId}`
      const saved = localStorage.getItem(storageKey)
      console.log('🎤 PERMISSION: Storage check -', { storageKey, saved })
      
      if (saved === 'granted') {
        console.log('🎤 PERMISSION: Setting to TRUE from storage')
        setPermissionGranted(true)
      } else if (saved === 'denied') {
        console.log('🎤 PERMISSION: Setting to FALSE from storage')
        setPermissionGranted(false)
      } else {
        console.log('🎤 PERMISSION: No saved permission, leaving as null')
      }
    }
  }, [roomId])

  // Simplified error messages
  const getErrorMessage = useCallback((error: string): string => {
    if (BROWSER_INFO.isSafari) {
      return 'Safari microphone access denied. Please tap the microphone icon in your browser address bar, select "Allow", and try again.'
    }
    return 'Microphone access denied. Please check browser permissions and try again.'
  }, [])

  // Initialize and check browser support
  useEffect(() => {
    console.log('🎤 Custom voice recognition hook initialized')
    
    // Check secure context
    const isSecureContext = window.isSecureContext || 
      window.location.protocol === 'https:' || 
      window.location.hostname === 'localhost'
    
    if (!isSecureContext) {
      setState('not-supported')
      setError('Microphone access requires HTTPS')
      return
    }

    if (isSupported) {
      setState('idle')
      console.log('🎤 Speech recognition supported')
    } else {
      setState('not-supported')
      setError('Speech recognition not supported in this browser')
    }
  }, [isSupported])

  // Safari-specific permission check that avoids false positives
  const checkMicrophonePermission = useCallback(async (): Promise<'granted' | 'denied' | 'prompt'> => {
    if (BROWSER_INFO.isSafari) {
      // Safari incognito mode often shows false positives, so we need to actually test
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
        })
        stream.getTracks().forEach(track => track.stop())
        console.log('🎤 Safari: Real permission test passed')
        return 'granted'
      } catch (err: any) {
        console.log('🎤 Safari: Real permission test failed:', err.name)
        if (err.name === 'NotAllowedError') {
          return 'denied'
        }
        return 'prompt'
      }
    } else {
      // For other browsers, check the permissions API if available
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({ name: 'microphone' as any })
          return permission.state as 'granted' | 'denied' | 'prompt'
        } catch {
          // Fallback to prompt if permissions API fails
          return 'prompt'
        }
      }
      return 'prompt'
    }
  }, [])

  // Request permission with proper Safari handling
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const startTime = performance.now()
    
    if (!isSupported) {
      setError('Speech recognition not supported')
      return false
    }
    
    try {
      console.log('🎤 Requesting microphone permission...')
      
      // For mobile, use less aggressive audio settings
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: isMobile ? {
          // Mobile-optimized settings
          echoCancellation: false,  // Disable for better performance
          noiseSuppression: false,  // Disable for better performance
          autoGainControl: true,    // Keep for volume consistency
          sampleRate: 16000         // Lower sample rate for mobile
        } : {
          // Desktop settings
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Stop tracks immediately - we just need permission
      stream.getTracks().forEach(track => track.stop())
      
      const permissionTime = performance.now() - startTime
      setMetrics(prev => ({ ...prev, permissionTime }))
      console.log(`🎤 Permission granted in ${permissionTime.toFixed(0)}ms`)
      
      setPermissionGranted(true)
      setError(null)
      setState('idle')
      
      console.log('🎤 Microphone permission granted')
      return true
      
    } catch (err: any) {
      console.error('🎤 Permission request failed:', err)
      setPermissionGranted(false)
      setState('error')
      setError(getErrorMessage(err.name || 'unknown'))
      return false
    }
  }, [isSupported, getErrorMessage])

  // Create and configure speech recognition instance
  const createRecognition = useCallback(() => {
    if (!SpeechRecognitionClass || recognitionRef.current) {
      return recognitionRef.current
    }

    console.log('🎤 Creating new SpeechRecognition instance')
    const recognition = new SpeechRecognitionClass()

    // Configure recognition settings with mobile optimizations
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    recognition.continuous = continuous
    recognition.interimResults = isMobile ? false : interimResults // Disable interim on mobile for performance
    recognition.lang = language
    recognition.maxAlternatives = isMobile ? 1 : 3 // Reduce alternatives on mobile

    // Event handlers
    recognition.onstart = () => {
      const now = performance.now()
      console.log('🎤 TOGGLE: Started listening - continuous =', continuous)
      setIsListening(true)
      setState('listening')
      setError(null)
      isStartingRef.current = false
      
      // Track recognition start time
      setMetrics(prev => {
        if (prev.startTime) {
          const recognitionStartTime = now
          // Performance tracking
          return { ...prev, recognitionStartTime }
        }
        return prev
      })

      // Play start listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStartListeningSound()
      }
      
      // Safety timeout for toggle recording (60s max)
      timeoutRef.current = setTimeout(() => {
        console.log('🎤 TOGGLE: Auto-timeout after 60s for safety')
        if (recognitionRef.current) {
          recognitionRef.current.stop()
        }
      }, 60000)
    }

    recognition.onaudiostart = () => {
      console.log('🎤 TOGGLE: Audio started')
    }

    recognition.onspeechstart = () => {
      console.log('🎤 TOGGLE: Speech detected')
    }

    recognition.onresult = (event: any) => {
      const now = performance.now()
      console.log('🎤 TOGGLE: Result received')
      
      // Track performance metrics
      setMetrics(prev => {
        const updated = { ...prev, resultCount: prev.resultCount + 1 }
        if (!prev.firstResultTime && prev.startTime) {
          updated.firstResultTime = now
          console.log(`🎤 First result in ${(now - prev.startTime).toFixed(0)}ms`)
        }
        return updated
      })
      
      let finalTranscript = ''
      let interimTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const transcriptPart = result[0].transcript

        if (result.isFinal) {
          finalTranscript += transcriptPart
          maxConfidence = Math.max(maxConfidence, result[0].confidence || 0.5)
          console.log('🎤 TOGGLE: FINAL result:', transcriptPart, '- SHOULD NOT AUTO-STOP!')
          
          // Track final result time
          setMetrics(prev => ({
            ...prev,
            finalResultTime: now,
            totalDuration: prev.startTime ? now - prev.startTime : undefined
          }))
        } else {
          interimTranscript += transcriptPart
          console.log('🎤 Interim transcript:', transcriptPart)
        }
      }

      // Update transcript state - replace instead of append to prevent duplicates
      if (finalTranscript) {
        setTranscript(finalTranscript.trim())
        setConfidence(maxConfidence)
      } else if (interimTranscript && interimResults) {
        setTranscript(interimTranscript.trim())
      }
    }

    recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error, event.message)
      isStartingRef.current = false
      
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }

      // Handle different error types
      switch (event.error) {
        case 'not-allowed':
          setPermissionGranted(false)
          setState('error')
          setError(getErrorMessage('not-allowed'))
          break
        case 'no-speech':
          console.log('🎤 No speech detected')
          setState('idle')
          break
        case 'audio-capture':
          setState('error')
          setError('Microphone not accessible. Please check your device settings.')
          break
        case 'network':
          setState('error')
          setError('Network error during speech recognition. Please check your connection.')
          break
        default:
          setState('error')
          setError(`Speech recognition error: ${event.error}`)
      }

      setIsListening(false)
    }

    recognition.onend = () => {
      console.log('🎤 TOGGLE: Recognition ended - WHY? User did not stop it!')
      setIsListening(false)
      setState('idle')
      isStartingRef.current = false

      // Play stop listening sound
      if (enableAudioFeedback) {
        audioFeedback.playStopListeningSound()
      }
      
      // Clear timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    recognitionRef.current = recognition
    return recognition
  }, [SpeechRecognitionClass, continuous, interimResults, language, enableAudioFeedback, getErrorMessage])

  // Enhanced start listening with Safari-specific workarounds
  const startListening = useCallback(async () => {
    const startTime = performance.now()
    
    // Debounce rapid calls (especially on mobile)
    const timeSinceLastStart = startTime - lastStartTime.current
    if (timeSinceLastStart < debounceDelay) {
      console.log(`🎤 Debouncing: only ${timeSinceLastStart.toFixed(0)}ms since last start (min: ${debounceDelay}ms)`)
      return
    }
    lastStartTime.current = startTime
    
    console.log('🎤 startListening called', {
      isSupported,
      isListening,
      permissionGranted,
      continuous,
      language,
      isStarting: isStartingRef.current,
      isMobile: metrics.isMobile
    })
    
    if (!isSupported) {
      console.error('🎤 Browser does not support speech recognition')
      return
    }
    
    if (isListening || isStartingRef.current) {
      console.log('🎤 Already listening or starting, skipping')
      return
    }

    // Request permission if needed
    if (permissionGranted !== true) {
      console.log('🎤 Requesting permission first...')
      const granted = await requestPermission()
      if (!granted) {
        console.error('🎤 Permission not granted')
        return
      }
    }

    try {
      // Update metrics
      setMetrics(prev => ({ 
        ...prev, 
        startTime,
        resultCount: 0,
        firstResultTime: undefined,
        finalResultTime: undefined
      }))
      isStartingRef.current = true
      setError(null)
      setState('starting')
      
      // Create or get recognition instance
      const recognition = createRecognition()
      if (!recognition) {
        throw new Error('Failed to create speech recognition instance')
      }

      // Start recognition immediately for all browsers
      try {
        recognition.start()
        console.log('🎤 TOGGLE: Speech recognition start command sent')
      } catch (err) {
        console.error('🎤 Failed to start recognition:', err)
        isStartingRef.current = false
        setState('error')
        setError('Failed to start voice recognition. Please try again.')
      }
      
    } catch (err: any) {
      console.error('🎤 Failed to start recognition:', err)
      isStartingRef.current = false
      setState('error')
      setError('Failed to start voice recognition. Please try again.')
    }
  }, [isSupported, isListening, permissionGranted, requestPermission, createRecognition])

  // Stop listening
  const stopListening = useCallback(() => {
    console.log('🎤 TOGGLE: stopListening called by USER')
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }, [isListening])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
    console.log('🎤 Transcript reset')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop()
        recognitionRef.current = null
      }
    }
  }, [])

  // Push-to-Talk methods
  const startPushToTalk = useCallback(() => {
    console.log('🎤 Starting Push-to-Talk')
    startListening()
  }, [startListening])

  const stopPushToTalk = useCallback(() => {
    console.log('🎤 Stopping Push-to-Talk')
    stopListening()
  }, [stopListening])

  return {
    state,
    transcript: transcript.trim(),
    confidence,
    isSupported,
    isListening,
    error,
    permissionGranted,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission,
    startPushToTalk,
    stopPushToTalk,
    metrics
  }
}