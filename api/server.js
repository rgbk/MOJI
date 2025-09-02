const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Save puzzles endpoint
app.post('/api/puzzles', async (req, res) => {
  try {
    const { puzzles } = req.body;
    
    if (!puzzles || !Array.isArray(puzzles)) {
      return res.status(400).json({ error: 'Invalid puzzles data' });
    }

    const puzzleData = {
      puzzles: puzzles
    };

    const filePath = path.join(__dirname, '..', 'public', 'puzzles.json');
    await fs.writeFile(filePath, JSON.stringify(puzzleData, null, 2), 'utf8');
    
    console.log('✅ Puzzles saved to file:', puzzles.length);
    res.json({ success: true, count: puzzles.length });
    
  } catch (error) {
    console.error('❌ Failed to save puzzles:', error);
    res.status(500).json({ error: 'Failed to save puzzles' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});