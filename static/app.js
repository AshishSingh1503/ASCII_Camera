// Global State
const state = {
    // Camera & Display
    cameraOn: false,
    mirror: true,
    glow: true,
    detail: 120,
    contrast: 1.35,
    brightness: 0,

    // Tab & Mode
    currentTab: "basics",
    currentTransform: "normal",
    currentFilter: "none",
    currentGrayLevel: 4,

    // Unit 1: Basics
    samplingScale: 1.0,
    quantizeLevels: 4,
    neighborMode: "4",

    // Unit 2: Enhancement
    gamma: 1.0,
    useHistogramEqualization: false,
    currentFilterType: "none",
    filterStrength: 1,
    useFFT: false,

    // Unit 3: Restoration
    noiseType: "none",
    noiseIntensity: 0,
    restorationFilter: "none",
    motionBlurAmount: 0,

    // Unit 4: Compression
    useRLE: false,
    compressionMode: "lossless",
    dctQuality: 100,

    // Unit 5: Segmentation
    thresholdValue: 128,
    thresholdMethod: "manual",
    edgeDetectionMethod: "none",
    edgeThreshold: 50,
    morphOperation: "none",
    morphIterations: 1,
};

// DOM Elements
const cameraFeed = document.getElementById("cameraFeed");
const cameraCanvas = document.getElementById("cameraCanvas");
const outputCanvas = document.getElementById("outputCanvas");
const processingCanvas = document.getElementById("processingCanvas");

const cameraToggle = document.getElementById("cameraToggle");
const mirrorToggle = document.getElementById("mirrorToggle");
const glowToggle = document.getElementById("glowToggle");
const detailRange = document.getElementById("detailRange");
const contrastRange = document.getElementById("contrastRange");
const brightnessRange = document.getElementById("brightnessRange");
const detailValue = document.getElementById("detailValue");
const contrastValue = document.getElementById("contrastValue");
const brightnessValue = document.getElementById("brightnessValue");
const statusText = document.getElementById("statusText");

// Verify DOM elements exist
if (!cameraFeed || !cameraCanvas || !outputCanvas || !processingCanvas || !cameraToggle) {
    console.error("❌ Missing critical DOM elements:", {
        cameraFeed: !!cameraFeed,
        cameraCanvas: !!cameraCanvas,
        outputCanvas: !!outputCanvas,
        processingCanvas: !!processingCanvas,
        cameraToggle: !!cameraToggle,
    });
}

const context = processingCanvas?.getContext("2d", { willReadFrequently: true });
const cameraCtx = cameraCanvas?.getContext("2d", { willReadFrequently: true });
const outputCtx = outputCanvas?.getContext("2d", { willReadFrequently: true });

let stream = null;
let animationHandle = 0;

console.log("✅ App initialized - DOM elements loaded");

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function updateStatus(message) {
    statusText.textContent = message;
}

function resizeCanvases(width, height) {
    cameraCanvas.width = width;
    cameraCanvas.height = height;
    outputCanvas.width = width;
    outputCanvas.height = height;
    processingCanvas.width = width;
    processingCanvas.height = height;
}

// ============================================================
// CAMERA FUNCTIONS
// ============================================================

async function startCamera() {
    console.log("📷 startCamera() called, stream exists:", !!stream);
    if (stream) {
        console.log("⚠️ Camera already running");
        return;
    }

    try {
        console.log("🔍 Requesting camera access...");
        console.log("navigator.mediaDevices available:", !!navigator.mediaDevices);
        console.log("navigator.mediaDevices.getUserMedia available:", !!navigator.mediaDevices?.getUserMedia);

        // Check if running in secure context (HTTPS or localhost)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            throw new Error("Camera access requires HTTPS or localhost. Please access this app via https:// or localhost.");
        }

        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("getUserMedia is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.");
        }

        // Check current permission status
        if (navigator.permissions) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'camera' });
                console.log("📋 Current camera permission status:", permissionStatus.state);
                if (permissionStatus.state === 'denied') {
                    throw new Error("Camera permission was previously denied. Please reset camera permissions in browser settings.");
                } else if (permissionStatus.state === 'granted') {
                    console.log("✅ Camera permission already granted");
                } else {
                    console.log("❓ Camera permission status: prompt (will show permission dialog)");
                }
            } catch (permError) {
                console.log("⚠️ Could not check permission status:", permError.message);
                // Permission API might not be available or supported
            }
        } else {
            console.log("⚠️ navigator.permissions not available - cannot check permission status");
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("getUserMedia not supported");
        }

        console.log("⏳ Calling getUserMedia - browser will show permission prompt");
        console.log("🔍 If no prompt appears, check browser settings or try the reset button");

        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: false,
        });

        console.log("✅ Permission granted! Setting up stream...");
        cameraFeed.srcObject = stream;

        // Wait for the video to be loadable with timeout
        console.log("⏳ Waiting for video metadata...");
        await Promise.race([
            new Promise((resolve) => {
                cameraFeed.onloadedmetadata = () => {
                    console.log("✅ Video metadata loaded");
                    resolve();
                };
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Video metadata timeout")), 5000)
            ),
        ]);

        console.log("▶️ Playing video...");
        await cameraFeed.play();

        state.cameraOn = true;
        cameraToggle.checked = true;
        updatePreviewMirror();
        updateStatus("💻 Camera live");
        console.log("🎬 Camera started successfully. Video readyState:", cameraFeed.readyState);
        renderLoop();
    } catch (error) {
        console.error("❌ Camera error:", error.name, error.message);
        state.cameraOn = false;
        cameraToggle.checked = false;

        // Draw error message on canvas
        if (cameraCtx) {
            cameraCtx.fillStyle = "#1a1a2e";
            cameraCtx.fillRect(0, 0, cameraCanvas.width, cameraCanvas.height);
            cameraCtx.fillStyle = "#ef4444";
            cameraCtx.font = "16px sans-serif";
            cameraCtx.textAlign = "center";
            cameraCtx.fillText("Camera error: " + error.message, cameraCanvas.width / 2, cameraCanvas.height / 2);
        }

        const errorMsg = `❌ ${error.name}: ${error.message}`;
        updateStatus(errorMsg);
        console.error("Full error:", error);
    }
}

function stopCamera() {
    state.cameraOn = false;
    cameraToggle.checked = false;

    if (animationHandle) {
        cancelAnimationFrame(animationHandle);
        animationHandle = 0;
    }

    if (stream) {
        for (const track of stream.getTracks()) {
            track.stop();
        }
        stream = null;
    }

    cameraFeed.srcObject = null;
    
    // Clear canvases
    cameraCtx.fillStyle = "#0a0e27";
    cameraCtx.fillRect(0, 0, cameraCanvas.width, cameraCanvas.height);
    outputCtx.fillStyle = "#0a0e27";
    outputCtx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
    
    updateStatus("⏸️ Camera offline");
}

function updatePreviewMirror() {
    cameraFeed.style.transform = state.mirror ? "scaleX(-1)" : "none";
}

// ============================================================
// TAB MANAGEMENT
// ============================================================

function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabPanes = document.querySelectorAll(".tab-pane");

    tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const tabName = button.dataset.tab;
            state.currentTab = tabName;

            tabButtons.forEach((btn) => btn.classList.remove("active"));
            button.classList.add("active");

            tabPanes.forEach((pane) => pane.classList.remove("active"));
            document.getElementById(tabName)?.classList.add("active");
        });
    });
}

// ============================================================
// IMAGE PROCESSING CORE
// ============================================================

function convertToGrayscale(data, width, height) {
    const output = new Uint8ClampedArray(width * height);
    for (let i = 0; i < width * height; i++) {
        const base = i * 4;
        const r = data[base];
        const g = data[base + 1];
        const b = data[base + 2];
        output[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    return output;
}

// Convert grayscale array to ImageData
function grayscaleToImageData(grayscale, width, height) {
    const imageData = new ImageData(width, height);
    const data = imageData.data;
    
    for (let i = 0; i < grayscale.length; i++) {
        const value = grayscale[i];
        data[i * 4] = value;     // R
        data[i * 4 + 1] = value; // G
        data[i * 4 + 2] = value; // B
        data[i * 4 + 3] = 255;   // A
    }
    
    return imageData;
}

// Resample grayscale data from one resolution to another using nearest neighbor
function resampleGrayscale(grayscale, srcWidth, srcHeight, dstWidth, dstHeight) {
    const output = new Uint8ClampedArray(dstWidth * dstHeight);
    const scaleX = srcWidth / dstWidth;
    const scaleY = srcHeight / dstHeight;
    
    for (let y = 0; y < dstHeight; y++) {
        for (let x = 0; x < dstWidth; x++) {
            const srcX = Math.floor(x * scaleX);
            const srcY = Math.floor(y * scaleY);
            output[y * dstWidth + x] = grayscale[srcY * srcWidth + srcX];
        }
    }
    
    return output;
}

// UNIT 1: SAMPLING & QUANTIZATION
function applySampling(grayscale, width, height) {
    if (state.samplingScale === 1.0) return { data: grayscale, width, height };

    const newWidth = Math.max(1, Math.floor(width * state.samplingScale));
    const newHeight = Math.max(1, Math.floor(height * state.samplingScale));
    const scale = 1 / state.samplingScale;

    const sampled = new Uint8ClampedArray(newWidth * newHeight);
    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const srcX = Math.floor(x * scale);
            const srcY = Math.floor(y * scale);
            const srcIdx = srcY * width + srcX;
            sampled[y * newWidth + x] = grayscale[srcIdx];
        }
    }

    const resampled = new Uint8ClampedArray(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const srcX = Math.floor((x / width) * newWidth);
            const srcY = Math.floor((y / height) * newHeight);
            resampled[y * width + x] = sampled[srcY * newWidth + srcX];
        }
    }

    return { data: resampled, width, height };
}

function quantizeImage(grayscale, levels) {
    const output = new Uint8ClampedArray(grayscale.length);
    const step = 256 / levels;

    for (let i = 0; i < grayscale.length; i++) {
        const level = Math.floor(grayscale[i] / step);
        output[i] = Math.min(255, level * step);
    }

    return output;
}

// UNIT 2: ENHANCEMENT
function applyGrayLevelTransform(grayscale, transform) {
    const output = new Uint8ClampedArray(grayscale.length);

    for (let i = 0; i < grayscale.length; i++) {
        let value = grayscale[i];

        if (transform === "negative") {
            value = 255 - value;
        } else if (transform === "log") {
            value = 255 * Math.log(1 + value / 255) / Math.log(2);
        }

        output[i] = Math.max(0, Math.min(255, value));
    }

    return output;
}

function applyGammaCorrection(grayscale, gamma) {
    const output = new Uint8ClampedArray(grayscale.length);
    const c = 1;

    for (let i = 0; i < grayscale.length; i++) {
        const normalized = grayscale[i] / 255;
        const corrected = c * Math.pow(normalized, gamma);
        output[i] = Math.min(255, Math.floor(corrected * 255));
    }

    return output;
}

function applyMedianFilter(grayscale, width, height, strength) {
    const output = new Uint8ClampedArray(grayscale.length);
    const radius = strength;

    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const values = [];
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    values.push(grayscale[(y + dy) * width + (x + dx)]);
                }
            }
            values.sort((a, b) => a - b);
            output[y * width + x] = values[Math.floor(values.length / 2)];
        }
    }

    return output;
}

function applySobelFilter(grayscale, width, height) {
    const output = new Uint8ClampedArray(width * height);
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const idx = (y + dy) * width + (x + dx);
                    gx += sobelX[dy + 1][dx + 1] * grayscale[idx];
                    gy += sobelY[dy + 1][dx + 1] * grayscale[idx];
                }
            }
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            output[y * width + x] = Math.min(255, magnitude);
        }
    }

    return output;
}

function applyPrewittFilter(grayscale, width, height) {
    const output = new Uint8ClampedArray(width * height);
    const prewittX = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
    const prewittY = [[-1, -1, -1], [0, 0, 0], [1, 1, 1]];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0, gy = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const idx = (y + dy) * width + (x + dx);
                    gx += prewittX[dy + 1][dx + 1] * grayscale[idx];
                    gy += prewittY[dy + 1][dx + 1] * grayscale[idx];
                }
            }
            const magnitude = Math.sqrt(gx * gx + gy * gy);
            output[y * width + x] = Math.min(255, magnitude);
        }
    }

    return output;
}

function applyLaplacianFilter(grayscale, width, height) {
    const output = new Uint8ClampedArray(width * height);
    const laplacian = [[0, -1, 0], [-1, 4, -1], [0, -1, 0]];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let value = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const idx = (y + dy) * width + (x + dx);
                    value += laplacian[dy + 1][dx + 1] * grayscale[idx];
                }
            }
            output[y * width + x] = Math.max(0, Math.min(255, value + 128));
        }
    }

    return output;
}

function applyHistogramEqualization(grayscale) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < grayscale.length; i++) {
        histogram[grayscale[i]]++;
    }

    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
        cdf[i] = cdf[i - 1] + histogram[i];
    }

    const min = cdf.find((v) => v > 0);
    const output = new Uint8ClampedArray(grayscale.length);

    for (let i = 0; i < grayscale.length; i++) {
        const value = grayscale[i];
        const equalized = Math.floor(((cdf[value] - min) / (grayscale.length - min)) * 255);
        output[i] = Math.min(255, equalized);
    }

    return output;
}

// UNIT 3: RESTORATION
function addNoise(grayscale, noiseType, intensity) {
    const output = new Uint8ClampedArray(grayscale);
    const amount = intensity / 100;

    if (noiseType === "salt_pepper") {
        for (let i = 0; i < output.length; i++) {
            if (Math.random() < amount) {
                output[i] = Math.random() < 0.5 ? 0 : 255;
            }
        }
    } else if (noiseType === "gaussian") {
        for (let i = 0; i < output.length; i++) {
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
            output[i] = Math.max(0, Math.min(255, output[i] + z * intensity * 2.55));
        }
    }

    return output;
}

function applyMotionBlur(grayscale, width, height, amount) {
    if (amount === 0) return grayscale;

    const output = new Uint8ClampedArray(grayscale);
    const kernelSize = amount + 1;

    for (let y = 0; y < height; y++) {
        for (let x = kernelSize; x < width; x++) {
            let sum = 0;
            for (let k = 0; k < kernelSize; k++) {
                sum += grayscale[y * width + (x - k)];
            }
            output[y * width + x] = Math.floor(sum / kernelSize);
        }
    }

    return output;
}

// UNIT 5: SEGMENTATION
function applyThresholding(grayscale, threshold) {
    const output = new Uint8ClampedArray(grayscale.length);

    for (let i = 0; i < grayscale.length; i++) {
        output[i] = grayscale[i] >= threshold ? 255 : 0;
    }

    return output;
}

function otsuThresholding(grayscale) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < grayscale.length; i++) {
        histogram[grayscale[i]]++;
    }

    let total = grayscale.length;
    let sum = 0;
    let w0 = 0, mu0 = 0, mu1 = 0;
    let maxSigma = 0, threshold = 0;

    for (let t = 0; t < 256; t++) {
        sum += t * histogram[t];
    }

    for (let t = 0; t < 256; t++) {
        w0 += histogram[t];
        if (w0 === 0) continue;

        const w1 = total - w0;
        if (w1 === 0) break;

        mu0 = sum / w0;
        mu1 = (sum - mu0 * w0) / w1;

        const sigma = w0 * w1 * ((mu0 - mu1) * (mu0 - mu1));
        if (sigma > maxSigma) {
            maxSigma = sigma;
            threshold = t;
        }
    }

    return threshold;
}

// ============================================================
// RENDERING
// ============================================================

function mapValue(value) {
    const contrasted = ((value - 128) * state.contrast) + 128 + state.brightness;
    return Math.max(0, Math.min(255, contrasted));
}

function renderFrame() {
    if (!state.cameraOn || cameraFeed.readyState < 2) {
        animationHandle = requestAnimationFrame(renderFrame);
        return;
    }

    // Use full camera resolution for rendering
    const renderWidth = 640;
    const renderHeight = 480;
    resizeCanvases(renderWidth, renderHeight);

    // Detail level controls processing resolution (60-200)
    // Convert detail to a sampling scale (0.1 to 0.33)
    const detailScale = state.detail / 640;
    const processingWidth = Math.max(60, Math.floor(renderWidth * detailScale));
    const processingHeight = Math.max(32, Math.floor(renderHeight * detailScale));

    // Draw camera feed on processing canvas
    try {
        context.save();
        if (state.mirror) {
            context.translate(renderWidth, 0);
            context.scale(-1, 1);
        }
        context.drawImage(cameraFeed, 0, 0, renderWidth, renderHeight);
        context.restore();

        // Get original image data at full resolution
        let imageData = context.getImageData(0, 0, renderWidth, renderHeight);
        let grayscale = convertToGrayscale(imageData.data, renderWidth, renderHeight);

        // Display camera feed on canvas
        const cameraImageData = grayscaleToImageData(grayscale, renderWidth, renderHeight);
        cameraCtx.putImageData(cameraImageData, 0, 0);

    // UNIT 1: Apply Sampling based on detail level
    // First, downsample to processing resolution
    let workingGrayscale = new Uint8ClampedArray(processingWidth * processingHeight);
    for (let y = 0; y < processingHeight; y++) {
        for (let x = 0; x < processingWidth; x++) {
            const srcX = Math.floor((x / processingWidth) * renderWidth);
            const srcY = Math.floor((y / processingHeight) * renderHeight);
            workingGrayscale[y * processingWidth + x] = grayscale[srcY * renderWidth + srcX];
        }
    }
    
    // Apply sampling scale if set
    const sampledResult = applySampling(workingGrayscale, processingWidth, processingHeight);
    workingGrayscale = sampledResult.data;
    let width = sampledResult.width;
    let height = sampledResult.height;
    
    // Now work with the processed data at reduced resolution
    grayscale = workingGrayscale;

    // Apply Quantization
    grayscale = quantizeImage(grayscale, state.quantizeLevels);

    // UNIT 2: Apply Transformations
    grayscale = applyGrayLevelTransform(grayscale, state.currentTransform);
    grayscale = applyGammaCorrection(grayscale, state.gamma);

    // Apply Histogram Equalization
    if (state.useHistogramEqualization) {
        grayscale = applyHistogramEqualization(grayscale);
    }

    // Apply Filtering
    if (state.currentFilterType === "median") {
        grayscale = applyMedianFilter(grayscale, width, height, state.filterStrength);
    } else if (state.currentFilterType === "sobel") {
        grayscale = applySobelFilter(grayscale, width, height);
    } else if (state.currentFilterType === "laplacian") {
        grayscale = applyLaplacianFilter(grayscale, width, height);
    } else if (state.currentFilterType === "prewitt") {
        grayscale = applyPrewittFilter(grayscale, width, height);
    }

    // UNIT 3: Apply Restoration
    grayscale = addNoise(grayscale, state.noiseType, state.noiseIntensity);
    grayscale = applyMotionBlur(grayscale, width, height, state.motionBlurAmount);

    if (state.restorationFilter === "median") {
        grayscale = applyMedianFilter(grayscale, width, height, 1);
    }

    // UNIT 5: Apply Segmentation
    if (state.thresholdMethod === "manual") {
        grayscale = applyThresholding(grayscale, state.thresholdValue);
    } else if (state.thresholdMethod === "otsu") {
        const threshold = otsuThresholding(grayscale);
        grayscale = applyThresholding(grayscale, threshold);
    }

    if (state.edgeDetectionMethod === "sobel") {
        grayscale = applySobelFilter(grayscale, width, height);
    } else if (state.edgeDetectionMethod === "prewitt") {
        grayscale = applyPrewittFilter(grayscale, width, height);
    } else if (state.edgeDetectionMethod === "laplacian") {
        grayscale = applyLaplacianFilter(grayscale, width, height);
    }

    // Apply brightness/contrast
    for (let i = 0; i < grayscale.length; i++) {
        grayscale[i] = mapValue(grayscale[i]);
    }

    // Resize back to full dimensions for display
    const fullOutputData = resampleGrayscale(grayscale, width, height, renderWidth, renderHeight);
    
    // Display processed image at full resolution
    const processedImageData = grayscaleToImageData(fullOutputData, renderWidth, renderHeight);
    outputCtx.putImageData(processedImageData, 0, 0);

    animationHandle = requestAnimationFrame(renderFrame);
}

function renderLoop() {
    if (!animationHandle) {
        animationHandle = requestAnimationFrame(renderFrame);
    }
}

// ============================================================
// EVENT LISTENERS
// ============================================================

cameraToggle.addEventListener("change", () => {
    console.log("🎬 Camera toggle clicked:", cameraToggle.checked);
    console.log("🎬 Camera toggle element:", cameraToggle);
    if (cameraToggle.checked) {
        console.log("🚀 Starting camera...");
        startCamera();
    } else {
        console.log("⏹️ Stopping camera...");
        stopCamera();
    }
});

// Reset camera permissions button
document.getElementById("resetCameraBtn")?.addEventListener("click", () => {
    console.log("🔄 Resetting camera permissions...");
    updateStatus("🔄 Reset camera permissions and refresh the page");
    alert("To reset camera permissions:\n\n1. Click the lock/info icon in your browser's address bar\n2. Find camera permissions\n3. Reset or allow camera access\n4. Refresh this page\n\nAlternatively, try opening this page in an incognito/private window.");
});

mirrorToggle.addEventListener("change", () => {
    state.mirror = mirrorToggle.checked;
});

glowToggle.addEventListener("change", () => {
    state.glow = glowToggle.checked;
});

detailRange.addEventListener("input", () => {
    state.detail = Number(detailRange.value);
    detailValue.textContent = detailRange.value;
});

contrastRange.addEventListener("input", () => {
    state.contrast = Number(contrastRange.value);
    contrastValue.textContent = Number(contrastRange.value).toFixed(2);
});

brightnessRange.addEventListener("input", () => {
    state.brightness = Number(brightnessRange.value);
    brightnessValue.textContent = brightnessRange.value;
});

// UNIT 1: BASICS TAB
document.getElementById("samplingScale")?.addEventListener("input", (e) => {
    state.samplingScale = Number(e.target.value);
    document.getElementById("samplingValue").textContent = state.samplingScale.toFixed(1) + "x";
});

document.querySelectorAll('[data-quantize]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.quantizeLevels = Number(e.target.dataset.quantize);
        document.querySelectorAll('[data-quantize]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

// UNIT 2: ENHANCEMENT TAB
document.querySelectorAll('[data-transform]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.currentTransform = e.target.dataset.transform;
        document.querySelectorAll('[data-transform]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

document.getElementById("gammaSlider")?.addEventListener("input", (e) => {
    state.gamma = Number(e.target.value);
    document.getElementById("gammaValue").textContent = state.gamma.toFixed(1);
});

document.getElementById("histogramToggle")?.addEventListener("change", (e) => {
    state.useHistogramEqualization = e.target.checked;
});

document.querySelectorAll('[data-filter]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.currentFilterType = e.target.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

document.getElementById("filterStrength")?.addEventListener("input", (e) => {
    state.filterStrength = Number(e.target.value);
    document.getElementById("strengthValue").textContent = e.target.value;
});

document.getElementById("fftToggle")?.addEventListener("click", () => {
    state.useFFT = !state.useFFT;
    alert("FFT visualization: " + (state.useFFT ? "Enabled" : "Disabled"));
});

// UNIT 3: RESTORATION TAB
document.querySelectorAll('[data-noise]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.noiseType = e.target.dataset.noise;
        document.querySelectorAll('[data-noise]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

document.getElementById("noiseIntensity")?.addEventListener("input", (e) => {
    state.noiseIntensity = Number(e.target.value);
    document.getElementById("noiseValue").textContent = e.target.value + "%";
});

document.querySelectorAll('[data-restore]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.restorationFilter = e.target.dataset.restore;
    });
});

document.getElementById("motionBlur")?.addEventListener("input", (e) => {
    state.motionBlurAmount = Number(e.target.value);
    document.getElementById("blurValue").textContent = e.target.value;
});

// UNIT 4: COMPRESSION TAB
document.getElementById("rleToggle")?.addEventListener("click", () => {
    state.useRLE = !state.useRLE;
    const statsDiv = document.getElementById("rleStats");
    statsDiv.style.display = state.useRLE ? "block" : "none";
});

document.getElementById("dctQuality")?.addEventListener("input", (e) => {
    state.dctQuality = Number(e.target.value);
    document.getElementById("qualityValue").textContent = e.target.value + "%";
});

document.querySelectorAll('[data-compression]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.compressionMode = e.target.dataset.compression;
        document.querySelectorAll('[data-compression]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

// UNIT 5: SEGMENTATION TAB
document.getElementById("thresholdSlider")?.addEventListener("input", (e) => {
    state.thresholdValue = Number(e.target.value);
    document.getElementById("thresholdValue").textContent = e.target.value;
});

document.querySelectorAll('[data-threshold]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.thresholdMethod = e.target.dataset.threshold;
        document.querySelectorAll('[data-threshold]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

document.querySelectorAll('[data-edge]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.edgeDetectionMethod = e.target.dataset.edge;
        document.querySelectorAll('[data-edge]').forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
    });
});

document.getElementById("edgeThreshold")?.addEventListener("input", (e) => {
    state.edgeThreshold = Number(e.target.value);
    document.getElementById("edgeThreshValue").textContent = e.target.value;
});

document.querySelectorAll('[data-morph]').forEach((btn) => {
    btn.addEventListener("click", (e) => {
        state.morphOperation = e.target.dataset.morph;
    });
});

document.getElementById("morphIterations")?.addEventListener("input", (e) => {
    state.morphIterations = Number(e.target.value);
    document.getElementById("morphValue").textContent = e.target.value;
});

// ============================================================
// INITIALIZATION
// ============================================================

initTabs();

window.addEventListener("beforeunload", stopCamera);

if (!navigator.mediaDevices?.getUserMedia) {
    updateStatus("⚠️ Browser unsupported");
}

console.log("✅ All event listeners attached, app ready!");

// Debug: Check if camera toggle is working
setTimeout(() => {
    console.log("🔍 Debug check - Camera toggle element:", cameraToggle);
    console.log("🔍 Debug check - Camera toggle checked:", cameraToggle?.checked);
    console.log("🔍 Debug check - Camera feed element:", cameraFeed);
    console.log("🔍 Debug check - Camera canvas element:", cameraCanvas);
}, 1000);
