import { useState, useEffect } from 'react';
import { settingsService, type Settings } from '../lib/settings';

export default function SettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    
    // Subscribe to settings changes
    const unsubscribe = settingsService.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  const loadSettings = () => {
    try {
      const currentSettings = settingsService.getSettings();
      setSettings(currentSettings);
      setSettingsError(null);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettingsError('Failed to load settings');
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSettingsError(null);
    
    try {
      await settingsService.saveSettings(newSettings);
      // Note: Page will reload to clear Vite cache
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSettingsError('Failed to save settings');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-6">⚙️ Game Settings</h2>
      
      {settingsError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-200">{settingsError}</p>
        </div>
      )}

      {settings ? (
        <div className="space-y-8">
          {/* Game Settings */}
          <div className="bg-white/5 rounded-lg p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">🎮 Game Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-white font-semibold mb-2">
                  Puzzles Per Game
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.game.puzzlesPerGame}
                  onChange={(e) => setSettings({
                    ...settings,
                    game: {
                      ...settings.game,
                      puzzlesPerGame: parseInt(e.target.value) || 10
                    }
                  })}
                  className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50 text-lg"
                />
                <p className="text-white/60 text-sm mt-1">Total number of puzzles in a game</p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Round Duration (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.game.roundTimer}
                  onChange={(e) => setSettings({
                    ...settings,
                    game: {
                      ...settings.game,
                      roundTimer: parseInt(e.target.value) || 60
                    }
                  })}
                  className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50 text-lg"
                />
                <p className="text-white/60 text-sm mt-1">Time per puzzle round</p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Win Condition (points)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={settings.game.winCondition}
                  onChange={(e) => setSettings({
                    ...settings,
                    game: {
                      ...settings.game,
                      winCondition: parseInt(e.target.value) || 6
                    }
                  })}
                  className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50 text-lg"
                />
                <p className="text-white/60 text-sm mt-1">First to reach this score wins</p>
              </div>

              <div>
                <label className="block text-white font-semibold mb-2">
                  Countdown Duration (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.game.countdownDuration}
                  onChange={(e) => setSettings({
                    ...settings,
                    game: {
                      ...settings.game,
                      countdownDuration: parseInt(e.target.value) || 3
                    }
                  })}
                  className="w-full p-3 rounded bg-white/20 text-white placeholder-white/50 text-lg"
                />
                <p className="text-white/60 text-sm mt-1">3-2-1 countdown before game starts</p>
              </div>
            </div>
          </div>

          {/* Current Values Preview */}
          <div className="bg-purple-500/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">📊 Current Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-300">{settings.game.puzzlesPerGame}</div>
                <div className="text-white/70 text-sm">Puzzles</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-300">{settings.game.roundTimer}s</div>
                <div className="text-white/70 text-sm">Per Round</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-300">{settings.game.winCondition}</div>
                <div className="text-white/70 text-sm">To Win</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-300">{settings.game.countdownDuration}s</div>
                <div className="text-white/70 text-sm">Countdown</div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={() => saveSettings(settings)}
              disabled={isSaving}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded-lg font-semibold transition-colors text-lg"
            >
              {isSaving ? '🔄 Saving & Reloading...' : '💾 Save Settings'}
            </button>
          </div>
          
          {isSaving && (
            <div className="text-center mt-4">
              <p className="text-white/70 text-sm">
                Clearing Vite cache and reloading to apply changes...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-white/70 py-8">
          <div className="text-4xl mb-4">⏳</div>
          <p>Loading settings...</p>
        </div>
      )}
    </div>
  );
}