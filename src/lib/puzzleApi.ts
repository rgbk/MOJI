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

class PuzzleAPI {
  private puzzles: Puzzle[] = [];
  private dataFile = '/src/data/puzzles.json';

  async loadPuzzles(): Promise<Puzzle[]> {
    try {
      const response = await fetch(this.dataFile);
      const data: PuzzleData = await response.json();
      this.puzzles = data.puzzles;
      return this.puzzles;
    } catch (error) {
      console.error('Failed to load puzzles:', error);
      return [];
    }
  }

  async savePuzzles(puzzles: Puzzle[]): Promise<boolean> {
    try {
      const data: PuzzleData = { puzzles };
      
      // In a real app, this would be a POST/PUT to your backend
      // For now, we'll simulate saving by updating local state
      // and showing what would be sent to the server
      console.log('Would save to backend:', JSON.stringify(data, null, 2));
      
      // Update local state
      this.puzzles = puzzles;
      
      // In production, you'd do:
      // const response = await fetch('/api/puzzles', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      // return response.ok;
      
      return true;
    } catch (error) {
      console.error('Failed to save puzzles:', error);
      return false;
    }
  }

  async createPuzzle(puzzle: Omit<Puzzle, 'id'>): Promise<Puzzle | null> {
    try {
      const newId = this.puzzles.length > 0 ? Math.max(...this.puzzles.map(p => p.id)) + 1 : 1;
      const newPuzzle: Puzzle = { ...puzzle, id: newId };
      
      const updatedPuzzles = [...this.puzzles, newPuzzle];
      const success = await this.savePuzzles(updatedPuzzles);
      
      return success ? newPuzzle : null;
    } catch (error) {
      console.error('Failed to create puzzle:', error);
      return null;
    }
  }

  async updatePuzzle(id: number, updates: Partial<Puzzle>): Promise<boolean> {
    try {
      const updatedPuzzles = this.puzzles.map(p => 
        p.id === id ? { ...p, ...updates } : p
      );
      
      return await this.savePuzzles(updatedPuzzles);
    } catch (error) {
      console.error('Failed to update puzzle:', error);
      return false;
    }
  }

  async deletePuzzle(id: number): Promise<boolean> {
    try {
      const updatedPuzzles = this.puzzles.filter(p => p.id !== id);
      return await this.savePuzzles(updatedPuzzles);
    } catch (error) {
      console.error('Failed to delete puzzle:', error);
      return false;
    }
  }

  getPuzzles(): Puzzle[] {
    return this.puzzles;
  }

  getPuzzleById(id: number): Puzzle | undefined {
    return this.puzzles.find(p => p.id === id);
  }

  // Utility method to validate puzzle data
  validatePuzzle(puzzle: Partial<Puzzle>): string[] {
    const errors: string[] = [];
    
    if (!puzzle.emoji?.trim()) {
      errors.push('Emoji is required');
    }
    
    if (!puzzle.displayAnswer?.trim()) {
      errors.push('Display answer is required');
    }
    
    if (!puzzle.type || !['artist', 'song', 'song-artist'].includes(puzzle.type)) {
      errors.push('Valid type is required (artist, song, or song-artist)');
    }
    
    if (!puzzle.clues || puzzle.clues.length < 3 || puzzle.clues.some(clue => !clue.trim())) {
      errors.push('Three clues are required');
    }
    
    if (!puzzle.answers || puzzle.answers.length === 0 || puzzle.answers.some(answer => !answer.trim())) {
      errors.push('At least one answer is required');
    }
    
    if (puzzle.videoFile && puzzle.videoUrl) {
      errors.push('Cannot have both video file and video URL');
    }
    
    return errors;
  }
}

export const puzzleAPI = new PuzzleAPI();
export type { Puzzle, PuzzleData };