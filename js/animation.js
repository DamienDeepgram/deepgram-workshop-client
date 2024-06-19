// Blob animation setup
let targetAudioLevel = 0;
let audioLevel = 0;

function updateBlobSize(level) {
    targetAudioLevel = level; // Set the new target level
}

function animateBlob() {
    const canvas = document.getElementById("blobCanvas");
    const ctx = canvas.getContext("2d");
    const time = performance.now() * 0.001;

    // Smoothing the transition by moving audioLevel towards targetAudioLevel
    audioLevel += (targetAudioLevel - audioLevel) * 0.05;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Adjust base size based on audio level
    const baseSize = 200 + audioLevel * 100; 

    // Create a gradient from deep teal to lighter teal
    const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseSize * 0.00005,
        centerX,
        centerY,
        baseSize
    );
    gradient.addColorStop(0, "#8d2aeb"); // Deep teal
    gradient.addColorStop(1, "#a65deb "); // Lighter teal

    // Clear canvas for new frame
    canvas.width = canvas.width; 
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    // Create a rounded, flowing shape by varying the radius subtly
    const speed = 10;
    for (let angle = -1; angle <= Math.PI * 2; angle += 0.01) {
        let smoothRandom =
            Math.sin(angle * (3 + Math.random() * 0.005) + time) * speed +
            Math.cos(angle * (5 + Math.random() * 0.005) + time) * speed;
        const radius = baseSize + smoothRandom; // Incorporate the smoothed random factor
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Gradually decrease audioLevel to return to normal size
    audioLevel *= 0.95;

    requestAnimationFrame(animateBlob);
}