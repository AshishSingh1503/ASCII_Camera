const ASCII_SETS = {
    normal: " .:-=+*#%@",
    dense: " .'`^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
};

const state = {
    cameraOn: false,
    mode: "normal",
    mirror: true,
    dense: false,
    glow: true,
    detail: 120,
    contrast: 1.35,
};

const asciiFrame = document.getElementById("asciiFrame");
const cameraFeed = document.getElementById("cameraFeed");
const processingCanvas = document.getElementById("processingCanvas");
const statusText = document.getElementById("statusText");
const modeButtons = [...document.querySelectorAll(".mode-button")];
const cameraToggle = document.getElementById("cameraToggle");
const mirrorToggle = document.getElementById("mirrorToggle");
const denseToggle = document.getElementById("denseToggle");
const glowToggle = document.getElementById("glowToggle");
const detailRange = document.getElementById("detailRange");
const contrastRange = document.getElementById("contrastRange");
const detailValue = document.getElementById("detailValue");
const contrastValue = document.getElementById("contrastValue");

const context = processingCanvas.getContext("2d", { willReadFrequently: true });
let stream = null;
let animationHandle = 0;

function updateStatus(message) {
    statusText.textContent = message;
}

async function startCamera() {
    if (stream) {
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: false,
        });
        cameraFeed.srcObject = stream;
        await cameraFeed.play();
        state.cameraOn = true;
        cameraToggle.checked = true;
        updatePreviewMirror();
        updateStatus("Camera live");
        renderLoop();
    } catch (error) {
        state.cameraOn = false;
        cameraToggle.checked = false;
        asciiFrame.textContent = "Camera access was blocked or unavailable.";
        updateStatus("Camera access failed");
        console.error(error);
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
    asciiFrame.textContent = "Enable camera to begin.";
    updateStatus("Camera offline");
}

function updatePreviewMirror() {
    cameraFeed.classList.toggle("no-mirror", !state.mirror);
}

function setMode(mode) {
    state.mode = mode;
    for (const button of modeButtons) {
        button.classList.toggle("active", button.dataset.mode === mode);
    }
}

function applyMode(data, width, height) {
    const output = new Uint8ClampedArray(width * height);

    for (let i = 0; i < width * height; i += 1) {
        const base = i * 4;
        const r = data[base];
        const g = data[base + 1];
        const b = data[base + 2];
        const grayscale = 0.299 * r + 0.587 * g + 0.114 * b;
        output[i] = grayscale;
    }

    if (state.mode === "normal") {
        return output;
    }

    if (state.mode === "inverted") {
        for (let i = 0; i < output.length; i += 1) {
            output[i] = 255 - output[i];
        }
        return output;
    }

    if (state.mode === "sketch") {
        for (let i = 0; i < output.length; i += 1) {
            output[i] = output[i] > 135 ? 255 : output[i] * 0.55;
        }
        return output;
    }

    if (state.mode === "matrix") {
        for (let i = 0; i < output.length; i += 1) {
            const banded = Math.floor(output[i] / 32) * 32;
            output[i] = banded;
        }
        return output;
    }

    if (state.mode === "edges") {
        const edgeOutput = new Uint8ClampedArray(width * height);
        for (let y = 1; y < height - 1; y += 1) {
            for (let x = 1; x < width - 1; x += 1) {
                const idx = y * width + x;
                const gx =
                    -output[idx - width - 1] - 2 * output[idx - 1] - output[idx + width - 1] +
                    output[idx - width + 1] + 2 * output[idx + 1] + output[idx + width + 1];
                const gy =
                    -output[idx - width - 1] - 2 * output[idx - width] - output[idx - width + 1] +
                    output[idx + width - 1] + 2 * output[idx + width] + output[idx + width + 1];
                const magnitude = Math.min(255, Math.sqrt(gx * gx + gy * gy));
                edgeOutput[idx] = 255 - magnitude;
            }
        }
        return edgeOutput;
    }

    return output;
}

function mapValue(value) {
    const contrasted = ((value - 128) * state.contrast) + 128;
    return Math.max(0, Math.min(255, contrasted));
}

function renderAsciiFrame() {
    if (!state.cameraOn || cameraFeed.readyState < 2) {
        animationHandle = requestAnimationFrame(renderAsciiFrame);
        return;
    }

    const width = state.detail;
    const height = Math.max(32, Math.floor(width * 0.56));
    processingCanvas.width = width;
    processingCanvas.height = height;

    context.save();
    if (state.mirror) {
        context.translate(width, 0);
        context.scale(-1, 1);
    }
    context.drawImage(cameraFeed, 0, 0, width, height);
    context.restore();

    const imageData = context.getImageData(0, 0, width, height);
    const grayscale = applyMode(imageData.data, width, height);
    const charset = state.dense ? ASCII_SETS.dense : ASCII_SETS.normal;
    const lastIndex = charset.length - 1;
    const rows = [];

    for (let y = 0; y < height; y += 2) {
        let row = "";
        for (let x = 0; x < width; x += 1) {
            const index = y * width + x;
            const brightness = mapValue(grayscale[index]);
            const charIndex = Math.floor((brightness / 255) * lastIndex);
            let character = charset[charIndex];

            if (state.mode === "matrix" && brightness > 180) {
                character = "01"[Math.floor(Math.random() * 2)];
            }

            row += character;
        }
        rows.push(row);
    }

    asciiFrame.textContent = rows.join("\n");
    animationHandle = requestAnimationFrame(renderAsciiFrame);
}

function renderLoop() {
    if (!animationHandle) {
        animationHandle = requestAnimationFrame(renderAsciiFrame);
    }
}

cameraToggle.addEventListener("change", () => {
    if (cameraToggle.checked) {
        startCamera();
        return;
    }
    stopCamera();
});

mirrorToggle.addEventListener("change", () => {
    state.mirror = mirrorToggle.checked;
    updatePreviewMirror();
});

denseToggle.addEventListener("change", () => {
    state.dense = denseToggle.checked;
});

glowToggle.addEventListener("change", () => {
    state.glow = glowToggle.checked;
    asciiFrame.classList.toggle("glow-on", state.glow);
});

detailRange.addEventListener("input", () => {
    state.detail = Number(detailRange.value);
    detailValue.textContent = detailRange.value;
});

contrastRange.addEventListener("input", () => {
    state.contrast = Number(contrastRange.value);
    contrastValue.textContent = Number(contrastRange.value).toFixed(2);
});

for (const button of modeButtons) {
    button.addEventListener("click", () => setMode(button.dataset.mode));
}

window.addEventListener("beforeunload", stopCamera);

if (!navigator.mediaDevices?.getUserMedia) {
    asciiFrame.textContent = "This browser does not support webcam access.";
    updateStatus("Browser unsupported");
}
