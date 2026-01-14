from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from brain import get_decision, analyze_image_chart, generate_session_summary
from db import clear_db, get_all_history

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_data(
    query: str = Form(...), 
    file: UploadFile = File(None),
    needs_chart: str = Form("true") # 🆕 Receive Flag
):
    file_content = None
    if file:
        content = await file.read()
        file_content = content.decode("utf-8")
    
    # Convert string to boolean
    chart_flag = needs_chart.lower() == "true"
    
    result = get_decision(query, file_content, needs_chart=chart_flag)
    return result

@app.post("/reset")
async def reset_chat():
    clear_db()
    return {"message": "Memory cleared"}

@app.get("/history")
async def get_chat_history():
    return get_all_history()

@app.get("/summary")
async def get_summary():
    history = get_all_history()
    full_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    if not full_text: return {"error": "No history."}
    return generate_session_summary(full_text)