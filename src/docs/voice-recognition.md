# Voice Recognition Implementation

## Overview

The MOJI game now includes comprehensive voice recognition functionality that allows users to answer music puzzles by speaking instead of typing. This implementation uses the Web Speech API and provides a seamless, accessible alternative input method.

## Features

### Core Functionality
- **Web Speech API Integration**: Uses the browser's native speech recognition capabilities
- **Real-time Transcription**: Shows what the system is hearing as the user speaks
- **Confidence Scoring**: Displays recognition confidence levels
- **Auto-submission**: Automatically submits answers with high confidence scores
- **Dual Input Mode**: Users can seamlessly switch between typing and voice input

### User Experience
- **Visual Feedback**: Clear indicators for listening states and recognition results
- **Audio Feedback**: Subtle sound cues for start/stop/success/error events
- **Error Handling**: Comprehensive error messages for various failure scenarios
- **Browser Compatibility**: Automatic detection and graceful fallback for unsupported browsers
- **Accessibility**: Voice input complements rather than replaces text input

## Technical Implementation

### Components

#### `useVoiceRecognition` Hook
Location: `/src/hooks/useVoiceRecognition.ts`

A custom React hook that encapsulates all voice recognition logic:

```typescript
const {
  state,              // Current recognition state
  transcript,         // Recognized text
  confidence,         // Recognition confidence (0-1)
  isSupported,        // Browser support detection
  isListening,        // Currently listening flag
  error,              // Error messages
  startListening,     // Start recognition
  stopListening,      // Stop recognition
  resetTranscript     // Clear results
} = useVoiceRecognition(options)
```

**Configuration Options:**
- `language`: Speech recognition language (default: 'en-US')
- `continuous`: Continue listening after recognition (default: false)
- `interimResults`: Show partial results while speaking (default: true)
- `maxAlternatives`: Number of recognition alternatives (default: 1)
- `confidenceThreshold`: Minimum confidence for auto-submission (default: 0.5)
- `enableAudioFeedback`: Enable sound cues (default: true)

#### `AnswerInput` Component
Location: `/src/components/AnswerInput.tsx`

Enhanced with voice recognition integration:
- Toggle between text and voice input modes
- Visual feedback for listening states
- Real-time transcript display
- Confidence level indicators
- Error message display

#### `AudioFeedback` Utility
Location: `/src/lib/audio.ts`

Provides subtle audio cues using Web Audio API:
- Start listening sound (high pitch beep)
- Stop listening sound (lower pitch beep)  
- Success sound (ascending tones)
- Error sound (low frequency tone)

### Browser Support

**Fully Supported:**
- Chrome (Desktop & Mobile)
- Edge (Desktop & Mobile)
- Safari (Desktop & Mobile)
- Opera (Desktop)

**Not Supported:**
- Firefox (Web Speech API not implemented)
- Internet Explorer
- Older browser versions

The implementation automatically detects support and shows appropriate UI feedback.

## User Interface

### Voice Input Mode
When voice input is active:
1. **Feedback Panel**: Shows listening status, recognized text, and confidence
2. **Voice Button**: Changes color and icon to indicate listening state
3. **Text Input**: Disabled during active listening, enabled for manual editing
4. **Mode Toggle**: Easy switch back to text input

### Visual States
- **Idle**: Gray microphone icon, ready to start
- **Listening**: Red pulsing button with stop icon
- **Processing**: Yellow status indicator
- **Error**: Red error messages and audio feedback
- **Success**: Auto-submission with confidence display

## Error Handling

The system handles various error scenarios:

- **Permission Denied**: Clear message requesting microphone access
- **No Speech Detected**: Guidance to speak more clearly
- **Audio Capture Issues**: Microphone connection problems
- **Network Errors**: Internet connectivity issues
- **Browser Limitations**: Unsupported browser notifications

## Integration with Game Logic

Voice recognition integrates seamlessly with existing game functionality:

1. **Answer Validation**: Voice transcripts are processed through the same validation logic as typed answers
2. **Score Tracking**: Correct voice answers contribute to game score normally
3. **Timer Integration**: Voice input works within the existing round timer system
4. **Clue System**: Users can still request clues while in voice mode

## Performance Considerations

- **Memory Management**: Proper cleanup of speech recognition instances
- **Audio Context**: Efficient Web Audio API usage with suspend/resume
- **Event Listeners**: Automatic cleanup on component unmount
- **Timeout Handling**: 10-second auto-stop to prevent indefinite listening

## Testing

### Manual Testing Checklist
- [ ] Voice button toggles between modes
- [ ] Microphone permission request works
- [ ] Real-time transcript display functions
- [ ] Confidence scoring appears
- [ ] Auto-submission triggers at high confidence
- [ ] Error messages display appropriately
- [ ] Audio feedback plays at correct times
- [ ] Cleanup occurs on component unmount
- [ ] Browser compatibility detection works
- [ ] Graceful fallback for unsupported browsers

### Test Component
A `VoiceTestPanel` component is available for development testing:
```typescript
import VoiceTestPanel from './components/VoiceTestPanel'
```

## Security & Privacy

- **Microphone Permissions**: Requires explicit user consent
- **Local Processing**: Speech recognition happens in the browser (no data sent to external servers)
- **Temporary Data**: Transcripts are cleared when switching modes or resetting
- **No Recording**: Audio is processed in real-time, not stored

## Future Enhancements

Potential improvements for future iterations:
- **Custom Vocabulary**: Add music-specific terms for better recognition
- **Multi-language Support**: Support for different game languages
- **Voice Commands**: Navigate game features with voice
- **Noise Cancellation**: Improved accuracy in noisy environments
- **Offline Capability**: Explore offline speech recognition options

## Usage Example

```typescript
import { AnswerInput } from './components/AnswerInput'

function GameScreen() {
  const [answer, setAnswer] = useState('')

  const handleAnswerSubmit = (inputAnswer: string) => {
    // Process answer from either text or voice input
    const isCorrect = validateAnswer(inputAnswer)
    // ... rest of game logic
  }

  return (
    <AnswerInput
      value={answer}
      onChange={setAnswer}
      onSubmit={handleAnswerSubmit}
      placeholder="Type your answer or use voice input..."
    />
  )
}
```

The voice recognition system is now fully integrated and ready for use in the MOJI music puzzle game!