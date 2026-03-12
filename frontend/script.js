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

// ========== LANDING PAGE FUNCTIONALITY ==========

// Initialize Landing Page Map
function initializeLandingMap() {
    const landingMapElement = document.getElementById('landing-map');
    
    // Only initialize if landing map exists
    if (!landingMapElement) return;

    const landingMap = L.map('landing-map', {
        zoomControl: false
    }).setView([13.0827, 80.2707], 11);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(landingMap);

    // Add Dark Matter Base Map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(landingMap);

    // Sample Water Body Data
    const waterBodies = [
        {
            name: 'Chembarambakkam Lake',
            lat: 12.9716,
            lng: 79.8865,
            status: 'Protected',
            color: '#3b82f6',
            complaints: 3,
            encroachments: 1
        },
        {
            name: 'Puzhal Lake',
            lat: 13.1788,
            lng: 80.0814,
            status: 'Protected',
            color: '#3b82f6',
            complaints: 5,
            encroachments: 2
        },
        {
            name: 'Cooum River',
            lat: 13.0827,
            lng: 80.2707,
            status: 'Encroachment Detected',
            color: '#ef4444',
            complaints: 12,
            encroachments: 4
        },
        {
            name: 'Kosasthalaiyar River',
            lat: 13.2162,
            lng: 80.1238,
            status: 'Protected',
            color: '#3b82f6',
            complaints: 2,
            encroachments: 0
        },
        {
            name: 'Buckingham Canal',
            lat: 13.1234,
            lng: 80.1856,
            status: 'Resolved',
            color: '#10b981',
            complaints: 8,
            encroachments: 0
        },
        {
            name: 'Batlagundu Tank',
            lat: 13.0234,
            lng: 80.3456,
            status: 'Protected',
            color: '#3b82f6',
            complaints: 1,
            encroachments: 0
        }
    ];

    // Add markers for each water body
    waterBodies.forEach(waterbody => {
        const iconColor = waterbody.color;
        
        const waterIcon = L.divIcon({
            className: 'water-body-marker',
            html: `<div style="
                width: 40px;
                height: 40px;
                background: ${iconColor};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 15px ${iconColor}, 0 0 30px rgba(0,0,0,0.5);
                border: 2px solid rgba(255,255,255,0.3);
            ">
                <i class="fa-solid fa-water" style="color: white; font-size: 1.2rem;"></i>
            </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([waterbody.lat, waterbody.lng], {
            icon: waterIcon
        }).addTo(landingMap);

        // Popup with information
        const popupContent = `
            <div style="
                color: #f8fafc;
                font-family: 'Inter', sans-serif;
                min-width: 250px;
            ">
                <h4 style="
                    margin: 0 0 0.75rem 0;
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #60a5fa;
                ">${waterbody.name}</h4>
                
                <div style="
                    background: rgba(255,255,255,0.05);
                    padding: 1rem;
                    border-radius: 8px;
                    margin: 0.75rem 0;
                ">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #94a3b8;">Status:</span>
                        <span style="
                            color: ${waterbody.color};
                            font-weight: 600;
                        ">${waterbody.status}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span style="color: #94a3b8;">Complaints:</span>
                        <span style="color: #f8fafc; font-weight: 600;">${waterbody.complaints}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: #94a3b8;">Encroachments:</span>
                        <span style="color: #f8fafc; font-weight: 600;">${waterbody.encroachments}</span>
                    </div>
                </div>
                
                <a href="citizen.html" style="
                    display: inline-block;
                    width: 100%;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: white;
                    text-align: center;
                    padding: 0.65rem;
                    border-radius: 6px;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.9rem;
                    margin-top: 0.75rem;
                    transition: all 0.3s ease;
                    border: none;
                    cursor: pointer;
                ">Report Issue</a>
            </div>
        `;

        marker.bindPopup(popupContent);

        // Add hover effect
        marker.on('mouseover', function() {
            this.openPopup();
        });
    });
}

// Navigate to map functionality
function navigateToMap() {
    // Scroll to map preview section
    const mapSection = document.querySelector('.map-preview-section');
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Stats counter animation
function animateStats() {
    const animate = (element, target) => {
        let current = 0;
        const increment = target / 50;
        const interval = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(interval);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 30);
    };

    const waterBodiesEl = document.getElementById('stat-water-bodies');
    const complaintsEl = document.getElementById('stat-complaints');
    const resolvedEl = document.getElementById('stat-resolved');
    const citizensEl = document.getElementById('stat-citizens');

    if (waterBodiesEl) animate(waterBodiesEl, 1245);
    if (complaintsEl) animate(complaintsEl, 8392);
    if (resolvedEl) animate(resolvedEl, 3156);
    if (citizensEl) animate(citizensEl, 45230);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the landing page
    if (document.querySelector('.landing-page')) {
        document.body.classList.add('landing-mode');
        
        // Initialize landing map
        initializeLandingMap();
        
        // Animate stats when they come into view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        const statsSection = document.querySelector('.stats-section');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }
    // Dashboard initialization (existing code will still work)
    else if (document.getElementById('map')) {
        document.body.classList.add('dashboard-mode');
        // Map is already initialized at the top of the script
    }
});