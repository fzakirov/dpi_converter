# FigureGen: High-Res Research Figure Generator

FigureGen is a user-friendly, open-source web application designed specifically for researchers and academics. It provides a seamless way to convert vector graphics (PDF and SVG) into ultra-high-resolution, publishing-ready raster images (PNG or JPG).

Preparing figures for academic publications, journals, and conference posters often requires specific DPI and resolution constraints. FigureGen simplifies this process by taking your vector figures and scaling them precisely to a target width of 6000 pixels, ensuring zero loss of fidelity and crisp details in your final submission.

## Features

- **Publishing-Ready Resolution**: Automatically scales figures to a target width of 6000px, ideal for high-DPI print requirements.
- **Vector to Raster Conversion**: Accepts PDF and SVG inputs and outputs standard PNG or JPG formats.
- **Zero Fidelity Loss**: Powered by native Python Cairo and Poppler libraries on the backend for flawless conversion.
- **User-Friendly Web Interface**: A clean, responsive drag-and-drop web UI with dark mode support.
- **Open Source**: Completely free to use and modify for your research needs, with no subscriptions or complex design software required.

## Prerequisites & Installation

FigureGen is built with Python and FastAPI. Some of the underlying Python libraries (`pdf2image` and `cairosvg`) require system-level dependencies to be installed first.

### 1. Install System Dependencies

You will need to install **Poppler** (for PDF conversion) and **Cairo** (for SVG conversion).

- **macOS** (using [Homebrew](https://brew.sh/)):
  ```bash
  brew install poppler cairo
  ```

- **Ubuntu / Debian**:
  ```bash
  sudo apt-get update
  sudo apt-get install poppler-utils libcairo2
  ```

- **Windows**:
  - Download and install [Poppler for Windows](https://github.com/oschwartz10612/poppler-windows/releases/) and add it to your system PATH.
  - Cairo is typically bundled with the `cairosvg` wheel on Windows, but refer to the [CairoSVG documentation](https://cairosvg.org/documentation/) if you encounter issues.

### 2. Set Up the Python Environment

It's recommended to run the app within a Python virtual environment.

```bash
# Clone the repository (if applicable)
# git clone <repository-url>
# cd <repository-directory>

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install the required Python packages
pip install -r requirements.txt
```

## Usage

Once the dependencies are installed, you can start the FigureGen web server using `uvicorn`:

```bash
uvicorn app:app --reload
```

1. Open your web browser and navigate to `http://localhost:8000`.
2. Select your desired output format (PNG or JPG).
3. Drag and drop your `.pdf` or `.svg` figure into the designated area, or click to upload.
4. The application will process your file and provide a download link for your high-resolution, publication-ready figure.
