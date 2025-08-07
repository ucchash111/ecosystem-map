# Ecosystem Map Setup Guide

## Google Sheets Setup

### 1. Create Google Sheets API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Copy the API key

### 2. Prepare Your Google Sheet
Your Google Sheet should have the following columns (case-insensitive):

**Required columns:**
- `name` - Organization/company name
- `latitude` or `lat` - Latitude coordinate  
- `longitude`, `lng`, or `lon` - Longitude coordinate

**Optional columns:**
- `category` or `type` - Ecosystem category (Venture Capital, Impact Investor, etc.)
- `description` - Additional info to show in popup
- `website` or `url` - Website URL
- `email` - Contact email
- `focus` or `sector` - Investment focus or sector

Example sheet structure:
```
Name              | Latitude | Longitude  | Category           | Description        | Website
Sequoia Capital   | 37.4419  | -122.1430  | Venture Capital    | Leading VC firm    | sequoiacap.com
Techstars         | 39.7392  | -104.9903  | Incubators & Accelerators | Global accelerator | techstars.com
Y Combinator      | 37.4419  | -122.1430  | Incubators & Accelerators | Startup accelerator | ycombinator.com
```

### 3. Get Sheet ID
1. Open your Google Sheet
2. Copy the Sheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit#gid=0`

### 4. Make Sheet Public
1. Click "Share" button
2. Change access to "Anyone with the link can view"
3. Save changes

### 5. Configure Environment Variables
Update `.env.local`:
```
GOOGLE_SHEETS_API_KEY=your_actual_api_key_here
GOOGLE_SHEET_ID=your_actual_sheet_id_here
```

## Running the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your map with data from Google Sheets.

## Troubleshooting

- Ensure your Google Sheet is publicly accessible
- Verify API key has Sheets API enabled
- Check console for error messages
- Ensure latitude/longitude values are valid numbers