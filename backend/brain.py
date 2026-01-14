import os
import json
import pandas as pd
import io
import re
import time
from ddgs import DDGS
from openai import OpenAI
from dotenv import load_dotenv
from db import add_message, get_history_text, clear_db

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise ValueError("GROQ_API_KEY not found! Check your .env file.")

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=api_key
)

# 🧠 GROQ MODELS
LOGIC_MODEL = "llama-3.3-70b-versatile" 
FAST_MODEL = "llama-3.1-8b-instant"     

def clean_json_response(raw_text):
    if not raw_text: return None
    
    # 1. Try to find JSON inside markdown code blocks ```json ... ```
    match = re.search(r"```json\s*(\{.*?\})\s*```", raw_text, re.DOTALL)
    if match: 
        try: return json.loads(match.group(1))
        except: pass

    # 2. Try to find the first '{' and the last '}'
    try:
        start = raw_text.find('{')
        end = raw_text.rfind('}') + 1
        if start != -1 and end != 0:
            json_str = raw_text[start:end]
            return json.loads(json_str)
    except: pass
    
    # 3. Last resort: Try parsing the raw text directly
    try: return json.loads(raw_text)
    except: return None

def normalize_data_for_frontend(json_data):
    if "data" not in json_data: return json_data
    clean_data = []
    for item in json_data["data"]:
        value = 0
        name = "Unknown"
        for k, v in item.items():
            if k == "name": name = str(v)
            elif k == "value": 
                try: value = float(v)
                except: pass
            elif isinstance(v, (int, float)) or (isinstance(v, str) and v.replace('%','').replace('.','').isdigit()):
                try:
                    if isinstance(v, str): v = float(v.replace('%',''))
                    value = v
                except: pass
            elif isinstance(v, str) and name == "Unknown":
                name = v
        clean_data.append({"name": name, "value": value})
    json_data["data"] = clean_data
    return json_data

def search_internet(query):
    print(f"[INFO] Searching internet for: {query}")
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
            if results: return "\n".join([f"- {r['title']}: {r['body']}" for r in results])
    except: pass
    return "No internet results found."

def get_decision(user_query, file_content=None, needs_chart=True):
    # 1. READ CSV
    csv_context = "No CSV uploaded."
    if file_content:
        try:
            df = pd.read_csv(io.StringIO(file_content))
            csv_context = df.head(10).to_markdown(index=False)
        except: csv_context = "Could not read CSV."

    # 2. INTELLIGENT SEARCH TRIGGER
    search_results = ""
    trigger_words = [
        "price", "news", "current", "latest", "stock", "vs", "competitor", 
        "today", "market", "trend", "strategy", "trick", "hack", "growth", "buy", "sell"
    ]
    if any(w in user_query.lower() for w in trigger_words):
        print("[INFO] Business Keyword detected: Triggering Search...")
        search_results = search_internet(user_query)

    # 3. GET HISTORY (Now used in BOTH modes)
    history_text = get_history_text(limit=6)

    # 4. SELECT PROMPT & MODEL
    if not needs_chart:
        # 🚀 FAST MODE (Groq 8B)
        print("[INFO] Generating Strategic Summary (FAST MODE)...")
        final_prompt = f"""
        You are a World-Class Market Analyst.
        
        [HISTORY] {history_text}
        [DATA] {csv_context}
        [EXTERNAL MARKET INFO] {search_results}
        [QUERY] "{user_query}"
        
        INSTRUCTIONS:
        1. Answer the user's question using History, Data, and External Info.
        2. Keep the conversation flowing naturally.
        3. Be concise (max 4 sentences).
        4. Return your response in a JSON object with keys "summary" and "title".
        
        RETURN JSON ONLY: {{ "summary": "Your answer...", "title": "Market Insight" }}
        """
        model_to_use = FAST_MODEL
    else:
        # 🐢 SMART MODE (Groq 70B)
        print("[INFO] Generating Deep Strategy & Chart (LOGIC MODE)...")
        final_prompt = f"""
        You are a Senior Corporate Strategist.
        [HISTORY] {history_text}
        [DATA] {csv_context}
        [EXTERNAL INFO] {search_results}
        [QUERY] "{user_query}"
        
        INSTRUCTIONS:
        1. Analyze data/history/external info.
        2. Determine the UNIT of the data (e.g. "$", "₹", "%", "Users", "kg").
        3. Generate 3 "Killer" follow-up questions.
        4. Return VALID JSON.
        
        FORMAT:
        {{
          "chart_type": "bar" | "line" | "pie",
          "title": "Strategic Visual",
          "unit": "$" | "₹" | "€" | "%" | "" | "Qty",
          "summary": "Executive summary...",
          "data": [ {{"name": "Label", "value": 100}} ],
          "suggestions": ["Strategy 1?", "Market Question?", "Trick?"]
        }}
        """
        model_to_use = LOGIC_MODEL
    
    try:
        # 🛡️ FORCE JSON MODE: This is the fix for the parser error
        completion = client.chat.completions.create(
            model=model_to_use,
            messages=[{"role": "user", "content": final_prompt}],
            response_format={"type": "json_object"} 
        )
        result_json = clean_json_response(completion.choices[0].message.content)
        
        if not result_json: 
            return {"summary": "Analysis complete, but I couldn't format the output. Please try again.", "title": "Error"}

        # Save to DB
        if 'summary' in result_json:
            add_message("user", user_query)
            add_message("ai", result_json['summary'])
        
        return result_json
    except Exception as e:
        print(f"[ERROR] {e}")
        return {"error": str(e)}

def analyze_image_chart(image_bytes):
    return {"error": "Image analysis temporarily disabled for speed."} 

def generate_session_summary(history_text):
    prompt = f"""
    You are a Board Member. Summarize this history: {history_text}
    RETURN JSON: {{ "title": "Executive Briefing", "key_findings": [], "suggestions": [] }}
    """
    try:
        completion = client.chat.completions.create(
            model=LOGIC_MODEL, 
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return clean_json_response(completion.choices[0].message.content)
    except: return {"error": "Failed"}