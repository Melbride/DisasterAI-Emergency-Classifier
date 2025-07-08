// Global variables
let classificationHistory = [];
let currentChart = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateAnalytics();
});

function initializeApp() {
    // Navigation for page switching
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            showPage(targetPage);
        });
    });

    // Threshold slider
    const thresholdSlider = document.getElementById('threshold-slider');
    const thresholdValue = document.getElementById('threshold-value');
    
    thresholdSlider.addEventListener('input', function() {
        thresholdValue.textContent = this.value;
    });

    // Auto-resize textarea
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
}

function setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            classifyMessage();
        }
        if (e.key === 'Escape') {
            clearInput();
        }
    });

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-section').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

function scrollToSection(sectionId) {
    showPage(sectionId);
}

function setExample(message) {
    const messageInput = document.getElementById('message-input');
    messageInput.value = message;
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
    
    // Add visual feedback
    messageInput.focus();
    messageInput.style.borderColor = '#3b82f6';
    setTimeout(() => {
        messageInput.style.borderColor = '#e2e8f0';
    }, 1000);
}

function clearInput() {
    const messageInput = document.getElementById('message-input');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Hide results
    const resultsContainer = document.getElementById('results-container');
    resultsContainer.style.display = 'none';
    
    // Add animation
    messageInput.style.transform = 'scale(0.98)';
    setTimeout(() => {
        messageInput.style.transform = 'scale(1)';
    }, 150);
}

function clearMessageInput() {
    const messageInput = document.getElementById('message-input');
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Add subtle animation to show it's been cleared
    messageInput.style.borderColor = '#10b981';
    setTimeout(() => {
        messageInput.style.borderColor = '#e2e8f0';
    }, 1000);
}

async function classifyMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
        showNotification('Please enter a message to classify', 'warning');
        messageInput.focus();
        return;
    }

    const threshold = parseFloat(document.getElementById('threshold-slider').value);
    
    // Show loading
    showLoading(true);
    
    try {
        const response = await fetch('/classify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                threshold: threshold
            })
        });

        const data = await response.json();
        
        if (data.success) {
            displayResults(data);
            addToHistory(data);
            updateAnalytics();
            clearMessageInput(); // Clear input after successful classification
            showNotification('Message classified successfully!', 'success');
        } else {
            showNotification(data.error || 'Classification failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function displayResults(data) {
    const resultsContainer = document.getElementById('results-container');
    const categoriesContainer = document.getElementById('categories-container');
    const resultsSummary = document.getElementById('results-summary');
    
    // Show results container with animation
    resultsContainer.style.display = 'block';
    resultsContainer.style.opacity = '0';
    resultsContainer.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        resultsContainer.style.transition = 'all 0.5s ease';
        resultsContainer.style.opacity = '1';
        resultsContainer.style.transform = 'translateY(0)';
    }, 100);

    // Update summary
    resultsSummary.innerHTML = `
        <span><strong>Categories Found:</strong> ${data.classified_categories.length}</span>
        <span><strong>Max Confidence:</strong> ${(data.max_confidence * 100).toFixed(1)}%</span>
        <span><strong>Processing Time:</strong> <1s</span>
    `;

    // Display categories
    if (data.classified_categories.length > 0) {
        categoriesContainer.innerHTML = '<h4>Detected Categories:</h4>';
        data.classified_categories.forEach(category => {
            const prediction = data.predictions[category];
            const confidence = (prediction.probability * 100).toFixed(1);
            const priority = getPriorityLevel(category);
            
            const badge = document.createElement('div');
            badge.className = `category-badge category-${priority}`;
            badge.innerHTML = `
                ${category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                <span style="opacity: 0.8;">(${confidence}%)</span>
            `;
            
            // Add animation
            badge.style.opacity = '0';
            badge.style.transform = 'scale(0.8)';
            categoriesContainer.appendChild(badge);
            
            setTimeout(() => {
                badge.style.transition = 'all 0.3s ease';
                badge.style.opacity = '1';
                badge.style.transform = 'scale(1)';
            }, 200);
        });
    } else {
        categoriesContainer.innerHTML = `
            <h4>No Categories Detected</h4>
            <p style="color: #64748b; font-style: italic;">
                No categories met the confidence threshold of ${(parseFloat(document.getElementById('threshold-slider').value) * 100).toFixed(0)}%
            </p>
        `;
    }

    // Create confidence chart
    createConfidenceChart(data.predictions);
}

function createConfidenceChart(predictions) {
    const chartContainer = document.getElementById('confidence-chart');
    
    // Clear existing chart
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Prepare data
    const categories = Object.keys(predictions);
    const confidences = categories.map(cat => predictions[cat].probability * 100);
    const colors = categories.map(cat => {
        const priority = getPriorityLevel(cat);
        switch(priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            default: return '#10b981';
        }
    });

    // Create canvas
    chartContainer.innerHTML = '<canvas id="confidence-canvas"></canvas>';
    const canvas = document.getElementById('confidence-canvas');
    const ctx = canvas.getContext('2d');

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.map(cat => cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())),
            datasets: [{
                label: 'Confidence (%)',
                data: confidences,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Confidence Scores by Category',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function getPriorityLevel(category) {
    const highPriority = ['medical_help', 'water', 'food', 'search_and_rescue'];
    const mediumPriority = ['shelter', 'clothing', 'tools', 'electricity'];
    
    if (highPriority.includes(category)) return 'high';
    if (mediumPriority.includes(category)) return 'medium';
    return 'low';
}

function addToHistory(data) {
    const historyItem = {
        timestamp: new Date(),
        message: data.message.substring(0, 100) + (data.message.length > 100 ? '...' : ''),
        categories: data.classified_categories,
        maxConfidence: data.max_confidence,
        totalCategories: data.total_categories
    };
    
    classificationHistory.unshift(historyItem);
    
    // Keep only last 50 items
    if (classificationHistory.length > 50) {
        classificationHistory = classificationHistory.slice(0, 50);
    }
}

function updateAnalytics() {
    // Update total classifications
    document.getElementById('total-classifications').textContent = classificationHistory.length;
    
    // Update average confidence
    if (classificationHistory.length > 0) {
        const avgConfidence = classificationHistory.reduce((sum, item) => sum + item.maxConfidence, 0) / classificationHistory.length;
        document.getElementById('avg-confidence').textContent = (avgConfidence * 100).toFixed(1) + '%';
    } else {
        document.getElementById('avg-confidence').textContent = '0%';
    }
    
    // Update recent activity
    const recentActivity = document.getElementById('recent-activity');
    if (classificationHistory.length > 0) {
        recentActivity.innerHTML = '';
        classificationHistory.slice(0, 5).forEach(item => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 500; color: #1e293b;">${item.message}</div>
                        <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                            ${item.categories.length} categories • ${(item.maxConfidence * 100).toFixed(1)}% confidence
                        </div>
                    </div>
                    <div style="font-size: 0.8rem; color: #64748b;">
                        ${formatTimeAgo(item.timestamp)}
                    </div>
                </div>
            `;
            recentActivity.appendChild(activityItem);
        });
    } else {
        recentActivity.innerHTML = '<p class="no-data">No classifications yet. Start classifying messages to see analytics!</p>';
    }
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (show) {
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.transition = 'opacity 0.3s ease';
            loadingOverlay.style.opacity = '1';
        }, 10);
    } else {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '90px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)'
    });
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

function showDemo() {
    showNotification('Demo feature coming soon!', 'info');
}

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.feature-card, .analytics-card, .about-content');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});