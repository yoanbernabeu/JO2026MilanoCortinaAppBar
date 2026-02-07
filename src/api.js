const { net } = require('electron');

const BASE_URL = 'https://www.olympics.com';
const LANG = 'FRA';
const CACHE_TTL = 60_000; // 1 minute

const cache = {
  medals: { data: null, timestamp: 0 },
  medallists: { data: null, timestamp: 0 },
  schedule: {} // keyed by date
};

let lastUpdate = null;

function fetchJSON(path) {
  const url = `${BASE_URL}${path}`;
  return new Promise((resolve, reject) => {
    const request = net.request(url);
    let body = '';
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode} pour ${url}`));
        return;
      }
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`JSON invalide pour ${url}`));
        }
      });
    });
    request.on('error', reject);
    request.end();
  });
}

function isCacheValid(entry) {
  return entry && entry.data && (Date.now() - entry.timestamp < CACHE_TTL);
}

async function fetchMedals(force = false) {
  if (!force && isCacheValid(cache.medals)) return cache.medals.data;
  const data = await fetchJSON(`/wmr-owg2026/competition/api/${LANG}/medals`);
  cache.medals = { data, timestamp: Date.now() };
  lastUpdate = new Date();
  return data;
}

async function fetchMedallists(force = false) {
  if (!force && isCacheValid(cache.medallists)) return cache.medallists.data;
  const data = await fetchJSON(`/wmr-owg2026/competition/api/${LANG}/medallists`);
  cache.medallists = { data, timestamp: Date.now() };
  lastUpdate = new Date();
  return data;
}

async function fetchDailySchedule(date, force = false) {
  const key = date;
  if (!force && cache.schedule[key] && isCacheValid(cache.schedule[key])) {
    return cache.schedule[key].data;
  }
  const data = await fetchJSON(`/wmr-owg2026/schedules/api/${LANG}/schedule/lite/day/${date}`);
  cache.schedule[key] = { data, timestamp: Date.now() };
  lastUpdate = new Date();
  return data;
}

async function refreshAll() {
  const results = {};
  try {
    results.medals = await fetchMedals(true);
  } catch (e) {
    console.error('Erreur refresh medals:', e.message);
  }
  try {
    results.medallists = await fetchMedallists(true);
  } catch (e) {
    console.error('Erreur refresh medallists:', e.message);
  }
  lastUpdate = new Date();
  return results;
}

function getLastUpdate() {
  return lastUpdate ? lastUpdate.toISOString() : null;
}

module.exports = { fetchMedals, fetchMedallists, fetchDailySchedule, refreshAll, getLastUpdate };
