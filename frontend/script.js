// Initialize Leaflet Map
// Using a beautiful Dark Theme basemap from CartoDB
const map = L.map('map', {
    zoomControl: false // Customizing zoom position
}).setView([13.0827, 80.2707], 12);

L.control.zoom({
    position: 'bottomright'
}).addTo(map);

// Add Dark Matter Base Map
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; CartoDB',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Variables for Map markers
let currentMarker = null;

// Image Upload UI Interaction
const fileInput = document.getElementById('imageUpload');
const fileWrapper = document.querySelector('.file-upload-wrapper');
const fileIcon = fileWrapper.querySelector('i');
const fileText = fileWrapper.querySelector('span');

fileInput.addEventListener('change', function(e) {
    if (this.files && this.files.length > 0) {
        fileIcon.className = 'fa-solid fa-check-circle';
        fileIcon.style.color = '#10b981';
        fileText.textContent = this.files[0].name;
        fileWrapper.style.borderColor = '#10b981';
    } else {
        fileIcon.className = 'fa-solid fa-cloud-arrow-up';
        fileIcon.style.color = '#3b82f6';
        fileText.textContent = 'Click to browse or drag & drop';
        fileWrapper.style.borderColor = 'rgba(255,255,255,0.1)';
    }
});

// Drag and drop cosmetics
fileWrapper.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileWrapper.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
});

fileWrapper.addEventListener('dragleave', (e) => {
    e.preventDefault();
    fileWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
});

fileWrapper.addEventListener('drop', (e) => {
    e.preventDefault();
    fileWrapper.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
    if(e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        const newEvent = new Event('change');
        fileInput.dispatchEvent(newEvent);
    }
});

// Upload and Analyze Data
async function uploadData() {
    const id = document.getElementById('waterID').value.trim();
    const file = fileInput.files[0];
    
    // Elements
    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('loading-spinner');
    const content = document.getElementById('result-content');
    const analyzeBtnDiv = document.getElementById('analyzeBtn');

    if (!file) {
        alert("Please upload a satellite image to analyze.");
        return;
    }

    // UI Loading State
    resultContainer.classList.remove('hidden');
    spinner.classList.remove('hidden');
    content.innerHTML = '';
    
    // Change Button State
    const originalBtnHTML = analyzeBtnDiv.innerHTML;
    analyzeBtnDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    analyzeBtnDiv.style.opacity = '0.7';
    analyzeBtnDiv.disabled = true;

    // Simulate Network / Preparation (remove if real endpoints are blazing fast)
    // Wait slightly for UI to transition smoothly
    await new Promise(r => setTimeout(r, 600));

    try {
        const formData = new FormData();
        formData.append("file", file);

        // Making real API call to the FastAPI Backend
        const res = await fetch(`http://127.0.0.1:8000/predict`, { 
            method: 'POST', 
            body: formData 
        });

        if (!res.ok) throw new Error("API request failed");

        const data = await res.json();
        
        // Hide Spinner, Show Result UI
        spinner.classList.add('hidden');
        
        let severity = "Safe";
        let severityColor = "#10b981"; // green
        let pixels = data.water_pixels;
        
        // Encroachment visual logic based on arbitrary threshold 
        // Note: Change 5000 based on actual output sizes
        if (pixels < 1000) {
            severity = "Critical Danger";
            severityColor = "#ef4444"; // red
        } else if (pixels < 5000) {
            severity = "Moderate Warning";
            severityColor = "#f59e0b"; // orange
        }

        // Render sleek result markup
        content.innerHTML = `
            <div class="result-header" style="color: ${severityColor}">
                <i class="fa-solid fa-shield-halved"></i> Analysis Complete
            </div>
            
            <div style="margin-top: 15px;">
                <div class="result-item">
                    <span class="result-label">Analyzed ID</span>
                    <span class="result-val">${id ? id : 'Unknown Base'}</span>
                </div>
                
                <div class="result-item">
                    <span class="result-label">Detection Status</span>
                    <span class="result-val" style="color: ${severityColor};">${severity}</span>
                </div>

                <div class="result-item">
                    <span class="result-label">Detected Water Pixels</span>
                    <span class="result-val">${pixels.toLocaleString()}px</span>
                </div>
            </div>
        `;

        // Add a pulsing marker to the map (Simulated Location for Visual)
        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        // Custom interactive marker icon
        const pinIcon = L.divIcon({
            className: 'custom-pin',
            html: `<i class="fa-solid fa-location-dot fa-2x" style="color: ${severityColor}; filter: drop-shadow(0 0 10px ${severityColor});"></i>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        // Add to abstract point on map (Chennai Area offset)
        const lat = 13.0827 + (Math.random() - 0.5) * 0.1;
        const lng = 80.2707 + (Math.random() - 0.5) * 0.1;

        currentMarker = L.marker([lat, lng], {icon: pinIcon}).addTo(map);
        
        // Smoothly fly to the detected region
        map.flyTo([lat, lng], 14, {
            duration: 1.5,
            easeLinearity: 0.25
        });

    } catch (error) {
        // Handle Error beautifully
        spinner.classList.add('hidden');
        content.innerHTML = `
            <div class="result-header" style="color: #ef4444">
                <i class="fa-solid fa-circle-exclamation"></i> Analysis Failed
            </div>
            <p style="margin-top: 10px; font-size: 0.85rem; color: #94a3b8;">
                ${error.message}. Make sure your FastAPI backend is running!
            </p>
        `;
    } finally {
        analyzeBtnDiv.innerHTML = originalBtnHTML;
        analyzeBtnDiv.style.opacity = '1';
        analyzeBtnDiv.disabled = false;
    }
}