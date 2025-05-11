from fastapi import FastAPI, UploadFile, File
from PIL import Image
import io
import uvicorn
from google import genai
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change "*" to specific origins like ["http://localhost:3000"] if needed
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

import json

def parse_json_string(json_string):
    # Remove the code block markers
    cleaned_string = json_string.strip("```json").strip("```").strip()
    
    # Parse the JSON string into a Python object
    return json.loads(cleaned_string)

@app.post("/analyze-car/")
async def analyze_car(image: UploadFile = File(...)):
    client = genai.Client(api_key=os.getenv("GENAI_KEY"))
    image_bytes = await image.read()
    img = Image.open(io.BytesIO(image_bytes))
    response = client.models.generate_content( model="gemini-2.0-flash", contents=["describe the cars with clear plate number in json object format including car_type (i.e van, sedan, pickup, etc), color, brand (or hyphen if not recognizable), plate_number in alphanumeric only (or hyphen if not recognizable)", img])
    return {"cars": parse_json_string(response.text)}

@app.get("/")
def read_root():
    return {"message": "Hello, World"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
