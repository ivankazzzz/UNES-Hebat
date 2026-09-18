// UNES Modern Corporate Attendance System - Interactive Features

// Initialize clock updates
function updateClocks() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    document.getElementById('time1').textContent = timeString;
    document.getElementById('time2').textContent = timeString;
    document.getElementById('time3').textContent = timeString;
}

// Update clocks every second
setInterval(updateClocks, 1000);
updateClocks();

// Toast notification system
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toastMessage.textContent = message;
    
    // Set background color based on type
    if (type === 'success') {
        toast.style.background = '#4caf50';
    } else if (type === 'warning') {
        toast.style.background = '#ffc107';
    } else if (type === 'error') {
        toast.style.background = '#f44336';
    }
    
    // Show toast
    toast.classList.remove('translate-x-full');
    toast.classList.add('translate-x-0');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
    }, 3000);
}

// Handle Check In
function handleCheckIn() {
    // Simulate camera capture and processing
    const button = event.target.closest('button');
    const originalContent = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<div class="spinner"></div> <span>Memproses...</span>';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
        
        // Update summary
        updateTodaySummary('08:15', '--:--', '0h');
        
        // Show success message
        showToast('Absen masuk berhasil! Selamat bekerja.', 'success');
        
        // Add haptic feedback simulation
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }, 2000);
}

// Handle Check Out
function handleCheckOut() {
    const button = event.target.closest('button');
    const originalContent = button.innerHTML;
    
    // Show loading state
    button.innerHTML = '<div class="spinner"></div> <span>Memproses...</span>';
    button.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
        
        // Update summary with actual times
        const now = new Date();
        const checkOutTime = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        updateTodaySummary('08:15', checkOutTime, '9j 15m');
        
        // Show success message
        showToast('Absen pulang berhasil! Hati-hati di jalan.', 'success');
        
        // Add haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }, 2000);
}

// Update today's summary
function updateTodaySummary(checkIn, checkOut, totalHours) {
    const summaryElements = document.querySelectorAll('.grid.grid-cols-3.gap-3.text-center p.text-2xl');
    if (summaryElements.length >= 3) {
        summaryElements[0].textContent = checkIn;
        summaryElements[1].textContent = checkOut;
        summaryElements[2].textContent = totalHours;
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
        showToast('Anda telah keluar dari sistem', 'success');
        
        // Simulate logout redirect
        setTimeout(() => {
            // In real app, redirect to login page
            console.log('Redirecting to login...');
        }, 1500);
    }
}

// Tab Navigation
function switchTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.nav-item').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to selected tab
    event.target.closest('.nav-item').classList.add('active');
    
    // Show toast for demo
    showToast(`Beralih ke ${tabName}`, 'success');
}

// Filter functionality
function applyFilters() {
    const monthSelect = document.querySelector('select');
    const statusSelect = document.querySelectorAll('select')[1];
    
    if (monthSelect && statusSelect) {
        const month = monthSelect.value;
        const status = statusSelect.value;
        
        showToast(`Filter diterapkan: ${month}, ${status}`, 'success');
        
        // Simulate loading
        const historyList = document.querySelector('.overflow-y-auto');
        historyList.style.opacity = '0.5';
        
        setTimeout(() => {
            historyList.style.opacity = '1';
        }, 500);
    }
}

// Add click handlers to filter selects
document.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', applyFilters);
});

// Bottom navigation handlers
document.querySelectorAll('.absolute.bottom-0 button').forEach(button => {
    button.addEventListener('click', function() {
        // Remove active state from all buttons
        this.parentElement.querySelectorAll('button').forEach(btn => {
            btn.classList.remove('corporate-blue');
            btn.classList.add('text-gray-400');
        });
        
        // Add active state to clicked button
        this.classList.remove('text-gray-400');
        this.classList.add('corporate-blue');
        
        // Get the tab name
        const tabName = this.querySelector('span').textContent;
        showToast(`Beralih ke ${tabName}`, 'success');
    });
});

// Simulate real-time location check
function checkLocation() {
    const locationStatus = document.querySelector('.bg-green-50');
    if (locationStatus) {
        // Randomly simulate location status changes
        setInterval(() => {
            const isInRadius = Math.random() > 0.1; // 90% chance of being in radius
            
            if (isInRadius) {
                locationStatus.className = 'bg-green-50 border border-green-200 rounded-xl p-4 mb-6';
                locationStatus.querySelector('p:last-child').innerHTML = '✓ Dalam radius kampus';
                locationStatus.querySelector('.w-10').className = 'w-10 h-10 bg-status-success rounded-full flex items-center justify-center';
            } else {
                locationStatus.className = 'bg-red-50 border border-red-200 rounded-xl p-4 mb-6';
                locationStatus.querySelector('p:last-child').innerHTML = '✗ Diluar radius kampus';
                locationStatus.querySelector('.w-10').className = 'w-10 h-10 bg-status-error rounded-full flex items-center justify-center';
            }
        }, 10000); // Check every 10 seconds
    }
}

// Initialize location checking
checkLocation();

// Camera flip functionality
function flipCamera() {
    showToast('Mengalihkan kamera...', 'success');
    
    // Simulate camera flip with animation
    const cameraPreview = document.querySelector('.bg-gray-900');
    if (cameraPreview) {
        cameraPreview.style.transform = 'rotateY(180deg)';
        cameraPreview.style.transition = 'transform 0.5s ease';
        
        setTimeout(() => {
            cameraPreview.style.transform = 'rotateY(0deg)';
        }, 500);
    }
}

// Add click handler to camera flip button
document.querySelector('.fa-sync-alt')?.parentElement.addEventListener('click', flipCamera);

// Notification badge animation
function animateNotificationBadge() {
    const badge = document.querySelector('.pulse-dot');
    if (badge) {
        setInterval(() => {
            badge.style.display = badge.style.display === 'none' ? 'block' : 'none';
        }, 3000);
    }
}

animateNotificationBadge();

// Profile photo upload simulation
function uploadPhoto() {
    showToast('Membuka galeri foto...', 'success');
    
    // Simulate file selection
    setTimeout(() => {
        const profileImg = document.querySelector('.w-24.h-24.rounded-full');
        if (profileImg) {
            profileImg.style.transform = 'scale(0.9)';
            profileImg.style.transition = 'transform 0.3s ease';
            
            setTimeout(() => {
                profileImg.style.transform = 'scale(1)';
                showToast('Foto profil berhasil diperbarui!', 'success');
            }, 300);
        }
    }, 1000);
}

// Add click handler to profile photo button
document.querySelector('.fa-camera')?.parentElement.addEventListener('click', uploadPhoto);

// Initialize page with entrance animations
document.addEventListener('DOMContentLoaded', () => {
    // Add staggered animations to cards
    const cards = document.querySelectorAll('.bg-white.rounded-xl');
    cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Show welcome toast
    setTimeout(() => {
        showToast('Selamat datang di Sistem Absensi UNES', 'success');
    }, 1000);
});

// Handle pull-to-refresh simulation
let startY = 0;
let isPulling = false;

document.addEventListener('touchstart', (e) => {
    if (window.scrollY === 0) {
        startY = e.touches[0].pageY;
        isPulling = true;
    }
});

document.addEventListener('touchmove', (e) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].pageY;
    const diff = currentY - startY;
    
    if (diff > 100) {
        // Trigger refresh
        showToast('Memperbarui data...', 'success');
        isPulling = false;
        
        // Simulate data refresh
        setTimeout(() => {
            showToast('Data diperbarui', 'success');
        }, 1500);
    }
});

document.addEventListener('touchend', () => {
    isPulling = false;
});
