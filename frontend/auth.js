(function() {
    window.logoutUser = function(e) {
        if (e) e.preventDefault();
        localStorage.clear();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 50);
    };

    const userId = localStorage.getItem('user_id');
    const role = localStorage.getItem('role');
    const path = window.location.pathname;
    let page = path.split("/").pop();
    if (page === "" || page === "/") page = "index.html";


    const protectedPages = ['admin.html', 'officer.html', 'citizen.html', 'analytics.html', 'complaint-tracking.html'];
    const roleSpecific = {
        'admin.html': 'admin',
        'officer.html': 'officer',
        'citizen.html': 'citizen'
    };

    if ((page === 'login.html' || page === 'index.html') && userId && role) {
        // If logged in, maybe don't redirect from index, but definitely from login
        if (page === 'login.html') {
            if (role === 'admin') window.location.href = 'admin.html';
            else if (role === 'officer') window.location.href = 'officer.html';
            else window.location.href = 'citizen.html';
            return;
        }
    }

    if (protectedPages.includes(page)) {
        if (!userId || !role) {
            window.location.href = 'login.html';
        } else if (roleSpecific[page] && role !== roleSpecific[page]) {
            // Redirect to correct dashboard if trying to access wrong one
            if (role === 'admin') window.location.href = 'admin.html';
            else if (role === 'officer') window.location.href = 'officer.html';
            else window.location.href = 'citizen.html';
        }
    }

    // Dynamic header adjustment
    window.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.querySelector('.login-btn');
        if (loginBtn && userId && role) {
            loginBtn.innerText = 'Dashboard';
            if (role === 'admin') loginBtn.href = 'admin.html';
            else if (role === 'officer') loginBtn.href = 'officer.html';
            else loginBtn.href = 'citizen.html';

            // Add Logout if not present
            const nav = document.querySelector('.header-nav');
            if (nav && !document.querySelector('.logout-link')) {
                const logout = document.createElement('a');
                logout.href = '#';
                logout.className = 'nav-link logout-link';
                logout.innerText = 'Logout';
                logout.style.color = 'var(--accent-danger)';
                logout.onclick = window.logoutUser;
                nav.appendChild(logout);
            }
        }
    });
})();
