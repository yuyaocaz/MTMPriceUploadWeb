from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
from datetime import date
import io
from pathlib import Path
import json
from fastapi.responses import StreamingResponse
import asyncio

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Store processing status for each task
processing_status = {}

@app.post("/api/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    text1: str = Form(...),
    text2: str = Form(...),
    text3: str = Form(...),
    selected_date: date = Form(...)
):
    try:
        # Save files and get their paths
        file_paths = []
        for file in files:
            file_path = UPLOAD_DIR / file.filename
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            file_paths.append(file_path)
        
        return {"message": "Files uploaded successfully", "file_paths": [str(p) for p in file_paths]}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/status/{function_id}")
async def get_status(function_id: str):
    async def event_stream():
        while True:
            if function_id in processing_status:
                data = json.dumps(processing_status[function_id])
                yield f"data: {data}\n\n"
            await asyncio.sleep(0.5)

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream"
    )

@app.post("/api/process/{function_id}")
async def process_files(
    function_id: str,
    files: List[UploadFile] = File(...),
    text1: str = Form(...),
    text2: str = Form(...),
    text3: str = Form(...),
    selected_date: str = Form(...)
):
    try:
        # Example of updating progress during processing
        processing_status[function_id] = {"progress": 0, "message": "Starting..."}
        
        # Simulate processing steps
        for i in range(5):
            await asyncio.sleep(1)  # Simulate work
            progress = (i + 1) * 20
            processing_status[function_id] = {
                "progress": progress,
                "message": f"Processing step {i + 1}/5..."
            }

        # Clean up status
        del processing_status[function_id]
        
        return {"output_file": "processed_file.xlsx"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/export/{filename}")
async def export_file(filename: str):
    try:
        file_path = UPLOAD_DIR / filename
        if file_path.exists():
            return {"file_path": str(file_path)}
        return {"error": "File not found"}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)