from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
import xml.etree.ElementTree as ET
import cairosvg
from pdf2image import convert_from_path
from PIL import Image

TARGET_WIDTH = 6000
TEMP_DIR = "temp_processing"
os.makedirs(TEMP_DIR, exist_ok=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

def get_svg_aspect_ratio(svg_path):
    try:
        tree = ET.parse(svg_path)
        root = tree.getroot()
        viewBox = root.get('viewBox')
        if viewBox:
            parts = viewBox.split()
            if len(parts) == 4:
                return float(parts[3]) / float(parts[2])
        w_str = root.get('width')
        h_str = root.get('height')
        if w_str and h_str:
            w = float("".join(c for c in w_str if c.isdigit() or c == '.'))
            h = float("".join(c for c in h_str if c.isdigit() or c == '.'))
            return h / w
    except:
        pass
    return None

def process_image_logic(input_path, original_filename, target_format):
    base_name = os.path.splitext(original_filename)[0]
    output_path = os.path.join(TEMP_DIR, f"{base_name}.{target_format}")
    ext = os.path.splitext(input_path)[1].lower()

    if ext == '.svg':
        temp_png = os.path.join(TEMP_DIR, f"temp_{base_name}.png")
        ratio = get_svg_aspect_ratio(input_path)
        out_w = TARGET_WIDTH
        out_h = int(out_w * ratio) if ratio else 3840
        cairosvg.svg2png(url=input_path, write_to=temp_png, output_width=out_w, output_height=out_h)
        if target_format == 'jpg':
            with Image.open(temp_png) as img:
                img.convert("RGB").save(output_path, quality=100, subsampling=0)
            os.remove(temp_png)
        else:
            os.rename(temp_png, output_path)
    elif ext == '.pdf':
        images = convert_from_path(
            input_path,
            output_folder=TEMP_DIR,
            fmt=target_format,
            size=(TARGET_WIDTH, None),
            single_file=True
        )
        img_obj = images[0]
        if target_format == 'jpg':
            img_obj = img_obj.convert("RGB")
            img_obj.save(output_path, quality=100, subsampling=0)
        else:
            img_obj.save(output_path)
    return output_path

def cleanup_files(input_path, output_path):
    try:
        if os.path.exists(input_path):
            os.remove(input_path)
        if output_path and os.path.exists(output_path):
            os.remove(output_path)
    except Exception as e:
        print(f"Cleanup error: {e}")

@app.post("/convert")
async def convert_file(background_tasks: BackgroundTasks, file: UploadFile = File(...), format: str = Form(...)):
    if format not in ['png', 'jpg']:
        raise HTTPException(status_code=400, detail="Invalid format. Must be png or jpg.")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.svg', '.pdf']:
        raise HTTPException(status_code=400, detail="Invalid file type. Must be .svg or .pdf.")
    
    input_path = os.path.join(TEMP_DIR, f"input_{file.filename}")
    
    with open(input_path, 'wb') as out_file:
        content = await file.read()
        out_file.write(content)
        
    loop = asyncio.get_running_loop()
    try:
        output_path = await loop.run_in_executor(
            None,
            process_image_logic,
            input_path,
            file.filename,
            format
        )
        
        background_tasks.add_task(cleanup_files, input_path, output_path)
        return FileResponse(path=output_path, filename=f"highres_{os.path.splitext(file.filename)[0]}.{format}", media_type=f"image/{format}")
    except Exception as e:
        background_tasks.add_task(cleanup_files, input_path, "")
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")
