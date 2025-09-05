/**
 * Audio utility functions for voice recognition feedback
 * Provides subtle audio cues to enhance the voice input experience
 * Includes Safari-specific handling for AudioContext restrictions
 */

import { BROWSER_INFO, SAFARI_LIMITATIONS } from '../utils/browserDetection'

export class AudioFeedback {
  private audioContext: AudioContext | null = null
  private isInitialized = false
  private userGestureReceived = false
  private initializationAttempts = 0
  private readonly maxInitAttempts = 3

  constructor() {
    // Don't initialize AudioContext immediately - wait for user interaction
    // This prevents issues with browser autoplay policies, especially in Safari
    
    if (BROWSER_INFO.isSafari) {
      console.log('🦁 Safari detected - AudioContext will require user gesture')
    }
  }
  
  private initializeAudioContext(): boolean {
    if (this.isInitialized && this.audioContext) {
      return this.audioContext.state !== 'closed'
    }
    
    if (this.initializationAttempts >= this.maxInitAttempts) {
      console.warn('🎵 Max AudioContext initialization attempts reached')
      this.isInitialized = true
      return false
    }
    
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        this.initializationAttempts++
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Safari-specific handling
        if (BROWSER_INFO.isSafari) {
          console.log('🦁 Safari AudioContext created, state:', this.audioContext.state)
          
          // Set up state change listener for debugging
          this.audioContext.addEventListener('statechange', () => {
            console.log('🦁 Safari AudioContext state changed to:', this.audioContext?.state)
          })
        }
        
        this.isInitialized = true
        console.log('🎵 AudioContext initialized successfully, state:', this.audioContext.state)
        return true
      } catch (error) {
        console.warn('🎵 AudioContext not available (attempt', this.initializationAttempts + '):', error)
        
        if (BROWSER_INFO.isSafari && this.initializationAttempts < this.maxInitAttempts) {
          // For Safari, try again after a short delay
          setTimeout(() => {
            console.log('🦁 Retrying Safari AudioContext initialization...')
            this.isInitialized = false
          }, 100)
          return false
        }
        
        this.isInitialized = true
        return false
      }
    }
    
    this.isInitialized = true
    return false
  }

  /**
   * Mark that user gesture was received (important for Safari)
   */
  markUserGesture(): void {
    if (!this.userGestureReceived) {
      this.userGestureReceived = true
      console.log('🎵 User gesture received - AudioContext can now be initialized')
    }
  }

  /**
   * Play a short beep sound to indicate voice recording start
   */
  playStartListeningSound(): void {
    this.markUserGesture() // Mark user gesture on first interaction
    this.playTone(800, 0.1, 0.05) // Higher pitch, short duration
  }

  /**
   * Play a different beep to indicate voice recording stop
   */
  playStopListeningSound(): void {
    this.playTone(400, 0.1, 0.05) // Lower pitch, short duration
  }

  /**
   * Play a success sound when speech is recognized
   */
  playSuccessSound(): void {
    this.playTone(600, 0.05, 0.03)
    setTimeout(() => this.playTone(800, 0.05, 0.03), 50)
  }

  /**
   * Play an error sound when speech recognition fails
   */
  playErrorSound(): void {
    this.playTone(200, 0.15, 0.08) // Low pitch, longer duration
  }

  /**
   * Generate and play a tone using Web Audio API
   */
  private playTone(frequency: number, duration: number, volume: number = 0.1): void {
    // For Safari, ensure we have a user gesture before attempting audio
    if (BROWSER_INFO.isSafari && !this.userGestureReceived) {
      console.log('🦁 Safari: Skipping audio feedback - no user gesture yet')
      return
    }

    // Initialize audio context on first use
    if (!this.initializeAudioContext() || !this.audioContext) {
      if (BROWSER_INFO.isSafari) {
        console.log('🦁 Safari: AudioContext initialization failed')
      }
      return // Audio not available, fail silently
    }

    try {
      // Handle Safari AudioContext suspension more aggressively
      if (this.audioContext.state === 'suspended') {
        if (BROWSER_INFO.isSafari) {
          console.log('🦁 Safari: AudioContext suspended, attempting to resume...')
        }
        
        const resumePromise = this.audioContext.resume()
        
        if (SAFARI_LIMITATIONS.requiresUserGesture && !this.userGestureReceived) {
          console.log('🦁 Safari: Cannot resume AudioContext without user gesture')
          return
        }
        
        resumePromise.then(() => {
          if (BROWSER_INFO.isSafari) {
            console.log('🦁 Safari: AudioContext resumed successfully')
          }
          this.playToneImmediate(frequency, duration, volume)
        }).catch((error) => {
          if (BROWSER_INFO.isSafari) {
            console.warn('🦁 Safari: Failed to resume AudioContext:', error)
          } else {
            console.warn('🎵 Failed to resume AudioContext:', error)
          }
        })
        return
      }
      
      this.playToneImmediate(frequency, duration, volume)
    } catch (error) {
      if (BROWSER_INFO.isSafari) {
        console.warn('🦁 Safari: Failed to play audio feedback:', error)
      } else {
        console.warn('🎵 Failed to play audio feedback:', error)
      }
    }
  }

  /**
   * Play tone immediately (assumes AudioContext is ready)
   */
  private playToneImmediate(frequency: number, duration: number, volume: number): void {
    if (!this.audioContext || this.audioContext.state !== 'running') {
      return
    }

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      // Envelope to prevent clicking sounds
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
      
      if (BROWSER_INFO.isSafari) {
        console.log('🦁 Safari: Audio tone played successfully')
      }
    } catch (error) {
      console.warn('🎵 Failed to create audio tone:', error)
    }
  }

  /**
   * Check if audio feedback is available
   */
  isAvailable(): boolean {
    if (BROWSER_INFO.isSafari && !this.userGestureReceived) {
      return false // Safari requires user gesture
    }
    return this.initializeAudioContext() && this.audioContext !== null
  }

  /**
   * Get Safari-specific audio status information
   */
  getSafariStatus(): {
    isSupported: boolean
    hasUserGesture: boolean
    contextState: string | null
    canPlay: boolean
  } {
    return {
      isSupported: BROWSER_INFO.supportsWebAudio,
      hasUserGesture: this.userGestureReceived,
      contextState: this.audioContext?.state || null,
      canPlay: this.isAvailable()
    }
  }
}

// Singleton instance
export const audioFeedback = new AudioFeedback()