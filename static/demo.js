// Auto-demo for hackathon presentation
function startAutoDemo() {
    const demoMessages = [
        "We need immediate medical assistance, several people are injured",
        "Running out of clean drinking water, please send supplies urgently", 
        "Building collapsed, need search and rescue team immediately",
        "Food supplies exhausted, children are hungry"
    ];
    
    let currentIndex = 0;
    
    function runNextDemo() {
        if (currentIndex < demoMessages.length) {
            showPage('classify');
            setTimeout(() => {
                setExample(demoMessages[currentIndex]);
                setTimeout(() => {
                    classifyMessage();
                    currentIndex++;
                    setTimeout(runNextDemo, 4000);
                }, 1000);
            }, 500);
        }
    }
    
    runNextDemo();
}

// Add to existing showDemo function
function showDemo() {
    showNotification('Starting auto-demo presentation!', 'info');
    startAutoDemo();
}