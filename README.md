# ASCII Camera Web App

A browser-based webcam toy that turns your camera feed into live ASCII art with a green cyber-style interface.

## Features

- Live webcam ASCII rendering in the browser
- Green-themed web UI
- Mode buttons: `normal`, `inverted`, `edges`, `sketch`, `matrix`
- Toggle switches for camera power, mirror view, dense characters, and glow
- Detail and contrast sliders

## Setup

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```powershell
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## Git Bash Run

```bash
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python app.py
```

## Notes

- The browser will ask for camera permission the first time.
- For the smoothest result, use Chrome, Edge, or Firefox.
- The webcam is accessed directly by the browser, which keeps the app simpler and more responsive.
