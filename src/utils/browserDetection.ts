/**
 * Browser detection utilities with a focus on Safari-specific capabilities
 * and limitations for voice recognition and audio features
 */

export interface BrowserInfo {
  isSafari: boolean
  isSafariMobile: boolean
  isSafariDesktop: boolean
  isWebKit: boolean
  isIOS: boolean
  safariVersion?: number
  supportsWebSpeech: boolean
  supportsWebAudio: boolean
  supportsMediaDevices: boolean
}

export interface SafariLimitations {
  requiresHTTPS: boolean
  requiresUserGesture: boolean
  hasWebSpeechQuirks: boolean
  hasAudioContextSuspension: boolean
  hasPermissionRestrictions: boolean
  hasEventHandlingDifferences: boolean
}

/**
 * Detect browser information with focus on Safari capabilities
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent
  const isWebKit = /webkit/i.test(userAgent)
  const isSafari = /safari/i.test(userAgent) && !/chrome|chromium|edg/i.test(userAgent)
  const isIOS = /iphone|ipad|ipod/i.test(userAgent)
  const isSafariMobile = isSafari && isIOS
  const isSafariDesktop = isSafari && !isIOS

  // Extract Safari version
  let safariVersion: number | undefined
  if (isSafari) {
    const match = userAgent.match(/version\/(\d+)/i)
    if (match) {
      safariVersion = parseInt(match[1], 10)
    }
  }

  // Check Web Speech API support
  const supportsWebSpeech = !!(
    window.SpeechRecognition || 
    (window as any).webkitSpeechRecognition
  )

  // Check Web Audio API support
  const supportsWebAudio = !!(
    window.AudioContext || 
    (window as any).webkitAudioContext
  )

  // Check MediaDevices API support
  const supportsMediaDevices = !!(
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia
  )

  return {
    isSafari,
    isSafariMobile,
    isSafariDesktop,
    isWebKit,
    isIOS,
    safariVersion,
    supportsWebSpeech,
    supportsWebAudio,
    supportsMediaDevices
  }
}

/**
 * Get Safari-specific limitations and requirements
 */
export function getSafariLimitations(browserInfo: BrowserInfo): SafariLimitations {
  const { isSafari, isSafariMobile, safariVersion } = browserInfo

  return {
    // Safari requires HTTPS for microphone access (more strictly than Chrome)
    requiresHTTPS: isSafari,
    
    // Safari requires user gesture for AudioContext and sometimes for getUserMedia
    requiresUserGesture: isSafari,
    
    // Safari has different Web Speech API behavior and event handling
    hasWebSpeechQuirks: isSafari,
    
    // Safari suspends AudioContext aggressively and requires user gesture to resume
    hasAudioContextSuspension: isSafari,
    
    // Safari has stricter permission handling for microphone access
    hasPermissionRestrictions: isSafari,
    
    // Safari handles speech recognition events differently (timing, error codes)
    hasEventHandlingDifferences: isSafari
  }
}

/**
 * Check if current context meets Safari requirements
 */
export function checkSafariRequirements(browserInfo: BrowserInfo): {
  isSecureContext: boolean
  hasUserGesture: boolean
  canUseWebSpeech: boolean
  canUseWebAudio: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check secure context (HTTPS requirement)
  const isSecureContext = window.isSecureContext || 
    window.location.protocol === 'https:' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1'

  if (browserInfo.isSafari && !isSecureContext) {
    issues.push('Safari requires HTTPS for microphone access')
  }

  // User gesture detection is complex - we'll assume false initially
  const hasUserGesture = false

  // Web Speech availability
  const canUseWebSpeech = browserInfo.supportsWebSpeech && isSecureContext
  if (browserInfo.isSafari && !canUseWebSpeech) {
    if (!browserInfo.supportsWebSpeech) {
      issues.push('Web Speech API not available in this Safari version')
    }
    if (!isSecureContext) {
      issues.push('Web Speech API requires HTTPS in Safari')
    }
  }

  // Web Audio availability
  const canUseWebAudio = browserInfo.supportsWebAudio
  if (browserInfo.isSafari && !canUseWebAudio) {
    issues.push('Web Audio API not available in this Safari version')
  }

  return {
    isSecureContext,
    hasUserGesture,
    canUseWebSpeech,
    canUseWebAudio,
    issues
  }
}

/**
 * Get Safari-specific error message for common issues
 */
export function getSafariErrorMessage(error: string, browserInfo: BrowserInfo): string {
  if (!browserInfo.isSafari) {
    return error // Return original error for non-Safari browsers
  }

  // Safari-specific error message mapping
  switch (error) {
    case 'not-allowed':
      if (browserInfo.isSafariMobile) {
        return 'Microphone access denied. In Safari mobile, tap the AA icon in the address bar, then tap "Website Settings" and allow microphone access.'
      }
      return 'Microphone access denied. In Safari, click the microphone icon in the address bar and select "Allow" to enable voice input.'

    case 'no-speech':
      return 'No speech detected. Safari requires clear speech - try speaking closer to your microphone and ensure you\'re in a quiet environment.'

    case 'audio-capture':
      return 'Cannot access microphone. In Safari, check that no other tabs or apps are using the microphone, and ensure your microphone is connected.'

    case 'network':
      return 'Network error in Safari. Voice recognition requires a stable internet connection. Check your connection and try again.'

    case 'service-not-allowed':
      return 'Speech recognition blocked by Safari. Ensure you\'re using HTTPS and have allowed microphone access in Safari\'s privacy settings.'

    case 'aborted':
      return 'Voice recognition stopped by Safari - this is normal when releasing the push-to-talk button.'

    default:
      return `Safari voice recognition error: ${error}. Try refreshing the page and ensuring microphone permissions are granted.`
  }
}

/**
 * Log Safari-specific debugging information
 */
export function logSafariDebugInfo(): void {
  const browserInfo = detectBrowser()
  const limitations = getSafariLimitations(browserInfo)
  const requirements = checkSafariRequirements(browserInfo)

  if (browserInfo.isSafari) {
    console.group('🧭 Safari Voice Recognition Debug Info')
    console.log('Browser Info:', browserInfo)
    console.log('Safari Limitations:', limitations)
    console.log('Requirements Check:', requirements)
    console.log('User Agent:', navigator.userAgent)
    console.log('Location:', {
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      isSecureContext: window.isSecureContext
    })
    
    if (requirements.issues.length > 0) {
      console.warn('Issues detected:', requirements.issues)
    }
    
    console.groupEnd()
  }
}

// Singleton browser info - computed once on module load
export const BROWSER_INFO = detectBrowser()
export const SAFARI_LIMITATIONS = getSafariLimitations(BROWSER_INFO)