function parseCoordinates(locationString) {
    console.log(locationString);

    // Regular expression to match the lat,lng format
    const regex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
    
    // Extract components using regex
    const matches = locationString.match(regex);
    if (!matches) {
        
        throw new Error('Invalid coordinate format');
    }
    
    // Parse latitude
    const lat = parseFloat(matches[1]);
    
    // Parse longitude
    const lng = parseFloat(matches[3]);
    
    return {
        lat: Number(lat),
        lng: Number(lng)
    };
}


function getLocations() {
    const locations = JSON.parse(localStorage.getItem('locations'));
    if (locations === null) {
        return [
            { title: "Eiffel Tower", location: { lat: 48.8584, lng: 2.2945 } , code : "a" },
            { title: "Statue of Liberty", location : { lat: 40.6892, lng: -74.0445, code : "b" } }
    ]
    }
    return locations;
}

function parseAndStoreLocations(csvData) {
    const data = Papa.parse(csvData, { header: true });
    const locations = data.data.map(row => {
        return {
            title: row.title,
            location: parseCoordinates(row.geolocation),
            code: row.code
        };
    });
    console.log(locations);
    localStorage.setItem('locations', JSON.stringify(locations));
}

function loadTable(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvData = e.target.result;
            parseAndStoreLocations(csvData)
        };
        reader.readAsText(file);
    });
    input.click();
}

function httpGetCSVXHR(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                const csvText = xhr.responseText;
                resolve(csvText);
            } else {
                reject(new Error(`HTTP error! status: ${xhr.status}`));
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Network error'));
        };
        
        xhr.send();
    });
}

function DowloadLocations(url){

    console.log("downloading from " + url);
    httpGetCSVXHR(url).then(data => {
        console.log(data);
        parseAndStoreLocations(data);
        alert("Successfully downloaded from " + url);
        CloseModal();
    }).catch(error => {
        console.error(error);
        alert("error downloading fron " + url + ": " + error);
        CloseModal();
    });
    
}

function showLocations() {
    // Remove existing popup if any
    const existingPopup = document.querySelector('.popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }

    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <h2>Locations</h2>
        <table>
            <thead>
                <tr>
                    <th>Title</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>code</th>
                </tr>
            </thead>
            <tbody id="locations">
            </tbody>
        </table>
    `;
    document.body.appendChild(popup);

    const locations = document.getElementById('locations');
    getLocations().forEach(location => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${location.title}</td>
            <td>${location.location.lat}</td>
            <td>${location.location.lng}</td>
            <td>${location.code}</td>
        `;
        locations.appendChild(row);
    });
}


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 * 1000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}



function toMeterString(meters) {
    return `${Math.round(meters)}m`;

}

function clearTableBody(){
    const resTableBody = document.getElementById('restablebody');
    // clear existing rows
    while (resTableBody.firstChild) {
        resTableBody.removeChild(resTableBody.firstChild);
    }

    const myLocationHeader = document.getElementById('mylocation');
    myLocationHeader.textContent = "Calculating my location...";
}

function fillResTableWithData(dataList){
    const resTableBody = document.getElementById('restablebody');
    clearTableBody();

    // create new rows
    dataList.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="border: 1px solid #ccc; padding: 8px;">${toMeterString(data.distance)}</td>
            <td style="border: 1px solid #ccc; padding: 8px;">${data.title}</td>
            <td style="border: 1px solid #ccc; padding: 8px;">${data.code}</td>
        `;
        resTableBody.appendChild(row);
    });
}

function fillTableImpl(userLat, userLng){

    locs = getLocations();

    const dataList = locs.map(loc => {
        const distance = calculateDistance(
            userLat, 
            userLng, 
            loc.location.lat, 
            loc.location.lng
        );
        return {distance, title: loc.title, code: loc.code};
    });

    dataListSorted = dataList.sort((a, b) => a.distance - b.distance);
    fillResTableWithData(dataList);
}

function HandlePosition(position) {
    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;
    
    fillTableImpl(userLat, userLng);
    document.getElementById('status').style.display = 'none';

    const myLocationHeader = document.getElementById('mylocation');
    myLocationHeader.textContent = `My Location: Latitude ${userLat}, Longitude ${userLng}`;
}

function fillTable(){
    console.log('fillTable');
    document.getElementById('status').style.display = 'block';
    clearTableBody();
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            HandlePosition,
            function(error) {
                document.getElementById('status').innerHTML = 
                    `<div class="error">Error getting location: ${error.message}</div>`;
            }
        );
    } else {
        document.getElementById('status').innerHTML = 
            '<div class="error">Geolocation is not supported by your browser</div>';
    }    
}

function IsWatch(){
    const defaultValue = true;
    const urlParams = new URLSearchParams(window.location.search);
    const hasWatchParam = urlParams.get('watch');
    let hasWatch;
    try {
        hasWatch = hasWatchParam === null ? defaultValue : JSON.parse(hasWatchParam);
    } catch (e) {
        hasWatch = defaultValue;
    }
    console.log(hasWatch);
    return hasWatch;
}

function RefreshTable(){
    console.log('RefreshTable');
    if(IsWatch){
        console.log('watch - no refresh');
        return;
    }
    fillTable();
}

function StartWatch(){
    console.log('StartWatch');
    if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
            HandlePosition,
            function(error) {
                document.getElementById('status').innerHTML = 
                    `<div class="error">Error getting location: ${error.message}</div>`;
            },
             { enableHighAccuracy: true, maximumAge: 2000, timeout: 1000 }
        );
    } else {
        document.getElementById('status').innerHTML = 
            '<div class="error">Geolocation is not supported by your browser</div>';
    }   
}


function InitializeStuff(){
    console.log('InitializeStuff');
    if (IsWatch()){
        console.log('watch');
        StartWatch();
        document.getElementById('refreshButton').style.display = 'none';
    }else{
        console.log('no watch');
        fillTable();
    }
}

function CloseModal() {
    document.getElementById('modal').close();
}



function OpenModal() {
    modal = document.getElementById('modal');
    document.getElementById('modal').showModal();

    // Close modal when clicking outside
    if (!modal.hasAttribute('data-listened')) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                CloseModal();
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.open) {
                CloseModal();
            }
        });
        modal.setAttribute('data-listened', '');
    } 
}

function DownloadClicked() {
    const url = document.getElementById('urlDownloadInput').value;
    if (url) {
        console.log(`Downloading file from URL: ${url}`);
        DowloadLocations(url);
    } else {
        alert("No URL provided.");
    }
}
