# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application that creates an interactive ecosystem map for Bangladesh's startup ecosystem. The application fetches data from Google Sheets and displays organizations as site previews with favicons and names.

**Current Goal**: Create a site preview map where each organization is displayed as a card showing:
- Website favicon
- Organization name
- Direct link to their website
- Clean, grid-based layout with filtering capabilities

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack for faster builds)
- **Production build**: `npm run build`
- **Production start**: `npm start`
- **Linting**: `npm run lint`

## Environment Configuration

Required environment variables in `.env.local`:
- `GOOGLE_SHEETS_API_KEY` - Google Sheets API key for data access
- `GOOGLE_SHEET_ID` - ID of the Google Sheet containing ecosystem data

## Architecture Overview

### Data Flow
1. Google Sheets → GoogleSheetsService → Server-side rendering
2. Alternative API route available at `/api/sheet-data` for client-side fetching
3. Logo management system with automatic downloading and caching

### Key Components
- **GoogleSheetsService** (`src/lib/googleSheets.ts`) - Handles Google Sheets API integration
- **CompanyCard** (`src/components/CompanyCard.tsx`) - Individual company display component
- **LogoManager** (`src/lib/logoManager.ts`) - Manages logo downloading and caching
- **EcosystemCard**, **Map**, **MapContainer** - Additional display components

### Type System
- **EcosystemPlayer** interface defines the core data structure with coordinates for map display
- **EcosystemData** interface used for Google Sheets integration
- **EcosystemCategory** enum defines 13 supported categories with associated colors and icons

### API Routes
- `/api/sheet-data` - Fetches current sheet data
- `/api/download-logo` - Downloads logos for companies
- `/api/update-logos` - Batch logo updating functionality

## Google Sheets Integration

The application expects sheets with these columns (case-insensitive):
- **Required**: `name`, `latitude`/`lat`, `longitude`/`lng`/`lon`
- **Optional**: `category`/`type`, `description`, `website`/`url`, `email`, `focus`/`sector`, `tier`

Data is automatically categorized into predefined ecosystem categories with specific visual styling.

## Logo System

- Logos are cached in `public/logos/` directory
- Automatic fallback to generated SVG placeholders using company initials
- Background downloading system to populate logos over time
- Filename convention: domain-based naming (e.g., `example.com.png`)

## Styling & Layout

- Uses Tailwind CSS v4 with custom grid-based ecosystem map layout
- Responsive design with different layouts for mobile/desktop
- Category-specific color schemes defined in both type definitions and page components

## Production Deployment

### PM2 Process Management
- **Process name**: `ecosystem-map`
- **Start command**: `pm2 start npm --name "ecosystem-map" -- start`
- **Stop command**: `pm2 stop ecosystem-map`
- **Restart command**: `pm2 restart ecosystem-map`
- **Logs**: `pm2 logs ecosystem-map`

### Deployment Workflow
1. Build the application: `npm run build`
2. Start with PM2: `pm2 start npm --name "ecosystem-map" -- start`
3. Save PM2 configuration: `pm2 save`
4. Application runs on port 3000 (default Next.js port)

### PM2 Deployment Notes
- Always restart pm2