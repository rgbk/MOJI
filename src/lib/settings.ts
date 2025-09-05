import { supabase } from './supabase';

interface GameSettings {
  roundTimer: number;
  puzzlesPerGame: number;
  winCondition: number;
  countdownDuration: number;
  puzzleOrder: string;
  sequentialIndex?: number;
}

interface Settings {
  game: GameSettings;
}

const DEFAULT_SETTINGS: Settings = {
  game: {
    roundTimer: 30,
    puzzlesPerGame: 10,
    winCondition: 6,
    countdownDuration: 3,
    puzzleOrder: 'sequential',
    sequentialIndex: 2
  }
};

export class SettingsService {
  private static instance: SettingsService;
  private settings: Settings;
  private listeners: Set<(settings: Settings) => void> = new Set();

  private constructor() {
    this.settings = DEFAULT_SETTINGS;
    this.loadSettings(); // Load async in background
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private async loadSettings(): Promise<Settings> {
    try {
      const { data, error } = await supabase
        .from('game_settings')
        .select('*')
        .single();
      
      if (error) {
        console.error('Failed to load settings from Supabase:', error);
        return DEFAULT_SETTINGS;
      }
      
      if (data) {
        this.settings = {
          game: {
            roundTimer: data.round_timer,
            puzzlesPerGame: data.puzzles_per_game,
            winCondition: data.win_condition,
            countdownDuration: data.countdown_duration,
            puzzleOrder: data.puzzle_order,
            sequentialIndex: data.sequential_index
          }
        };
        
        // Notify all listeners
        this.listeners.forEach(listener => listener(this.settings));
        
        return this.settings;
      }
    } catch (error) {
      console.error('Failed to load settings from Supabase:', error);
    }
    return DEFAULT_SETTINGS;
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  async saveSettings(newSettings: Settings): Promise<void> {
    try {
      const { error } = await supabase
        .from('game_settings')
        .update({
          round_timer: newSettings.game.roundTimer,
          puzzles_per_game: newSettings.game.puzzlesPerGame,
          win_condition: newSettings.game.winCondition,
          countdown_duration: newSettings.game.countdownDuration,
          puzzle_order: newSettings.game.puzzleOrder || 'sequential',
          sequential_index: newSettings.game.sequentialIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', '5c83e319-7dca-4c31-98f8-cd64ea28aa8a'); // Using the ID from your CSV
      
      if (error) {
        console.error('Failed to save settings to Supabase:', error);
        throw error;
      }
      
      this.settings = { ...newSettings };
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(this.settings));
      
      // Clear Vite cache to ensure settings take effect
      await this.clearViteCache();
      
      console.log('Settings saved successfully to Supabase:', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  private async clearViteCache(): Promise<void> {
    try {
      // Clear browser cache for the app
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Force reload to clear Vite's cache
      console.log('🔄 Clearing Vite cache and reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to clear Vite cache:', error);
    }
  }

  subscribe(listener: (settings: Settings) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Convenience getters for common settings
  getRoundTimer(): number {
    return this.settings.game.roundTimer;
  }

  getPuzzlesPerGame(): number {
    return this.settings.game.puzzlesPerGame;
  }

  getWinCondition(): number {
    return this.settings.game.winCondition;
  }

  getCountdownDuration(): number {
    return this.settings.game.countdownDuration;
  }
}

// Export singleton instance
export const settingsService = SettingsService.getInstance();
export type { Settings, GameSettings };