interface Puzzle {
  id: number;
  type: 'artist' | 'song' | 'song-artist' | 'album';
  emoji: string;
  clues: string[];
  answers: string[];
  displayAnswer: string;
  videoFile?: string;
  videoUrl?: string;
  links: { name: string; url: string }[];
  // New fields from AI
  genre?: string;
  subGenre?: string;
  decade?: string;
  year?: number;
  artistType?: 'solo' | 'band' | 'duo' | 'collaboration';
  country?: string;
  region?: string;
  album?: string;
}

interface PuzzleData {
  puzzles: Puzzle[];
}

// const PUZZLES_KEY = 'moji_puzzles_data'; // Disabled - no more caching

export class PuzzleService {
  private static instance: PuzzleService;
  private puzzles: Puzzle[] = [];
  private listeners: Set<(puzzles: Puzzle[]) => void> = new Set();
  private loadingPromise: Promise<void> | null = null;
  private isLoaded = false;

  private constructor() {
    // Don't start loading in constructor to avoid race conditions
  }

  static getInstance(): PuzzleService {
    if (!PuzzleService.instance) {
      PuzzleService.instance = new PuzzleService();
    }
    return PuzzleService.instance;
  }

  private async loadPuzzles(): Promise<void> {
    // Prevent multiple simultaneous loads
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    if (this.isLoaded) {
      return;
    }

    this.loadingPromise = this.doLoadPuzzles();
    await this.loadingPromise;
    this.loadingPromise = null;
    this.isLoaded = true;
  }

  private async doLoadPuzzles(): Promise<void> {
    try {
      console.log('🔄 PuzzleService: Loading fresh puzzles from JSON (NO CACHE)...');
      
      // ALWAYS load fresh from JSON file - NO CACHING!
      // This ensures multiplayer sync works correctly
      const response = await fetch('/puzzles.json?t=' + Date.now()); // Cache bust
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzles.json: ${response.status}`);
      }
      
      const data: PuzzleData = await response.json();
      this.puzzles = data.puzzles || [];
      
      console.log('✅ PuzzleService: Loaded fresh puzzles from JSON:', this.puzzles.length);
    } catch (error) {
      console.error('❌ PuzzleService: Failed to load puzzles:', error);
      this.puzzles = [];
      throw error; // Re-throw so caller can handle it
    }
  }

  // DISABLED: No more localStorage caching to ensure fresh data
  // private async savePuzzlesToStorage(): Promise<void> {
  //   // Caching disabled for multiplayer sync
  // }

  async getPuzzles(): Promise<Puzzle[]> {
    // Force fresh load every time - no caching!
    this.isLoaded = false;
    this.loadingPromise = null;
    await this.loadPuzzles();
    return [...this.puzzles];
  }

  async savePuzzles(updatedPuzzles: Puzzle[]): Promise<void> {
    try {
      this.puzzles = [...updatedPuzzles];
      
      // Save to file via simple API call
      try {
        const response = await fetch('http://localhost:3001/api/puzzles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ puzzles: updatedPuzzles })
        });

        if (response.ok) {
          console.log('✅ Puzzles saved to file!');
        } else {
          throw new Error('Save failed');
        }
      } catch (error) {
        console.error('❌ Failed to save to file:', error);
        alert('Failed to save changes to file. Changes are only in memory.');
      }
      
      // Still notify listeners for live updates
      this.listeners.forEach(listener => listener(this.puzzles));
      
    } catch (error) {
      console.error('Failed to save puzzles:', error);
      throw error;
    }
  }

  async addPuzzle(puzzle: Puzzle): Promise<void> {
    this.puzzles.push(puzzle);
    await this.savePuzzles(this.puzzles);
  }

  async updatePuzzle(puzzleId: number, updatedPuzzle: Puzzle): Promise<void> {
    const index = this.puzzles.findIndex(p => p.id === puzzleId);
    if (index !== -1) {
      this.puzzles[index] = updatedPuzzle;
      await this.savePuzzles(this.puzzles);
    } else {
      throw new Error(`Puzzle with id ${puzzleId} not found`);
    }
  }

  async deletePuzzle(puzzleId: number): Promise<void> {
    const filteredPuzzles = this.puzzles.filter(p => p.id !== puzzleId);
    await this.savePuzzles(filteredPuzzles);
  }

  subscribe(listener: (puzzles: Puzzle[]) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Export puzzles as JSON for backup
  exportPuzzles(): string {
    return JSON.stringify({ puzzles: this.puzzles }, null, 2);
  }

  // Import puzzles from JSON
  async importPuzzles(jsonData: string): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      if (data.puzzles && Array.isArray(data.puzzles)) {
        await this.savePuzzles(data.puzzles);
        console.log('✅ Imported puzzles successfully:', data.puzzles.length);
      } else {
        throw new Error('Invalid puzzle data format');
      }
    } catch (error) {
      console.error('Failed to import puzzles:', error);
      throw error;
    }
  }

  // Get the next available ID for new puzzles
  getNextId(): number {
    if (this.puzzles.length === 0) return 1;
    return Math.max(...this.puzzles.map(p => p.id)) + 1;
  }
}

// Export singleton instance
export const puzzleService = PuzzleService.getInstance();
export type { Puzzle, PuzzleData };