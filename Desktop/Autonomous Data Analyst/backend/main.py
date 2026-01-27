import os
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil
import os
import json
import re
from dotenv import load_dotenv
from agent import get_agent

load_dotenv()

app = FastAPI(title="The Autonomous Data Analyst")

# CORS Setup - Allow frontend requests
# CORS Setup - Strictly allow ONLY your apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",                                      # For local testing
        "https://autonomous-data-analysis.vercel.app",                # Your main domain
        "https://autonomous-data-analysis-174q.vercel.app",           # Your Vercel deployment ID
        "https://autonomous-data-analysis-n4w7t014m.vercel.app"       # Your other Vercel alias (from screenshots)
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Global state for the active dataset (Simple session handling)
ACTIVE_DATASET_PATH = None

class ChatRequest(BaseModel):
    query: str

@app.on_event("startup")
async def startup_event():
    # Ensure directories exist
    os.makedirs("datasets", exist_ok=True)
    os.makedirs("static", exist_ok=True)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global ACTIVE_DATASET_PATH
    
    # Save the file
    file_path = f"datasets/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    ACTIVE_DATASET_PATH = file_path
    
    return {
        "message": f"Dataset '{file.filename}' processed successfully.",
        "filename": file.filename
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    global ACTIVE_DATASET_PATH
    
    if not ACTIVE_DATASET_PATH:
        raise HTTPException(status_code=400, detail="Please upload a dataset file first.")
        
    question = request.query
    plot_path = "static/plot.json"
    
    # 1. Cleanup old plot if exists to ensure fresh generation
    if os.path.exists(plot_path):
        os.remove(plot_path)
    
    try:
        # 2. Initialize the agent with the current dataset
        agent = get_agent(ACTIVE_DATASET_PATH)
        
        # 3. Run the query
        result = agent.invoke(question)
        answer_text = result.get("output", "Analysis complete.")
        
        # 4. Check if the agent created a plot file
        plot_data = None
        
        if os.path.exists(plot_path):
            with open(plot_path, "r") as f:
                try:
                    # Load the Plotly JSON data
                    plot_data = json.load(f)
                except json.JSONDecodeError:
                    plot_data = None
            
            # OPTIONAL: Delete the file after reading so it doesn't show up for the next unrelated query
            os.remove(plot_path)
                
        # 5. Return BOTH the text answer and the plot data
        return {
            "answer": answer_text,
            "plot": plot_data
        }
        
    except Exception as e:
        error_str = str(e)
        # Check for Rate Limit specific errors
        if "rate limit" in error_str.lower() or "429" in error_str:
            # Try to extract time using regex
            # Look for patterns like "Try again in 4s", "try again in 1m30s", etc.
            match = re.search(r"try again in\s+([0-9a-zA-Z\s]+)", error_str, re.IGNORECASE)
            time_given = match.group(1).strip() if match else "a few seconds"
            
            # Clean up the extracted time string if it has trailing punctuation
            time_given = time_given.rstrip(".,")
            
            custom_msg = f"Rate Limit reached and Please try again in {time_given}"
            print(f"Handled Rate Limit Error: {custom_msg}")
            
            # Return as a successful 200 response with the error message as the answer
            # This ensures the frontend displays it as a bot message instead of a red error toast
            return {
                "answer": custom_msg,
                "plot": None
            }
            
        # Log the full error for debugging
        print(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
