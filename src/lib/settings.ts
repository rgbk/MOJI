interface GameSettings {
  roundTimer: number;
  puzzlesPerGame: number;
  winCondition: number;
  countdownDuration: number;
}

interface Settings {
  game: GameSettings;
}

const DEFAULT_SETTINGS: Settings = {
  game: {
    roundTimer: 60,
    puzzlesPerGame: 10,
    winCondition: 6,
    countdownDuration: 3
  }
};

const SETTINGS_KEY = 'moji_game_settings';

export class SettingsService {
  private static instance: SettingsService;
  private settings: Settings;
  private listeners: Set<(settings: Settings) => void> = new Set();

  private constructor() {
    this.settings = this.loadSettings();
  }

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private loadSettings(): Settings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  async saveSettings(newSettings: Settings): Promise<void> {
    try {
      this.settings = { ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(this.settings));
      
      // Clear Vite cache to ensure settings take effect
      await this.clearViteCache();
      
      console.log('Settings saved successfully:', this.settings);
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