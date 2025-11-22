# Interactive Dental Chart Application

A React-based dental chart application that allows users to select crown and root parts of teeth using SVG graphics.

## Features

- Interactive dental chart with all 32 teeth (FDI numbering system)
- Separate selection for crown and root parts of each tooth
- Visual feedback with color coding (blue for crowns, green for roots)
- Real-time selection summary
- Save and clear functionality
- Responsive design with Tailwind CSS

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── DentalChart.js    # Main dental chart component
│   │   │   └── ToothComponent.js # Individual tooth component
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── dental/                 # SVG files for teeth
├── server.js              # Node.js backend server
├── package.json           # Backend dependencies
└── start.bat             # Windows startup script
```

## Installation

1. Install backend dependencies:
```bash
npm install
```

2. Install frontend dependencies:
```bash
cd client
npm install
cd ..
```

## Running the Application

### Option 1: Using the batch file (Windows)
```bash
start.bat
```

### Option 2: Manual startup
1. Start the backend server:
```bash
npm run server
```

2. In a new terminal, start the frontend:
```bash
npm run client
```

### Option 3: Concurrent startup
```bash
npm run dev
```

## Usage

1. Open your browser to `http://localhost:3000`
2. Click on crown or root parts of any tooth to select/deselect them
3. Selected crowns will be highlighted in blue
4. Selected roots will be highlighted in green
5. View your selections in the summary section below the chart
6. Use "Save Selections" to persist your choices
7. Use "Clear All" to reset all selections

## API Endpoints

- `GET /api/teeth` - Returns available teeth data with crown/root SVG paths
- `POST /api/selections` - Saves the current selection state

## Technologies Used

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express
- **Graphics**: SVG files for anatomically accurate tooth representations
- **Styling**: Tailwind CSS for responsive design

## Customization

- Add more tooth conditions by modifying the selection logic
- Extend the SVG graphics with additional dental features
- Implement database storage for persistent selections
- Add user authentication and multiple patient support