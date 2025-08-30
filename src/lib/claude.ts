import Anthropic from '@anthropic-ai/sdk';

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

class ClaudeService {
  private client: Anthropic | null = null;
  private apiKey: string | null = null;

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_CLAUDE_API_KEY;
    
    if (apiKey) {
      this.apiKey = apiKey;
      this.client = new Anthropic({
        apiKey,
        dangerouslyAllowBrowser: true, // For client-side usage in development
        defaultHeaders: {
          "anthropic-version": "2023-06-01"
        }
      });
    }
  }

  async generatePuzzleData(type: PuzzleData['type'], answer: string): Promise<PuzzleData> {
    if (!this.client) {
      throw new Error('Claude API key not configured. Please add VITE_CLAUDE_API_KEY to your .env file');
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
- If it's a song, include both artist and song info
- Return ONLY valid JSON, no additional text`;

    try {
      const message = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      if (!responseText) {
        throw new Error('No response from Claude');
      }

      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : responseText;

      const puzzleData = JSON.parse(jsonText) as PuzzleData;
      
      // Validate required fields
      this.validatePuzzleData(puzzleData);
      
      return puzzleData;
    } catch (error) {
      console.error('Claude API Error (Full Details):', error);
      
      // Create detailed error message for debugging
      let detailedError = 'CLAUDE API DEBUG INFO:\n';
      detailedError += `- API Key configured: ${this.apiKey ? 'YES (length: ' + this.apiKey.length + ')' : 'NO'}\n`;
      detailedError += `- Model used: claude-sonnet-4-20250514\n`;
      detailedError += `- Endpoint: https://api.anthropic.com/v1/messages\n`;
      detailedError += `- Input type: ${type}\n`;
      detailedError += `- Input answer: ${answer}\n`;
      
      if (error instanceof Error) {
        detailedError += `- Error name: ${error.name}\n`;
        detailedError += `- Error message: ${error.message}\n`;
        detailedError += `- Error stack: ${error.stack}\n`;
      }
      
      // Try to extract more details from Anthropic API error
      if (typeof error === 'object' && error !== null) {
        detailedError += `- Full error object: ${JSON.stringify(error, null, 2)}\n`;
      }
      
      console.error('DETAILED ERROR FOR DEBUGGING:', detailedError);
      
      throw new Error(detailedError);
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
      await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 10,
        messages: [{ role: "user", content: "Hello" }]
      });
      return true;
    } catch (error) {
      console.error('Claude connection test failed:', error);
      return false;
    }
  }
  
  isConfigured(): boolean {
    return this.client !== null;
  }

  async generateEmoji(type: string, answer: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `Generate 3-4 creative emojis that represent "${answer.trim()}" as a ${type || 'song'}. 
      
      Rules:
      - Be creative and visual
      - Use emojis that hint at the title, artist, or theme
      - Make it challenging but solvable
      - Return ONLY the emojis, no other text
      
      Example: For "Bohemian Rhapsody" return something like: 👑🎭🎵🌟`;

    const message = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    return responseText.trim();
  }

}

export const claudeService = new ClaudeService();
export type { PuzzleData };