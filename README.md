# Elite Dangerous Material Trader

A React application to optimize material trading for Elite Dangerous engineering.

URL: https://broken-rotor.github.io/elite-trader/

## Setup Instructions

1. **Prerequisites**: Make sure you have Node.js installed (v16 or higher)
   - Download from: https://nodejs.org/

2. **Extract the zip file** to a folder of your choice

3. **Open a terminal/command prompt** and navigate to the extracted folder:
   ```bash
   cd elite-trader-app
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Start the application**:
   ```bash
   npm start
   ```

6. **Open your browser** to http://localhost:3000

## Features

- **Blueprint Calculator**: Select engineering blueprints to calculate total material costs
- **Manual Entry**: Add specific materials you need
- **Inventory Management**: Track what materials you currently have
- **Trade Optimization**: See the most efficient trading path to get what you need

## Trade Ratios

- Upgrade (lower → higher quality): 6:1
- Downgrade (higher → lower quality): 1:3
- Cross-type (same quality, different type): 6:1

## Quality Grades

- Grade 1: Gray (Common)
- Grade 2: Green (Uncommon)
- Grade 3: Blue (Rare)
- Grade 4: Purple (Very Rare)
- Grade 5: Gold (Legendary)
