# Image Processing Studio

An interactive educational web application for learning digital image processing through real-time camera feed manipulation. Explore 5 comprehensive units covering fundamental image processing concepts with live visualization and hands-on controls.

## 🎯 Educational Purpose

This application serves as an interactive learning tool for understanding digital image processing concepts. Each unit builds upon the previous one, providing both theoretical understanding and practical application through real-time camera feed processing.

## 📚 Learning Units

### 1. **Basics** - Sampling & Quantization
- **Sampling**: Control image resolution and understand pixel subsampling
- **Quantization**: Reduce gray levels to see posterization effects
- **Pixel Relationships**: Explore 4-neighbor and 8-neighbor connectivity

### 2. **Enhancement** - Transformations & Filters
- **Gray Level Transformations**: Negative, logarithmic, and power-law transformations
- **Gamma Correction**: Understand non-linear intensity mapping (s = c·r^γ)
- **Histogram Equalization**: Automatic contrast enhancement
- **Spatial Filtering**: Mean, Gaussian, Laplacian, Sobel, and Prewitt filters

### 3. **Restoration** - Noise & Degradation
- **Noise Addition**: Salt & pepper, Gaussian, and uniform noise
- **Motion Blur**: Linear motion blur simulation
- **Median Filtering**: Non-linear noise reduction

### 4. **Compression** - Encoding & DCT
- **Run-Length Encoding (RLE)**: Lossless compression demonstration
- **Discrete Cosine Transform (DCT)**: JPEG compression foundation
- **Quality vs. Size**: Compression ratio visualization

### 5. **Segmentation** - Thresholding & Morphology
- **Manual Thresholding**: Binary image creation
- **Otsu Method**: Automatic threshold selection
- **Edge Detection**: Sobel, Prewitt, and Laplacian operators
- **Morphological Operations**: Erosion, dilation, opening, closing

## 🚀 Features

- **Real-time Processing**: Live camera feed with instant visual feedback
- **Interactive Controls**: Sliders, buttons, and toggles for all parameters
- **Dual Canvas Display**: Original camera feed vs. processed output
- **Comprehensive Algorithms**: 15+ image processing techniques
- **Educational UI**: Clear labeling and mathematical explanations
- **Responsive Design**: Works on desktop and mobile devices
- **Modern Interface**: Dark indigo theme with professional styling

## 🛠️ Technical Stack

- **Backend**: Flask (Python) with image processing endpoints
- **Frontend**: Vanilla JavaScript, HTML5 Canvas API
- **Image Processing**: Client-side algorithms using WebRTC
- **Styling**: CSS custom properties with responsive design
- **Camera Access**: navigator.mediaDevices.getUserMedia()

## 📋 Prerequisites

- Python 3.8+
- Modern web browser (Chrome, Firefox, Edge, Safari)
- Webcam access permissions

## 🏃‍♂️ Quick Start

### Windows (PowerShell)
```powershell
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

### Linux/macOS (Terminal)
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

### Access the Application
Open your browser and navigate to:
```
http://127.0.0.1:5000
```

## 🎮 How to Use

1. **Grant Camera Permission**: Click "Allow" when prompted for camera access
2. **Start Camera**: Toggle the camera power switch in the sidebar
3. **Explore Units**: Click through the 5 tabs to learn different concepts
4. **Adjust Parameters**: Use sliders and buttons to see real-time effects
5. **Compare Results**: View original feed alongside processed output

## 📖 Learning Path

### Beginner → Intermediate → Advanced

1. **Start with Basics**: Understand sampling and quantization fundamentals
2. **Move to Enhancement**: Learn about contrast and filtering
3. **Explore Restoration**: See how noise affects and can be removed from images
4. **Study Compression**: Learn about lossy vs. lossless compression trade-offs
5. **Master Segmentation**: Understand object detection and feature extraction

### Key Concepts Covered

- **Spatial Domain Processing**: Direct pixel manipulation
- **Frequency Domain**: Understanding image spectra
- **Statistical Methods**: Histograms and probability distributions
- **Morphological Operations**: Shape-based image processing
- **Compression Theory**: Information theory and data reduction

## 🔧 Troubleshooting

### Camera Not Working
- **Permission Denied**: Click the "Reset Camera Permissions" button
- **Browser Settings**: Check camera permissions in browser settings
- **HTTPS Required**: Camera access requires secure context (localhost is fine)

### Performance Issues
- **Reduce Detail Level**: Lower the detail slider for better performance
- **Close Other Tabs**: Free up system resources
- **Use Modern Browser**: Chrome/Edge recommended for best performance

### Common Issues
- **Blank Canvas**: Check browser console for JavaScript errors
- **No Permission Prompt**: Reset camera permissions in browser settings
- **Slow Processing**: Reduce resolution or disable complex filters

## 🎓 Educational Resources

### Mathematical Foundations

Each algorithm includes mathematical notation and explanations:
- **Gamma Correction**: s = c·r^γ (where γ < 1 brightens, γ > 1 darkens)
- **Histogram Equalization**: P(r_k) = n_k/n (probability mass function)
- **Sobel Operator**: Edge detection using gradient magnitude
- **DCT Formula**: F(u,v) = Σ Σ f(x,y)·cos(πu(2x+1)/2N)·cos(πv(2y+1)/2N)

### Real-World Applications

- **Medical Imaging**: Enhancement and restoration techniques
- **Satellite Imagery**: Compression and segmentation
- **Computer Vision**: Edge detection and feature extraction
- **Photography**: Contrast enhancement and noise reduction

## 🤝 Contributing

This is an educational project. Contributions that improve the learning experience are welcome:

- Better explanations of algorithms
- Additional image processing techniques
- Improved UI/UX for learning
- Performance optimizations
- Bug fixes and stability improvements

## 📄 License

Educational use encouraged. Please credit the original work when sharing modifications.

## 🙏 Acknowledgments

Built with modern web technologies to make image processing concepts accessible through interactive learning.
