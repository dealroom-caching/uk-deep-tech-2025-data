# UK Deep Tech 2025 Data Cache

This repository contains automatically updated cache data for UK deep tech sector and location analytics.

## How it works

1. **GitHub Action** runs daily at 2 AM UTC
2. **Fetches fresh data** from Google Sheets (14 parallel requests)
3. **Updates cache files** in `public/cached-data/`
4. **Commits changes** back to the repository

## Files

- `sectors-cache.json` - Main cache file with dual datasets (locations & sectors)
- `fetch-cache-data.js` - Script to fetch and update cache data
- `.github/workflows/refresh-cache.yml` - GitHub Action workflow

## Manual Update

You can manually trigger a cache update:

1. Go to the "Actions" tab in GitHub
2. Click "Auto-refresh Google Sheets cache" 
3. Click "Run workflow"

Or run locally:
```bash
npm run fetch-cache-data
```

## Data Architecture

The system fetches data from a single Google Spreadsheet with **two separate datasets**:

### Datasets
- **Locations** - Geographic data (London, Cambridge, etc.)
- **Sectors** - Industry sectors (AI, Biotech, etc.)

### Data Types (7 per dataset)
Each dataset includes:
1. `overview` - Main metrics (companies, unicorns, VC, EV)
2. `yearly` - Year-by-year time series
3. `quarterly` - Quarterly time series
4. `regional` - Regional distribution percentages
5. `evTimeseries` - Enterprise value over time
6. `vcTimeseries` - Venture capital investments over time
7. `deepTechShare` - Deep tech share percentages over time

## Cache Structure

```json
{
  "timestamp": "2025-11-19T12:00:00.000Z",
  "lastUpdated": "2025-11-19T12:00:00.000Z",
  "locations": {
    "overview": {
      "headers": ["location_name", "location_display_name", "nr_funded", ...],
      "rows": [["london", "London", 1500, ...], ...]
    },
    "yearly": { "headers": [...], "rows": [...] },
    "quarterly": { "headers": [...], "rows": [...] },
    "regional": { "headers": [...], "rows": [...] },
    "evTimeseries": { "headers": [...], "rows": [...] },
    "vcTimeseries": { "headers": [...], "rows": [...] },
    "deepTechShare": { "headers": [...], "rows": [...] }
  },
  "sectors": {
    "overview": {
      "headers": ["sector_name", "sector_display_name", "nr_funded", ...],
      "rows": [["ai", "Artificial Intelligence", 2500, ...], ...]
    },
    "yearly": { "headers": [...], "rows": [...] },
    "quarterly": { "headers": [...], "rows": [...] },
    "regional": { "headers": [...], "rows": [...] },
    "evTimeseries": { "headers": [...], "rows": [...] },
    "vcTimeseries": { "headers": [...], "rows": [...] },
    "deepTechShare": { "headers": [...], "rows": [...] }
  }
}
```

## Access

The cache is publicly accessible via GitHub raw files:
```
https://raw.githubusercontent.com/dealroom-caching/sectors-table-data/main/public/cached-data/sectors-cache.json
```

## Performance

- **14 parallel requests** (7 per dataset) for efficient data fetching
- **Single HTTP request** for consumers (vs 14 to Google Sheets)
- **~300ms load time** via GitHub CDN (vs ~3000ms direct from Sheets)
- **12-hour cache freshness** validation
