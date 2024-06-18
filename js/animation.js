// Blob animation setup
var targetAudioLevel = 0;
var audioLevel = 0;

function updateBlobSize(level) {
    targetAudioLevel = level; // Set the new target level
}

function animateBlob() {
    var canvas = document.getElementById("blobCanvas");
    var ctx = canvas.getContext("2d");
    var time = performance.now() * 0.001;
    // Smoothing the transition by moving audioLevel towards targetAudioLevel
    audioLevel += (targetAudioLevel - audioLevel) * 0.05;
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    var baseSize = 200 + audioLevel * 100; // Adjust base size based on audio level
    // Create a gradient from deep teal to lighter teal
    var gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        baseSize * 0.00005,
        centerX,
        centerY,
        baseSize
    );
    gradient.addColorStop(0, "#005f73"); // Deep teal
    gradient.addColorStop(1, "#005f73 "); // Lighter teal

    canvas.width = canvas.width; // Clear canvas for new frame
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    // Create a rounded, flowing shape by varying the radius subtly

    for (let angle = 0; angle <= Math.PI * 2; angle += 0.01) {
        let smoothRandom =
            Math.sin(angle * (3 + Math.random() * 0.005) + time) * 5 +
            Math.cos(angle * (5 + Math.random() * 0.005) + time) * 5;
        let radius = baseSize + smoothRandom; // Incorporate the smoothed random factor
        let x = centerX + radius * Math.cos(angle);
        let y = centerY + radius * Math.sin(angle);
        ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Gradually decrease audioLevel to return to normal size
    audioLevel *= 0.95;

    requestAnimationFrame(animateBlob);
}