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
    
    // Round to 4 decimal places
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

function loadTable(){
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvData = e.target.result;
            // Papa is now globally available, no require needed
            const data = Papa.parse(csvData, { header: true });
            const locations = data.data.map(row => {
                return {
                    title: row.title,
                    location: parseCoordinates(row.geolocation)
                };
            });
            console.log(locations);
            localStorage.setItem('locations', JSON.stringify(locations));
        };
        reader.readAsText(file);
    });
    input.click();
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
        `;
        locations.appendChild(row);
    });
}


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function findClosestLocation(userLat, userLng) {
    let closestDistance = Infinity;
    let closestLocation = null;

    getLocations().forEach(loc => {
        const distance = calculateDistance(
            userLat, 
            userLng, 
            loc.location.lat, 
            loc.location.lng
        );
        if (distance < closestDistance) {
            closestDistance = distance;
            closestLocation = loc;
        }
    });

    return closestLocation;
}

function fillResTableWithData(dataList){
    const resTableBody = document.getElementById('restablebody');
    // clear existing rows
    while (resTableBody.firstChild) {
        resTableBody.removeChild(resTableBody.firstChild);
    }

    // create new rows
    dataList.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="border: 1px solid #ccc; padding: 8px;">${data.distance}</td>
            <td style="border: 1px solid #ccc; padding: 8px;">${data.title}</td>
            <td style="border: 1px solid #ccc; padding: 8px;">${data.code}</td>
        `;
        resTableBody.appendChild(row);
    });
}

function fillTable(){
    const sampleList = [
        {distance: 0.5, title: 'Test1', code: '123'},
        {distance: 1.5, title: 'Test2', code: '456'},
        {distance: 2.5, title: 'Test3', code: '789'},
    ];
    fillResTableWithData(sampleList);

}
