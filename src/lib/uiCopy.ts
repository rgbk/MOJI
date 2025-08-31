// UI Copy Management System
// All user-facing text strings in one place for easy management

export interface UICopySection {
  id: string
  name: string
  description: string
  values: Record<string, string>
}

const defaultUICopy: UICopySection[] = [
  {
    id: 'game',
    name: 'Game Screen',
    description: 'Text shown during gameplay',
    values: {
      'game.waiting': 'Loading puzzles...',
      'game.error.title': 'Failed to Load Puzzles',
      'game.error.reload': 'Reload Game',
      'game.input.placeholder': 'Type your guess...',
      'game.room.label': 'Game:',
      'game.player.you': 'YOU',
      'game.player.opponent': 'OPP'
    }
  },
  {
    id: 'answer',
    name: 'Answer Reveal',
    description: 'Text shown when revealing answers',
    values: {
      'answer.correct.you': 'YOU WON!',
      'answer.correct.opponent': 'OPPONENT WON!',
      'answer.label': 'The answer was:',
      'answer.waiting': 'Waiting for other player...',
      'answer.next.single': 'READY FOR NEXT ROUND',
      'answer.next.multi': 'READY FOR NEXT PUZZLE'
    }
  },
  {
    id: 'lobby',
    name: 'Lobby Screen',
    description: 'Text shown in the game lobby',
    values: {
      'lobby.title': 'MOJI!',
      'lobby.share': 'Share this game with a friend',
      'lobby.copy': 'COPY GAME LINK',
      'lobby.copied': 'COPIED!',
      'lobby.copied.help': 'Send this URL to a friend to play together',
      'lobby.join.alert': 'wants to join!',
      'lobby.join.help': 'Let them in to start the game',
      'lobby.join.button': 'ADMIT',
      'lobby.ready': 'Players ready!',
      'lobby.start': 'START GAME',
      'lobby.waiting.host': 'Waiting for Player 1 to let you in...',
      'lobby.starting': 'Starting game...'
    }
  },
  {
    id: 'home',
    name: 'Home Screen',
    description: 'Text shown on the home page',
    values: {
      'home.title': 'MOJI!',
      'home.subtitle': 'Guess the music from emojis',
      'home.button.start': 'START NEW GAME',
      'home.button.join': 'JOIN GAME',
      'home.button.admin': 'ADMIN'
    }
  },
  {
    id: 'timer',
    name: 'Timer Messages',
    description: 'Text related to game timing',
    values: {
      'timer.warning': '10 seconds left!',
      'timer.expired': 'Time\'s up!'
    }
  },
  {
    id: 'clues',
    name: 'Clue System',
    description: 'Text for the clue/hint system',
    values: {
      'clues.button': 'GET CLUE',
      'clues.remaining': 'clues left',
      'clues.none': 'No clues remaining'
    }
  },
  {
    id: 'errors',
    name: 'Error Messages',
    description: 'Error messages shown to users',
    values: {
      'error.room.notfound': 'Room not found',
      'error.room.full': 'Room is full',
      'error.connection': 'Connection lost',
      'error.generic': 'Something went wrong. Please try again.'
    }
  },
  {
    id: 'voice',
    name: 'Voice Input',
    description: 'Text for voice input features',
    values: {
      'voice.permission': 'Allow microphone access to use voice',
      'voice.listening': 'Listening...',
      'voice.error': 'Voice recognition failed',
      'voice.unsupported': 'Voice input not supported in your browser'
    }
  }
]

class UICopyService {
  private copy: UICopySection[] = []
  private readonly STORAGE_KEY = 'moji-ui-copy'

  constructor() {
    this.loadCopy()
  }

  private loadCopy() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        this.copy = JSON.parse(stored)
      } else {
        this.copy = defaultUICopy
        this.saveCopy()
      }
    } catch (error) {
      console.error('Failed to load UI copy:', error)
      this.copy = defaultUICopy
    }
  }

  private saveCopy() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.copy))
    } catch (error) {
      console.error('Failed to save UI copy:', error)
    }
  }

  getSections(): UICopySection[] {
    return this.copy
  }

  getSection(id: string): UICopySection | undefined {
    return this.copy.find(section => section.id === id)
  }

  getValue(key: string): string {
    const [sectionId] = key.split('.')
    const section = this.getSection(sectionId)
    if (!section) return key // Return key if not found
    return section.values[key] || key
  }

  updateValue(key: string, value: string) {
    const [sectionId] = key.split('.')
    const section = this.copy.find(s => s.id === sectionId)
    if (section) {
      section.values[key] = value
      this.saveCopy()
    }
  }

  updateSection(sectionId: string, values: Record<string, string>) {
    const section = this.copy.find(s => s.id === sectionId)
    if (section) {
      section.values = { ...section.values, ...values }
      this.saveCopy()
    }
  }

  resetToDefaults() {
    this.copy = JSON.parse(JSON.stringify(defaultUICopy))
    this.saveCopy()
  }

  exportCopy(): string {
    return JSON.stringify(this.copy, null, 2)
  }

  importCopy(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString)
      if (Array.isArray(imported)) {
        this.copy = imported
        this.saveCopy()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import UI copy:', error)
      return false
    }
  }
}

export const uiCopyService = new UICopyService()