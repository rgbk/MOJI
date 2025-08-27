import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface Puzzle {
  id: number;
  type: 'artist' | 'song' | 'song-artist';
  emoji: string;
  clues: string[];
  answers: string[];
  displayAnswer: string;
  videoFile?: string;
  videoUrl?: string;
  links: { name: string; url: string }[];
}

interface PuzzleData {
  puzzles: Puzzle[];
}

export default function Admin() {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [selectedPuzzle, setSelectedPuzzle] = useState<Puzzle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Puzzle>>({});

  useEffect(() => {
    loadPuzzles();
  }, []);

  const loadPuzzles = async () => {
    try {
      const response = await fetch('/puzzles.json');
      const data: PuzzleData = await response.json();
      setPuzzles(data.puzzles);
    } catch (error) {
      console.error('Failed to load puzzles:', error);
    }
  };

  const savePuzzles = async (updatedPuzzles: Puzzle[]) => {
    const data = { puzzles: updatedPuzzles };
    console.log('Would save to backend:', data);
    alert('Save functionality would integrate with backend API');
  };

  const handleEdit = (puzzle: Puzzle) => {
    setSelectedPuzzle(puzzle);
    setFormData(puzzle);
    setIsEditing(true);
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
    const newId = Math.max(...puzzles.map(p => p.id)) + 1;
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">MOJI Admin</h1>
          <button
            onClick={handleAddNew}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Add New Puzzle
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Puzzles List */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Puzzles ({puzzles.length})</h2>
            <div className="space-y-3 overflow-y-auto rounded-lg" style={{ maxHeight: 'calc(100vh - 20rem)' }}>
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
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {selectedPuzzle?.id ? 'Edit Puzzle' : 'Add New Puzzle'}
              </h2>
              
              <div className="space-y-4">
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
                  </select>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Emoji</label>
                  <input
                    type="text"
                    value={formData.emoji || ''}
                    onChange={(e) => setFormData({...formData, emoji: e.target.value})}
                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                    placeholder="🎵🎶🎤"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Display Answer</label>
                  <input
                    type="text"
                    value={formData.displayAnswer || ''}
                    onChange={(e) => setFormData({...formData, displayAnswer: e.target.value})}
                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                    placeholder="Song Title - Artist Name"
                  />
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

                <div>
                  <label className="block text-white font-semibold mb-2">Video File (optional)</label>
                  <input
                    type="text"
                    value={formData.videoFile || ''}
                    onChange={(e) => setFormData({...formData, videoFile: e.target.value})}
                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                    placeholder="video-name.mp4"
                  />
                </div>

                <div>
                  <label className="block text-white font-semibold mb-2">Video URL (optional)</label>
                  <input
                    type="url"
                    value={formData.videoUrl || ''}
                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                    className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                    placeholder="https://youtube.com/embed/..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}