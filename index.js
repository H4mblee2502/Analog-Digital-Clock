// =========================================================================
// 1. STATE MANAGEMENT & DICTIONARY LOOKUP MAP
// =========================================================================
const timeZone = Intl.supportedValuesOf('timeZone');
const cities = {};

timeZone.forEach(e => {
    const string = e.split('/');
    const city = string[string.length - 1];
    const convertString = city.toLowerCase().replace(/_/g, ' ');
    cities[convertString] = e; 
});

cities['sweden'] = 'Europe/Stockholm';
cities['philippines'] = 'Asia/Manila';
cities['japan'] = 'Asia/Tokyo';
cities['london'] = 'Europe/London';
cities['manila'] = 'Asia/Manila';

const daylightDatabase = {
    'manila': { icon: '☀️', start: '05:43', end: '17:31', length: '11h 48m' },
    'london': { icon: '⛅', start: '07:12', end: '17:17', length: '10h 05m' },
    'new york': { icon: '☀️', start: '07:05', end: '18:12', length: '11h 07m' },
    'tokyo': { icon: '☀️', start: '05:48', end: '17:02', length: '11h 14m' },
    'stockholm': { icon: '❄️', start: '07:34', end: '17:42', length: '10h 08m' },
    'sweden': { icon: '❄️', start: '07:34', end: '17:42', length: '10h 08m' },
    'japan': { icon: '☀️', start: '05:48', end: '17:02', length: '11h 14m' }
};

// --- PRESET COLLECTION FOR OTHER CITIES GRID AREA ---
const extraCitiesList = [
    { name: 'Manila', zone: 'Asia/Manila', offset: 'UTC+8', key: 'manila' },
    { name: 'Japan', zone: 'Asia/Tokyo', offset: 'UTC+9', key: 'japan' },
    { name: 'Sweden', zone: 'Europe/Stockholm', offset: 'UTC+2', key: 'sweden' },
    { name: 'London', zone: 'Europe/London', offset: 'UTC+1', key: 'london' }
];

// =========================================================================
// 2. LIVE CLOCK, DATE & SUB-CARDS ENGINE
// =========================================================================
let activeTimeZone = null;
let activeCityKey = 'manila'; 
let clockIntervalId = null;
let use12HourFormat = true; 

function renderLiveTime() {
    const timeDisplay = document.getElementById('timeDisplay'); 
    const dateDisplay = document.getElementById('date-time');
    const daylightDisplay = document.getElementById('daylight-time');
    
    if (!timeDisplay) return;

    if (!activeTimeZone) {
        timeDisplay.textContent = '--:--:--';
        return;
    }

    try {
        const now = new Date();

        // 1. Update Main Display Header Clock
        timeDisplay.textContent = new Intl.DateTimeFormat('en-US', {
            timeZone: activeTimeZone,
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: use12HourFormat
        }).format(now);

        // 2. Update Long Calendar Line
        if (dateDisplay) {
            dateDisplay.textContent = new Intl.DateTimeFormat('en-US', {
                timeZone: activeTimeZone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }).format(now);
        }

        // 3. Update Solar Info Text Block
        if (daylightDisplay) {
            const cleanKey = activeCityKey.toLowerCase().trim();
            if (daylightDatabase[cleanKey]) {
                const info = daylightDatabase[cleanKey];
                daylightDisplay.textContent = `Sun ${info.icon}: ${info.start} - ${info.end} (${info.length})`;
            } else {
                daylightDisplay.textContent = `Sun ☀️: 06:00 - 18:00 (12h 00m)`;
            }
        }

        // 4. Update the card subgrid elements cleanly
        renderExtraCityCards(now);

    } catch (error) {
        console.error("Invalid time zone alignment:", error);
        timeDisplay.textContent = 'Error';
    }
}

function renderExtraCityCards(currentTime) {
    const gridContainer = document.getElementById('randomCities');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    extraCitiesList.forEach(city => {
        const timeStr = new Intl.DateTimeFormat('en-US', {
            timeZone: city.zone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: use12HourFormat
        }).format(currentTime);

        const localizedHour = parseInt(new Intl.DateTimeFormat('en-US', {
            timeZone: city.zone, hour: 'numeric', hour12: false
        }).format(currentTime));
        
        const isDaytime = localizedHour >= 6 && localizedHour < 18;
        const statusText = isDaytime ? '☀️ Day' : '🌙 Night';

        // Check if this card matches the active input selection key
        const isCurrentlyActive = (city.key === activeCityKey);

        const card = document.createElement('div');
        // If it matches, give it the dark background theme class
        card.className = `city-card ${isCurrentlyActive ? 'dark-theme' : ''}`;
        
        card.innerHTML = `
            <div class="card-header">
                <span class="card-name">${city.name}</span>
                <span class="card-offset">${city.offset}</span>
            </div>
            <div class="card-time">${timeStr}</div>
            <div class="card-status">${statusText}</div>
        `;

        gridContainer.appendChild(card);
    });
}

function startClockEngine(cityKey, ianaZoneString) {
    activeCityKey = cityKey; 
    activeTimeZone = ianaZoneString;
    
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
    }
    
    renderLiveTime(); 
    clockIntervalId = setInterval(renderLiveTime, 1000);
}

// =========================================================================
// 3. SEARCH INPUT VALUE & SUGGESTIONS FILTER
// =========================================================================
function updateSuggestions(inputString, inputElement) {
    const search = inputString.trim().toLowerCase();
    const suggestionList = document.getElementById('suggestion');
    const title = document.getElementById('currentCityTitle');
    
    suggestionList.innerHTML = ''; 

    if (search.length === 0) {
        suggestionList.style.display = 'none';
        return;
    }

    const matchedCities = Object.keys(cities).filter(cityKey => 
        cityKey.includes(search)
    );

    if (matchedCities.length > 0) {
        matchedCities.forEach(cityKey => {
            const li = document.createElement('li');
            li.textContent = cityKey.replace(/\b\w/g, c => c.toUpperCase());
            
            li.addEventListener('click', () => {
                const cityName = li.textContent;
                
                inputElement.value = cityName;         
                if (title) title.textContent = cityName; 
                
                suggestionList.style.display = 'none'; 

                const targetKey = cityKey; 
                if (cities[targetKey]) {
                    startClockEngine(targetKey, cities[targetKey]); 
                }
            });

            suggestionList.appendChild(li);
        });
        suggestionList.style.display = 'block';
    } else {
        suggestionList.style.display = 'none';
    }
}

// =========================================================================
// 4. COMPONENT INITIALIZERS (SEARCH BAR & HOURLY TOGGLES)
// =========================================================================
function initSearchBar() {
    const inputElement = document.getElementById('search-value');
    const suggestionList = document.getElementById('suggestion');
    
    if (!inputElement || !suggestionList) return;

    inputElement.addEventListener('input', (e) => {
        const query = e.target.value;
        updateSuggestions(query, inputElement); 
    });

    document.addEventListener('click', (e) => {
        if (!inputElement.contains(e.target) && !suggestionList.contains(e.target)) {
            suggestionList.style.display = 'none';
        }
    });
}

function initFormatToggles() {
    const btn12 = document.getElementById('btn-12hr');
    const btn24 = document.getElementById('btn-24hr');

    if (!btn12 || !btn24) return;

    btn12.addEventListener('click', () => {
        use12HourFormat = true;
        btn12.classList.add('active');
        btn24.classList.remove('active');
        renderLiveTime(); 
    });

    btn24.addEventListener('click', () => {
        use12HourFormat = false;
        btn24.classList.add('active');
        btn12.classList.remove('active');
        renderLiveTime(); 
    });
}

// =========================================================================
// 5. APPLICATION INITIALIZATION
// =========================================================================
function setDefaultCity() {
    const title = document.getElementById('currentCityTitle');
    
    if (cities['manila']) {
        if (title) title.textContent = "Manila"; 
        startClockEngine('manila', cities['manila']);     
    }
    
    renderExtraCityCards(new Date());
}

// Main execution process on script load
initSearchBar();
initFormatToggles();
setDefaultCity();
