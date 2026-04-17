from flask import Flask, render_template, request, jsonify
import numpy as np
from scipy import ndimage, fftpack
from scipy.ndimage import median_filter, gaussian_filter
import base64
from io import BytesIO
from PIL import Image


app = Flask(__name__)


@app.route("/")
def index() -> str:
    return render_template("index.html")


@app.route("/api/quantize", methods=["POST"])
def quantize():
    """Quantize image to specified levels"""
    try:
        data = request.json
        levels = int(data.get("levels", 4))
        # Image data will be processed in client-side
        return jsonify({"status": "ok", "levels": levels})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/gamma", methods=["POST"])
def gamma_correction():
    """Apply gamma correction"""
    try:
        data = request.json
        gamma = float(data.get("gamma", 1.0))
        return jsonify({"status": "ok", "gamma": gamma})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/histogram-equalize", methods=["POST"])
def histogram_equalize():
    """Histogram equalization (processed client-side)"""
    return jsonify({"status": "ok"})


@app.route("/api/add-noise", methods=["POST"])
def add_noise():
    """Add noise to image"""
    try:
        data = request.json
        noise_type = data.get("type", "salt_pepper")
        intensity = float(data.get("intensity", 0.1))
        return jsonify({"status": "ok", "type": noise_type, "intensity": intensity})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/api/process-image", methods=["POST"])
def process_image():
    """Apply various image processing operations"""
    try:
        data = request.json
        operation = data.get("operation", "")
        
        if operation == "fft":
            return jsonify({"status": "ok", "operation": "fft"})
        elif operation == "dct":
            return jsonify({"status": "ok", "operation": "dct"})
        
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
