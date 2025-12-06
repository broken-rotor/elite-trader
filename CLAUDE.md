# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React application that helps Elite Dangerous players optimize material trading for engineering blueprints. The app calculates the most efficient trading paths to acquire needed materials using the in-game Material Trader's conversion ratios.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:3000)
npm start

# Build for production
npm build
```

## Architecture

### Core Application Structure

This is a single-page React application (Create React App) with all logic in a single `App.js` component. The application does not use external state management libraries or routing.

**Main files:**
- `src/App.js` - Main application component containing all UI and business logic
- `src/App.css` - All styling (dark theme with quality-based color coding)
- `src/index.js` - React entry point
- `public/index.html` - HTML shell

### Data Model

**MATERIALS_DB** (lines 5-152 in App.js):
- Complete database of Elite Dangerous materials
- Each material has: `item` (name), `type` (category), `quality` (1-5 grade), `source` (acquisition method)
- Material types include: Encoded (Data archives, Emission data, etc.), Manufactured (Alloys, Capacitors, etc.), Raw (Raw material 1-7)
- Quality grades: 1=Gray (Common), 2=Green (Uncommon), 3=Blue (Rare), 4=Purple (Very Rare), 5=Gold (Legendary)

**BLUEPRINTS_DB** (lines 155-380 in App.js):
- Engineering blueprint recipes organized by module type (FSD, Thrusters, Power Plant, etc.)
- Each blueprint has grades 1-5 with specific material requirements
- Structure: `module -> blueprint -> grade -> materials[]`

### Trading Algorithm

The optimization algorithm in `optimizeTrading()` (lines 417-531) follows a priority system:

1. **Direct Fulfillment**: Use exact materials already in inventory
2. **Same Slot Trading**: Trade materials of same type and quality (1:1 ratio)
3. **Conversion Trading**: Cross-quality and cross-type trading with the following costs:
   - Upgrade (lower → higher quality): 6:1 ratio
   - Downgrade (higher → lower quality): 1:3 ratio
   - Cross-type (same quality, different type): 6:1 ratio

The algorithm in `generateTradeSteps()` (lines 533-583) generates step-by-step trade sequences, handling quality changes before type changes for efficiency.

### State Management

All state is managed via React useState hooks in the App component:
- `inventory` - Materials the player currently owns
- `manualNeeds` - Manually added material requirements
- `selectedBlueprints` - Engineering blueprints selected by user
- `activeTab` - Current UI tab (blueprints/manual/inventory)

Derived state uses `useMemo`:
- `blueprintNeeds` - Calculated material costs from selected blueprints
- `allNeeds` - Combined manual + blueprint needs
- `result` - Optimization output (trades, fulfilled, unfulfilled)

### UI Organization

The app uses a tabbed interface with three main sections:

1. **Blueprints Tab**: Select engineering blueprints, specify grade ranges (G1-G5) and number of rolls
2. **Manual Entry Tab**: Add specific materials needed that aren't from blueprints
3. **Inventory Tab**: Track materials currently owned

**Results Panel** (always visible): Shows the optimized trade sequence, fulfilled materials, and unfulfilled materials with acquisition sources.

### Styling System

Quality-based color coding (App.css lines 239-250):
- `.quality-1` through `.quality-5` for text colors
- `.quality-bg-1` through `.quality-bg-5` for background colors
- Dark theme base (`#020617` background, `#0f172a` panels)
- Orange accent color (`#f97316`) for primary actions

## Key Implementation Details

- Material lookup uses `getMaterial(itemName)` helper to find material details by name
- `getConversionCost()` calculates total conversion ratio between any two materials
- Blueprint costs accumulate across all grades selected (e.g., G1-G5 means costs for all 5 grades)
- Number of "rolls" multiplies material costs (engineering attempts aren't guaranteed)
- Search dropdowns are limited to 8 results and use `toLowerCase()` for case-insensitive matching

## Elite Dangerous Game Context

Material trading in Elite Dangerous follows specific rules:
- Materials are categorized into Encoded, Manufactured, and Raw
- Each category has subcategories (types) with materials organized in quality tiers (1-5)
- Material Traders allow trading within a category only
- Players have limited material storage (max quantities per material)
- Engineering requires specific materials and may take multiple rolls to get desired stats
