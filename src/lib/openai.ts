import OpenAI from 'openai';

interface PuzzleData {
  type: 'artist' | 'song' | 'song-artist' | 'album';
  answer: string;
  emoji: string;
  clues: string[];
  displayAnswer: string;
  genre: string;
  subGenre?: string;
  decade: string;
  year: number;
  artistType: 'solo' | 'band' | 'duo' | 'collaboration';
  country: string;
  region?: string;
  album?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
}

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY;
    
    if (apiKey) {
      this.apiKey = apiKey;
      this.client = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true // For client-side usage in development
      });
    }
  }

  async generatePuzzleData(type: PuzzleData['type'], answer: string): Promise<PuzzleData> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file');
    }
    const prompt = `You are a music expert creating puzzle data for a music guessing game.

Given:
- Type: ${type}
- Answer: "${answer}"

Generate a JSON response with the following structure:
{
  "type": "${type}",
  "answer": "${answer.toLowerCase()}",
  "emoji": "3-4 emojis that represent this ${type}",
  "clues": ["3 progressive clues from easy to hard"],
  "displayAnswer": "Properly formatted display name",
  "genre": "Primary music genre",
  "subGenre": "More specific sub-genre (optional)",
  "decade": "Decade (e.g., '1980s', '1990s', '2000s')",
  "year": year_as_number,
  "artistType": "solo/band/duo/collaboration",
  "country": "Country of origin",
  "region": "State/region if applicable",
  "album": "Album name if type includes album",
  "spotifyUrl": "https://open.spotify.com/... (generate pattern)",
  "appleMusicUrl": "https://music.apple.com/... (generate pattern)"
}

Rules:
- Emojis should be creative but recognizable
- Clues should progress from broad to specific
- Be accurate with music facts
- Generate realistic Spotify/Apple Music URLs following their patterns
- If it's just an artist, don't include song-specific details
- If it's a song, include both artist and song info`;

    try {
      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a music expert. Always respond with valid JSON only, no additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const responseText = completion.choices[0].message.content;
      if (!responseText) {
        throw new Error('No response from OpenAI');
      }

      const puzzleData = JSON.parse(responseText) as PuzzleData;
      
      // Validate required fields
      this.validatePuzzleData(puzzleData);
      
      return puzzleData;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Fallback mock data for testing when API fails
      if (error instanceof Error && error.message.includes('429')) {
        console.warn('OpenAI quota exceeded, using mock data for testing...');
        return this.generateMockData(type, answer);
      }
      
      throw new Error(`Failed to generate puzzle data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validatePuzzleData(data: PuzzleData): void {
    const required = ['type', 'answer', 'emoji', 'clues', 'displayAnswer', 'genre', 'decade', 'year', 'artistType', 'country'];
    
    for (const field of required) {
      if (!data[field as keyof PuzzleData]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (!Array.isArray(data.clues) || data.clues.length !== 3) {
      throw new Error('Clues must be an array of exactly 3 items');
    }
    
    if (typeof data.year !== 'number' || data.year < 1900 || data.year > new Date().getFullYear()) {
      throw new Error('Year must be a valid number between 1900 and current year');
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      return true;
    } catch (error) {
      console.error('OpenAI connection test failed:', error);
      return false;
    }
  }
  
  isConfigured(): boolean {
    return this.client !== null;
  }

  private generateMockData(type: PuzzleData['type'], answer: string): PuzzleData {
    // Simple mock data generator for testing
    const mockData: PuzzleData = {
      type,
      answer: answer.toLowerCase(),
      emoji: "🎵🎶🎤",
      clues: [
        `Popular ${type}`,
        "You've probably heard this before",
        "Classic hit"
      ],
      displayAnswer: answer,
      genre: "Pop",
      subGenre: "Mainstream",
      decade: "2000s",
      year: 2005,
      artistType: type === 'artist' ? 'solo' : 'band',
      country: "USA",
      region: "California",
      album: type.includes('album') ? answer : undefined,
      spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(answer)}`,
      appleMusicUrl: `https://music.apple.com/search?term=${encodeURIComponent(answer)}`
    };

    console.log('🤖 Generated mock data for testing:', mockData);
    return mockData;
  }
}

export const openAIService = new OpenAIService();
export type { PuzzleData };