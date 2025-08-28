/**
 * Audio utility functions for voice recognition feedback
 * Provides subtle audio cues to enhance the voice input experience
 */

export class AudioFeedback {
  private audioContext: AudioContext | null = null

  constructor() {
    // Initialize Web Audio Context if available
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('AudioContext not available:', error)
      }
    }
  }

  /**
   * Play a short beep sound to indicate voice recording start
   */
  playStartListeningSound(): void {
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
    if (!this.audioContext) return

    try {
      // Resume audio context if it's suspended (required by browser policies)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }

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
    } catch (error) {
      console.warn('Failed to play audio feedback:', error)
    }
  }

  /**
   * Check if audio feedback is available
   */
  isAvailable(): boolean {
    return this.audioContext !== null
  }
}

// Singleton instance
export const audioFeedback = new AudioFeedback()