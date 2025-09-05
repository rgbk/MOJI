// UI Copy Management System
// All user-facing text strings in one place for easy management

import { supabase } from './supabase'

export interface UICopySection {
  id: string
  name: string
  description: string
  values: Record<string, string>
}

interface UICopyRow {
  id: string
  key: string
  value: string
  category: string | null
  description: string | null
  updated_at: string | null
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
  private copyMap: Map<string, string> = new Map()
  private isLoaded = false
  private loadingPromise: Promise<void> | null = null

  constructor() {
    // Initialize with defaults synchronously
    this.setDefaultCopy()
    // Load from Supabase in background
    this.loadCopy()
  }

  private setDefaultCopy() {
    this.copy = defaultUICopy
    // Build map for fast lookups
    for (const section of defaultUICopy) {
      for (const [key, value] of Object.entries(section.values)) {
        this.copyMap.set(key, value)
      }
    }
  }

  private async loadCopy(): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    this.loadingPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('ui_copy')
          .select('*')
          .order('category', { ascending: true })
          .order('key', { ascending: true })

        if (error) {
          console.error('Failed to load UI copy from Supabase:', error)
          return
        }

        if (data && data.length > 0) {
          // Clear and rebuild map from Supabase data
          this.copyMap.clear()
          const sections: Map<string, UICopySection> = new Map()

          for (const row of data as UICopyRow[]) {
            // Store in map for fast lookups
            this.copyMap.set(row.key, row.value)

            // Build sections structure
            const category = row.category || 'default'
            if (!sections.has(category)) {
              sections.set(category, {
                id: category,
                name: this.formatCategoryName(category),
                description: row.description || '',
                values: {}
              })
            }
            const section = sections.get(category)!
            section.values[row.key] = row.value
          }

          this.copy = Array.from(sections.values())
          this.isLoaded = true
          console.log('UI copy loaded from Supabase:', this.copy.length, 'sections')
        }
      } catch (error) {
        console.error('Failed to load UI copy from Supabase:', error)
      }
    })()

    return this.loadingPromise
  }

  private formatCategoryName(category: string): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  private async saveCopy(updates: Record<string, string>): Promise<void> {
    try {
      // Update local copy immediately
      for (const [key, value] of Object.entries(updates)) {
        this.copyMap.set(key, value)
        // Update in sections
        for (const section of this.copy) {
          if (key in section.values) {
            section.values[key] = value
            break
          }
        }
      }

      // Save to Supabase
      const promises = Object.entries(updates).map(([key, value]) => 
        supabase
          .from('ui_copy')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('key', key)
      )

      await Promise.all(promises)
      console.log('UI copy saved to Supabase:', Object.keys(updates).length, 'keys updated')
    } catch (error) {
      console.error('Failed to save UI copy:', error)
      throw error
    }
  }

  getSections(): UICopySection[] {
    return this.copy
  }

  getSection(id: string): UICopySection | undefined {
    return this.copy.find(section => section.id === id)
  }

  getValue(key: string): string {
    // Fast lookup from map
    const value = this.copyMap.get(key)
    if (value) {
      return value
    }
    
    // Return a fallback if key not found
    console.warn(`UI copy key not found: ${key}`)
    return key // Return the key itself as fallback
  }

  // Ensure data is loaded before use
  async ensureLoaded(): Promise<void> {
    if (!this.isLoaded && this.loadingPromise) {
      await this.loadingPromise
    }
  }

  async updateValue(key: string, value: string) {
    const [sectionId] = key.split('.')
    const section = this.copy.find(s => s.id === sectionId)
    if (section) {
      section.values[key] = value
      await this.saveCopy({ [key]: value })
    }
  }

  async updateSection(sectionId: string, values: Record<string, string>) {
    const section = this.copy.find(s => s.id === sectionId)
    if (section) {
      section.values = { ...section.values, ...values }
      await this.saveCopy(values)
    }
  }

  async resetToDefaults() {
    this.setDefaultCopy()
    const updates: Record<string, string> = {}
    for (const section of defaultUICopy) {
      Object.assign(updates, section.values)
    }
    await this.saveCopy(updates)
  }

  exportCopy(): string {
    return JSON.stringify(this.copy, null, 2)
  }

  async importCopy(jsonString: string): Promise<boolean> {
    try {
      const imported = JSON.parse(jsonString)
      if (Array.isArray(imported)) {
        this.copy = imported
        const updates: Record<string, string> = {}
        for (const section of imported) {
          Object.assign(updates, section.values)
        }
        await this.saveCopy(updates)
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