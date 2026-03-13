let map, currentMarker = null;

function initDashboardMap() {
    const mapElement = document.getElementById('map');
    if (!mapElement || mapElement._leaflet_id) return;

    map = L.map(mapElement, {
        zoomControl: false 
    }).setView([13.0827, 80.2707], 12);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
}

function initFileUpload() {
    const fileInput = document.getElementById('imageUpload');
    const fileWrapper = document.querySelector('.file-upload-wrapper');
    if (!fileInput || !fileWrapper) return;
    
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
}

async function uploadData() {
    const id = document.getElementById('waterID').value.trim();
    const fileInput = document.getElementById('imageUpload'); 
    const file = fileInput.files[0];
    
    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('loading-spinner');
    const content = document.getElementById('result-content');
    const analyzeBtnDiv = document.getElementById('analyzeBtn');

    if (!file) {
        alert("Please upload a satellite image to analyze.");
        return;
    }

    resultContainer.classList.remove('hidden');
    spinner.classList.remove('hidden');
    content.innerHTML = '';
    
    const originalBtnHTML = analyzeBtnDiv.innerHTML;
    analyzeBtnDiv.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';
    analyzeBtnDiv.style.opacity = '0.7';
    analyzeBtnDiv.disabled = true;

    await new Promise(r => setTimeout(r, 600));

    try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/predict`, { 
            method: 'POST', 
            body: formData 
        });

        if (!res.ok) throw new Error("API request failed");

        const data = await res.json();
        
        spinner.classList.add('hidden');
        
        let severity = "Safe";
        let severityColor = "#10b981"; 
        let pixels = data.water_pixels;
        
        if (pixels < 1000) {
            severity = "Critical Danger";
            severityColor = "#ef4444"; 
        } else if (pixels < 5000) {
            severity = "Moderate Warning";
            severityColor = "#f59e0b"; 
        }

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

        if (currentMarker) {
            map.removeLayer(currentMarker);
        }
        
        const pinIcon = L.divIcon({
            className: 'custom-pin',
            html: `<i class="fa-solid fa-location-dot fa-2x" style="color: ${severityColor}; filter: drop-shadow(0 0 10px ${severityColor});"></i>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        const lat = 13.0827 + (Math.random() - 0.5) * 0.1;
        const lng = 80.2707 + (Math.random() - 0.5) * 0.1;

        currentMarker = L.marker([lat, lng], {icon: pinIcon}).addTo(map);
        
        map.flyTo([lat, lng], 14, {
            duration: 1.5,
            easeLinearity: 0.25
        });

    } catch (error) {
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

function initializeLandingMap() {
    const landingMapElement = document.getElementById('landing-map');
    
    if (!landingMapElement || landingMapElement._leaflet_id) return;

    const landingMap = L.map(landingMapElement, {
        zoomControl: false
    }).setView([13.0827, 80.2707], 11);

    L.control.zoom({
        position: 'bottomright'
    }).addTo(landingMap);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; CartoDB',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(landingMap);

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
    });
}

function navigateToMap() {
    const mapSection = document.querySelector('.map-preview-section');
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function fetchAndAnimateStats() {
    try {
        const response = await fetch('/stats');
        const data = await response.json();
        
        const waterBodiesEl = document.getElementById('totalWaterBodies');
        const complaintsEl = document.getElementById('totalComplaints');
        const resolvedEl = document.getElementById('resolvedCases');

        const animate = (element, target) => {
            if (!element) return;
            let current = 0;
            const increment = Math.max(1, target / 50);
            const interval = setInterval(() => {
                current += increment;
                if (current >= target) {
                    element.textContent = Math.round(target).toLocaleString();
                    clearInterval(interval);
                } else {
                    element.textContent = Math.floor(current).toLocaleString();
                }
            }, 30);
        };

        if (waterBodiesEl) animate(waterBodiesEl, data.total_water_bodies);
        if (complaintsEl) animate(complaintsEl, data.total_complaints);
        if (resolvedEl) animate(resolvedEl, data.resolved_cases);
        
    } catch (error) {
        console.error('Error fetching dynamic stats:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (typeof L === 'undefined') {
        console.error('Leaflet.js not loaded. Please check your internet connection or script tags.');
        return;
    }

    if (document.body.classList.contains('landing-mode')) {
        setTimeout(() => {
            if (document.getElementById('landing-map')) {
                initializeLandingMap();
            }
        }, 100);
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    fetchAndAnimateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        const statsSection = document.getElementById('stats');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }
    
    if (document.getElementById('map')) {
        document.body.classList.add('dashboard-mode');
        setTimeout(() => {
            initDashboardMap();
            initFileUpload();
        }, 100);
    }
});