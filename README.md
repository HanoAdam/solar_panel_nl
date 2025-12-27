# Solar Panel Information App

A modern React application with a sleek, dark-themed design that allows users to search for addresses and view solar panel information from a spreadsheet file. Features an integrated PDOK.nl map display with a clean, professional interface inspired by modern design systems.

## Features

1. **Address Search Bar** - Modern search interface with real-time address lookup
2. **Solar Panel Data Display** - Clean information panel showing the number of solar panels and capacity
3. **PDOK.nl Map Integration** - Large, interactive map with PDOK layers (BGT and aerial imagery)
4. **Modern Design** - Dark theme with glassmorphism effects, smooth animations, and professional typography

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` (or the port shown in the terminal)

## Usage

1. **Prepare Spreadsheet**: Place your spreadsheet file (`solar_panels.csv` or `solar_panels.xlsx`) in the `public` folder before deployment. The spreadsheet should have the following columns:
   - `Address` (required) - The address or location
   - `Panels` (required) - Number of solar panels
   - `Capacity` (optional) - Total capacity in kW

2. **Search for Address**: Enter an address in the search bar and click "Search" or press Enter.

3. **View Results**: The app will:
   - Display solar panel information in the left panel
   - Show the location on a large PDOK.nl map in the right panel

## Sample Data

A sample CSV file (`solar_panels.csv`) is included in the `public` folder with example data for Dutch cities. You can use this as a template for your own spreadsheet.

## Spreadsheet Format

Your spreadsheet should follow this format:

| Address | Panels | Capacity |
|---------|--------|----------|
| Amsterdam, Netherlands | 25 | 5.0 |
| Rotterdam, Netherlands | 30 | 6.5 |

The column names are case-insensitive and can be:
- `Address` or `address`
- `Panels` or `panels` or `Number of Panels`
- `Capacity` or `capacity` or `Total Capacity (kW)`

## Technologies Used

- React 18
- Vite
- XLSX (for reading spreadsheet files)
- Leaflet & React-Leaflet (for map integration)
- OpenStreetMap Nominatim (for geocoding addresses)
- PDOK.nl (Dutch mapping service with WMS layers)

## Project Structure

```
solar_panel/
├── public/
│   └── solar_panels.csv          # Sample spreadsheet data
├── src/
│   ├── components/
│   │   ├── SearchBar.jsx         # Address search component
│   │   ├── SolarPanelInfo.jsx    # Solar panel data display
│   │   └── PdokMap.jsx           # PDOK map integration
│   ├── utils/
│   │   ├── spreadsheetReader.js  # Spreadsheet reading utilities
│   │   └── geocoding.js          # Address geocoding utilities
│   ├── App.jsx                   # Main application component
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Global styles
├── package.json
├── vite.config.js
└── README.md
```

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Notes

- The app uses OpenStreetMap's Nominatim service for geocoding addresses. Please be respectful of their usage policy.
- PDOK.nl is a Dutch mapping service. The map integration uses Leaflet with PDOK WMS layers (BGT and aerial imagery).
- Address matching is case-insensitive and supports partial matching if an exact match is not found.
- The spreadsheet file must be placed in the `public` folder before deployment. The app will automatically load `solar_panels.csv` or `solar_panels.xlsx` on startup.

