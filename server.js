const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use('/dental', express.static(path.join(__dirname, 'dental')));

// Get all available teeth SVG files
app.get('/api/teeth', (req, res) => {
  try {
    const dentalDir = path.join(__dirname, 'dental');
    const files = fs.readdirSync(dentalDir);
    
    const teeth = {};
    
    files.forEach(file => {
      if (file.endsWith('.svg')) {
        // Handle different naming patterns
        let match = file.match(/teeth\s+(\d+)\s+(crown|root)\.svg/);
        if (!match) {
          match = file.match(/teeth\s+(\d+)\s+crown-1\.svg/);
          if (match) {
            match[2] = 'crown';
          }
        }
        if (!match) {
          match = file.match(/teeth\s+(\d+)\s+\s+crown\.svg/);
          if (match) {
            match[2] = 'crown';
          }
        }
        
        if (match) {
          const toothNumber = match[1];
          const part = match[2];
          
          if (!teeth[toothNumber]) {
            teeth[toothNumber] = {};
          }
          
          teeth[toothNumber][part] = `/dental/${encodeURIComponent(file)}`;
        }
      }
    });
    
    res.json(teeth);
  } catch (error) {
    console.error('Error loading teeth data:', error);
    res.status(500).json({ error: 'Failed to load teeth data' });
  }
});

// Save selection state, positions, and transforms
app.post('/api/selections', (req, res) => {
  try {
    const { selections, positions, transforms } = req.body;
    // In a real app, you'd save this to a database
    console.log('Selections saved:', selections);
    if (positions) {
      console.log('Positions saved:', positions);
    }
    if (transforms) {
      console.log('Transforms saved:', transforms);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Set current positions and transforms as new defaults
app.post('/api/set-defaults', (req, res) => {
  try {
    const { defaultPositions, defaultTransforms } = req.body;
    
    // Save defaults to a JSON file for persistence
    const defaultsPath = path.join(__dirname, 'defaults.json');
    const defaults = {
      positions: defaultPositions || {},
      transforms: defaultTransforms || {},
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(defaultsPath, JSON.stringify(defaults, null, 2));
    
    console.log('New defaults set:', defaults);
    res.json({ success: true, message: 'Defaults updated successfully' });
  } catch (error) {
    console.error('Error setting defaults:', error);
    res.status(500).json({ error: 'Failed to set defaults' });
  }
});

// Get current defaults
app.get('/api/defaults', (req, res) => {
  try {
    const defaultsPath = path.join(__dirname, 'defaults.json');
    
    if (fs.existsSync(defaultsPath)) {
      const defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
      res.json(defaults);
    } else {
      // Return empty defaults if file doesn't exist
      res.json({
        positions: {},
        transforms: {},
        updatedAt: null
      });
    }
  } catch (error) {
    console.error('Error loading defaults:', error);
    res.status(500).json({ error: 'Failed to load defaults' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});