import fs from 'fs';
import path from 'path';

// Note: Using built-in fetch API available in Node.js 18+
// Google Sheets configuration - Same spreadsheet, different GIDs for locations and sectors
const SPREADSHEET_ID = "1peZPgji4R4-KO4EuuvHGJRWTfHZmuBc9WPVRmn_ldrw";

// Locations dataset configuration
const LOCATIONS_CONFIG = {
  overviewGid: '1304110900',
  yearlyGid: '0',
  quarterlyGid: '0',
  regionalGid: '0',
  evTimeseriesGid: '1009631018',
  vcTimeseriesGid: '1452246798',
  deepTechShareGid: '2142869021'
};

// Sectors dataset configuration
const SECTORS_CONFIG = {
  overviewGid: '1065279143',
  yearlyGid: '0',
  quarterlyGid: '0',
  regionalGid: '0',
  evTimeseriesGid: '1754921105',
  vcTimeseriesGid: '879771746',
  deepTechShareGid: '1539405594'
};

// Build Google Sheets URL
function buildSheetUrl(gid) {
  const timestamp = Date.now();
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=${gid}&timestamp=${timestamp}`;
}

// Parse Google Sheets JSONP response
function parseGoogleSheetsResponse(text) {
  // Extract JSON from JSONP wrapper: google.visualization.Query.setResponse({...});
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);?$/s);
  if (!jsonMatch) {
    throw new Error('Invalid response format from Google Sheets');
  }
  return JSON.parse(jsonMatch[1]);
}

// Fetch and parse a single sheet
async function fetchSheet(gid, name) {
  if (gid === '0') {
    console.log(`⏭️  Skipping ${name} (GID: 0 - placeholder)`);
    return { headers: [], rows: [] };
  }

  console.log(`Fetching ${name} (GID: ${gid})...`);
  
  const response = await fetch(buildSheetUrl(gid));
  if (!response.ok) {
    throw new Error(`Failed to fetch ${name}: ${response.statusText}`);
  }
  
  const text = await response.text();
  const jsonData = parseGoogleSheetsResponse(text);
  
  if (!jsonData.table || !jsonData.table.rows) {
    console.log(`⚠️  No data found in ${name}`);
    return { headers: [], rows: [] };
  }
  
  // Convert to headers/rows format
  const headers = jsonData.table.cols?.map(col => col.label || '') || [];
  const rows = jsonData.table.rows.map(row => 
    row.c?.map(cell => {
      const value = cell?.v;
      // Return value as-is (null becomes null, not empty string)
      return value !== undefined ? value : null;
    }) || []
  );
  
  console.log(`✅ ${name}: ${rows.length} rows, ${headers.length} columns`);
  
  return { headers, rows };
}

// Fetch all 7 data types for a dataset (locations or sectors)
async function fetchDataset(config, datasetName) {
  console.log(`\n📊 Fetching ${datasetName} dataset...`);
  
  try {
    // Fetch all 7 data types in parallel
    const [overview, yearly, quarterly, regional, evTimeseries, vcTimeseries, deepTechShare] = await Promise.all([
      fetchSheet(config.overviewGid, `${datasetName}/overview`),
      fetchSheet(config.yearlyGid, `${datasetName}/yearly`),
      fetchSheet(config.quarterlyGid, `${datasetName}/quarterly`),
      fetchSheet(config.regionalGid, `${datasetName}/regional`),
      fetchSheet(config.evTimeseriesGid, `${datasetName}/evTimeseries`),
      fetchSheet(config.vcTimeseriesGid, `${datasetName}/vcTimeseries`),
      fetchSheet(config.deepTechShareGid, `${datasetName}/deepTechShare`)
    ]);

    return {
      overview,
      yearly,
      quarterly,
      regional,
      evTimeseries,
      vcTimeseries,
      deepTechShare
    };
  } catch (error) {
    console.error(`❌ Failed to fetch ${datasetName}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔄 Fetching fresh Google Sheets data...');
    console.log(`📋 Spreadsheet ID: ${SPREADSHEET_ID}`);
    
    // Create cache directory
    const cacheDir = path.join(process.cwd(), 'public', 'cached-data');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Fetch both datasets in parallel (14 total requests)
    const [locations, sectors] = await Promise.all([
      fetchDataset(LOCATIONS_CONFIG, 'locations'),
      fetchDataset(SECTORS_CONFIG, 'sectors')
    ]);
    
    // Build cache structure matching the expected format
    const cacheData = {
      timestamp: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      locations,
      sectors
    };
    
    // Save to cache file
    const cacheFile = path.join(cacheDir, 'sectors-cache.json');
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    
    console.log('\n✅ Cache updated successfully!');
    console.log(`📁 Cache file: ${cacheFile}`);
    console.log(`🕒 Timestamp: ${cacheData.timestamp}`);
    console.log('\n📊 Summary:');
    console.log(`   Locations - Overview: ${locations.overview.rows.length} rows`);
    console.log(`   Sectors - Overview: ${sectors.overview.rows.length} rows`);
    
  } catch (error) {
    console.error('❌ Cache update failed:', error);
    process.exit(1);
  }
}

main();
