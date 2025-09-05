import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { claudeService } from '../lib/claude';
import { testClaudeAPI } from '../lib/testClaude';
import SettingsTab from '../components/SettingsTab';
import UICopyTab from '../components/UICopyTab';
import { puzzleService, type Puzzle } from '../lib/puzzles';

// Emoji categories for the picker
const EMOJI_CATEGORIES = {
  'Music & Audio': [
    '🎵', '🎶', '🎤', '🎧', '🎸', '🥁', '🎹', '🎺', '🎻', '🪕', '🎼', '🎙️', '🔊', '🔉', '🔈', '📻', '🎛️', '🎚️'
  ],
  'Objects': [
    '📱', '💎', '⭐', '🔥', '💡', '🌟', '⚡', '💫', '✨', '🌠', '🔮', '💍', '👑', '🏆', '🥇', '🎯', '🎨', '🖼️'
  ],
  'Nature': [
    '🌊', '🌙', '☀️', '🌈', '🌸', '🍃', '🌺', '🌻', '🌹', '🌷', '🌲', '🌳', '🌴', '🌵', '🌿', '☘️', '🍀', '🌾'
  ],
  'Symbols': [
    '❤️', '💜', '🖤', '🔴', '🟣', '⚫', '🔶', '🔷', '🔸', '🔹', '💠', '🔺', '🔻', '⬆️', '⬇️', '➡️', '⬅️', '↗️'
  ],
  'Faces & People': [
    '😀', '😎', '🤖', '👑', '🎭', '😍', '🤩', '😊', '😂', '🥰', '😌', '🤔', '😏', '🙃', '😜', '🤗', '😇', '🥳'
  ],
  'Food & Drink': [
    '🍎', '🍕', '🍫', '🥤', '☕', '🍰', '🧁', '🍭', '🍯', '🥂', '🍾', '🍷', '🍸', '🍹', '🍺', '🥃', '🧃', '🥛'
  ]
};


export default function Admin() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Puzzle>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isGeneratingEmoji, setIsGeneratingEmoji] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState<string>('Music & Audio');
  const [activeTab, setActiveTab] = useState<'puzzles' | 'settings' | 'copy'>('puzzles');

  useEffect(() => {
    loadPuzzles();
    
    // Subscribe to puzzle changes
    const unsubscribe = puzzleService.subscribe((updatedPuzzles) => {
      setPuzzles(updatedPuzzles);
    });

    return unsubscribe;
  }, []);

  const loadPuzzles = async () => {
    try {
      const puzzleData = await puzzleService.getPuzzles();
      setPuzzles(puzzleData);
    } catch (error) {
      console.error('Failed to load puzzles:', error);
    }
  };

  const savePuzzles = async (updatedPuzzles: Puzzle[]) => {
    try {
      await puzzleService.savePuzzles(updatedPuzzles);
    } catch (error) {
      console.error('Failed to save puzzles:', error);
      alert('Failed to save puzzles. Please try again.');
    }
  };

  const handleEdit = (puzzle: Puzzle) => {
    setSelectedPuzzle(puzzle);
    setFormData(puzzle);
    setIsEditing(true);
    setGenerationError(null);
  };

  const handleSave = () => {
    if (!formData.id) return;
    
    const updatedPuzzles = puzzles.map(p => 
      p.id === formData.id ? { ...formData } as Puzzle : p
    );
    setPuzzles(updatedPuzzles);
    savePuzzles(updatedPuzzles);
    setIsEditing(false);
    setSelectedPuzzle(null);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Delete this puzzle?')) return;
    const updatedPuzzles = puzzles.filter(p => p.id !== id);
    setPuzzles(updatedPuzzles);
    savePuzzles(updatedPuzzles);
  };

  const handleAddNew = () => {
    const newId = puzzleService.getNextId();
    const newPuzzle: Puzzle = {
      id: newId,
      type: 'song',
      emoji: '',
      clues: ['', '', ''],
      answers: [''],
      displayAnswer: '',
      links: []
    };
    setSelectedPuzzle(newPuzzle);
    setFormData(newPuzzle);
    setIsEditing(true);
    setGenerationError(null);
  };

  const handleExportPuzzles = () => {
    try {
      const jsonData = puzzleService.exportPuzzles();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `moji-puzzles-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Puzzles exported successfully');
    } catch (error) {
      console.error('Failed to export puzzles:', error);
      alert('Failed to export puzzles. Please try again.');
    }
  };

  const handleAutoFill = async () => {
    if (!formData.type || !formData.displayAnswer?.trim()) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const aiData = await claudeService.generatePuzzleData(
        formData.type as any,
        formData.displayAnswer.trim()
      );

      // Merge AI data with existing form data
      setFormData(prev => ({
        ...prev,
        emoji: aiData.emoji,
        clues: aiData.clues,
        displayAnswer: aiData.displayAnswer,
        genre: aiData.genre,
        subGenre: aiData.subGenre,
        decade: aiData.decade,
        year: aiData.year,
        artistType: aiData.artistType,
        country: aiData.country,
        region: aiData.region,
        album: aiData.album,
        // Generate basic answers array from the display answer
        answers: [aiData.answer, aiData.displayAnswer.toLowerCase()],
        // Generate links if provided
        links: [
          ...(aiData.spotifyUrl ? [{ name: 'Spotify', url: aiData.spotifyUrl }] : []),
          ...(aiData.appleMusicUrl ? [{ name: 'Apple Music', url: aiData.appleMusicUrl }] : [])
        ]
      }));
    } catch (error) {
      console.error('Auto-fill error:', error);
      setGenerationError(
        error instanceof Error ? error.message : 'Failed to generate puzzle data'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateEmoji = async () => {
    if (!formData.displayAnswer?.trim()) return;

    setIsGeneratingEmoji(true);
    setGenerationError(null);

    try {
      const cleanEmojis = await claudeService.generateEmoji(formData.type || 'song', formData.displayAnswer.trim());
      
      if (cleanEmojis) {
        setFormData(prev => ({ ...prev, emoji: cleanEmojis }));
      }
    } catch (error) {
      console.error('Emoji generation error:', error);
      setGenerationError('Failed to generate new emoji interpretation');
    } finally {
      setIsGeneratingEmoji(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setFormData(prev => ({ 
      ...prev, 
      emoji: (prev.emoji || '') + emoji 
    }));
    setIsEmojiPickerOpen(false);
  };

  // Close emoji picker on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEmojiPickerOpen) {
        setIsEmojiPickerOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isEmojiPickerOpen]);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8 overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">MOJI Admin</h1>
          <div className="flex gap-4">
            <button
              onClick={() => testClaudeAPI()}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
            >
              🔍 Test Models
            </button>
            <button
              onClick={handleExportPuzzles}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              💾 Export
            </button>
            <button
              onClick={handleAddNew}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
            >
              Add New Puzzle
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('puzzles')}
            className={cn(
              "px-6 py-3 rounded-lg font-semibold transition-colors",
              activeTab === 'puzzles'
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
            )}
          >
            🧩 Puzzles
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "px-6 py-3 rounded-lg font-semibold transition-colors",
              activeTab === 'settings'
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
            )}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab('copy')}
            className={cn(
              "px-6 py-3 rounded-lg font-semibold transition-colors",
              activeTab === 'copy'
                ? "bg-white/20 text-white"
                : "bg-white/10 text-white/70 hover:text-white hover:bg-white/15"
            )}
          >
            📝 UI Copy
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          {activeTab === 'puzzles' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Puzzles List */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col min-h-0">
            <h2 className="text-2xl font-bold text-white mb-4">Puzzles ({puzzles.length})</h2>
            <div className="space-y-3 overflow-y-auto rounded-lg flex-1 min-h-0">
              {puzzles.map((puzzle) => (
                <div key={puzzle.id} className="bg-white/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-2xl mb-2">{puzzle.emoji}</div>
                      <div className="text-white font-semibold">{puzzle.displayAnswer}</div>
                      <div className="text-white/70 text-sm">{puzzle.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(puzzle)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(puzzle.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col min-h-0">
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedPuzzle?.id ? 'Edit Puzzle' : 'Add New Puzzle'}
              </h2>
              
              <div className="space-y-4 overflow-y-auto flex-1 min-h-0 pr-2">
                <div>
                  <label className="block text-white font-semibold mb-2">Type</label>
                  <select
                    value={formData.type || ''}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full p-2 rounded bg-white/20 text-white"
                  >
                    <option value="song">Song</option>
                    <option value="artist">Artist</option>
                    <option value="song-artist">Song + Artist</option>
                    <option value="album">Album</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Answer</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.displayAnswer || ''}
                      onChange={(e) => setFormData({...formData, displayAnswer: e.target.value})}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && formData.type && formData.displayAnswer?.trim() && !isGenerating && claudeService.isConfigured()) {
                          e.preventDefault();
                          handleAutoFill();
                        }
                      }}
                      className="flex-1 p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="Enter song, artist, or album name (Press Enter for Auto-Fill)"
                    />
                    <button
                      type="button"
                      onClick={handleAutoFill}
                      disabled={!formData.type || !formData.displayAnswer?.trim() || isGenerating || !claudeService.isConfigured()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded font-semibold transition-colors min-w-[100px]"
                    >
                      {isGenerating ? '🤖...' : '🪄 Auto-Fill'}
                    </button>
                  </div>
                  {generationError && (
                    <p className="text-red-400 text-sm mt-1">{generationError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Emoji</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.emoji || ''}
                      onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                      className="flex-1 p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="🎵🎶🎤"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(true)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
                      title="Open emoji picker"
                    >
                      🔍
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateEmoji}
                      disabled={!formData.displayAnswer?.trim() || isGeneratingEmoji || !claudeService.isConfigured()}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 text-white rounded font-semibold transition-colors"
                      title="Generate new emoji interpretation"
                    >
                      {isGeneratingEmoji ? '🔄' : '🎭'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Clues (3)</label>
                  {(formData.clues || ['', '', '']).map((clue, index) => (
                    <input
                      key={index}
                      type="text"
                      value={clue}
                      onChange={(e) => {
                        const newClues = [...(formData.clues || ['', '', ''])];
                        newClues[index] = e.target.value;
                        setFormData({...formData, clues: newClues});
                      }}
                      className="w-full p-2 mb-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder={`Clue ${index + 1}`}
                    />
                  ))}
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Answers (comma-separated)</label>
                  <input
                    type="text"
                    value={(formData.answers || []).join(', ')}
                    onChange={(e) => setFormData({...formData, answers: e.target.value.split(', ').filter(Boolean)})}
                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                    placeholder="answer1, answer2, answer3"
                  />
                </div>

                {/* Video Section */}
                <div className="bg-white/10 p-4 rounded-lg border border-white/20">
                  <h3 className="text-white font-bold mb-3">📹 Video Settings</h3>
                  
                  <div className="mb-3">
                    <label className="block text-white font-semibold mb-2">Mux Playback ID (recommended)</label>
                    <input
                      type="text"
                      value={formData.muxPlaybackId || ''}
                      onChange={(e) => setFormData({...formData, muxPlaybackId: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="kXo6ovbBXtuepLEVjk8OOA4IUqorEhutWd02LVermS7c"
                    />
                    <p className="text-white/60 text-sm mt-1">Professional streaming with auto-transcoding and global CDN</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white font-semibold mb-2">Video File (fallback)</label>
                      <input
                        type="text"
                        value={formData.videoFile || ''}
                        onChange={(e) => setFormData({...formData, videoFile: e.target.value})}
                        className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                        placeholder="video-name.mp4"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-semibold mb-2">Video URL (fallback)</label>
                      <input
                        type="url"
                        value={formData.videoUrl || ''}
                        onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                        className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                        placeholder="https://youtube.com/embed/..."
                      />
                    </div>
                  </div>
                  
                  <p className="text-white/60 text-sm mt-2">💡 Priority: Mux → Video File → Video URL</p>
                </div>

                {/* New AI-generated fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Genre</label>
                    <input
                      type="text"
                      value={formData.genre || ''}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="Rock, Pop, Hip-Hop..."
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Sub-Genre</label>
                    <input
                      type="text"
                      value={formData.subGenre || ''}
                      onChange={(e) => setFormData({...formData, subGenre: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="Alternative Rock, Indie Pop..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Decade</label>
                    <input
                      type="text"
                      value={formData.decade || ''}
                      onChange={(e) => setFormData({...formData, decade: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="1980s, 1990s..."
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Year</label>
                    <input
                      type="number"
                      value={formData.year || ''}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value) || undefined})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="1985"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Artist Type</label>
                    <select
                      value={formData.artistType || ''}
                      onChange={(e) => setFormData({...formData, artistType: e.target.value as any})}
                      className="w-full p-2 rounded bg-white/20 text-white"
                    >
                      <option value="">Select...</option>
                      <option value="solo">Solo</option>
                      <option value="band">Band</option>
                      <option value="duo">Duo</option>
                      <option value="collaboration">Collaboration</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-semibold mb-2">Country</label>
                    <input
                      type="text"
                      value={formData.country || ''}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="USA, UK, Canada..."
                    />
                  </div>
                  <div>
                    <label className="block text-white font-semibold mb-2">Region (optional)</label>
                    <input
                      type="text"
                      value={formData.region || ''}
                      onChange={(e) => setFormData({...formData, region: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="California, London..."
                    />
                  </div>
                </div>

                {(formData.type === 'album' || formData.album) && (
                  <div>
                    <label className="block text-white font-semibold mb-2">Album</label>
                    <input
                      type="text"
                      value={formData.album || ''}
                      onChange={(e) => setFormData({...formData, album: e.target.value})}
                      className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      placeholder="Album name"
                    />
                  </div>
                )}

              </div>
              <div className="flex gap-4 pt-4 mt-4 border-t border-white/20">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Save Puzzle
                </button>
                <button
                  onClick={() => {setIsEditing(false); setSelectedPuzzle(null);}}
                  className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
            </div>
          ) : activeTab === 'settings' ? (
            <SettingsTab />
          ) : (
            <UICopyTab />
          )}
        </div>
      </div>

      {/* Emoji Picker Modal */}
      {isEmojiPickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-white/20">
              <h3 className="text-xl font-bold text-white">Choose an Emoji</h3>
              <button
                onClick={() => setIsEmojiPickerOpen(false)}
                className="text-white hover:text-red-400 text-2xl transition-colors"
                aria-label="Close emoji picker"
              >
                ×
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 p-4 border-b border-white/20">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveEmojiCategory(category)}
                  className={cn(
                    "px-3 py-1 rounded text-sm font-medium transition-colors",
                    activeEmojiCategory === category
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {EMOJI_CATEGORIES[activeEmojiCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-2xl p-2 rounded hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white/10"
                    title={`Select ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/20 text-center">
              <p className="text-white/70 text-sm">
                Click an emoji to add it to your puzzle • Press Escape to close
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}