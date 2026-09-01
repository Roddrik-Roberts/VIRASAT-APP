import os
import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

# ============================================================
# LOAD .ENV FROM THE BACKEND FOLDER
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE, override=True)

# Correct variable is GROQ_API_KEY.
# GROK_API_KEY is accepted too, in case the .env was named that way.
GROQ_API_KEY = (
    os.getenv("GROQ_API_KEY")
    or os.getenv("GROK_API_KEY")
)

print("================================================")
print("VIRASAT BACKEND STARTING")
print("================================================")
print("Backend folder:", BASE_DIR)
print(".env found:", ENV_FILE.exists())
print("Groq key found:", bool(GROQ_API_KEY))

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY was NOT found.")
    print("Put this in backend/.env:")
    print("GROQ_API_KEY=your_groq_api_key")
else:
    print("Groq API key loaded.")

# ============================================================
# DATA
# ============================================================

from data import (
    HERITAGE_DATA_3COL,
    MAP_SITES,
    DISHES,
    EVENTS_DATA,
)

# ============================================================
# APP
# ============================================================

app = FastAPI(title="Virasat Heritage API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# GROQ
# ============================================================

client = None

if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
        print("Groq client initialized.")
    except Exception as e:
        print("Groq client initialization failed:", repr(e))

# ============================================================
# MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str

# ============================================================
# HEALTH
# ============================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "Virasat Heritage API",
        "ai": "Groq",
        "groq_configured": bool(GROQ_API_KEY),
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "groq_configured": bool(GROQ_API_KEY),
    }

# ============================================================
# DATA ENDPOINTS
# ============================================================

@app.get("/api/states")
def get_states():
    return list(HERITAGE_DATA_3COL.keys())


@app.get("/api/heritage/{state}")
def get_state_heritage(state: str):
    if state not in HERITAGE_DATA_3COL:
        return {"error": "State not found"}

    return {
        "state": state,
        "sites": HERITAGE_DATA_3COL.get(state, []),
        "dishes": DISHES.get(state, []),
    }


@app.get("/api/map-sites")
def get_map_sites():
    return MAP_SITES


@app.get("/api/events")
def get_events():
    return EVENTS_DATA

# ============================================================
# GROQ CHAT
# ============================================================

@app.post("/api/ai/chat")
async def ai_chat(req: ChatRequest):

    if not GROQ_API_KEY or client is None:
        raise HTTPException(
            status_code=500,
            detail=(
                "GROQ_API_KEY is missing. "
                "Check backend/.env and restart the backend."
            ),
        )

    message = req.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Please enter a question.",
        )

    prompt = f"""
You are Virasat AI, an expert guide for Indian heritage,
history, monuments, architecture, culture, traditions,
festivals, and regional delicacies.

User question:
{message}

Rules:
- Answer accurately and naturally.
- Keep the answer concise.
- Give useful historical or cultural context.
- Do not invent facts.
"""

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Virasat AI, a helpful Indian heritage "
                        "and culture guide. Be concise and factual."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.4,
            max_tokens=300,
        )

        reply = completion.choices[0].message.content

        if not reply:
            raise HTTPException(
                status_code=502,
                detail="Groq returned an empty response.",
            )

        return {"reply": reply}

    except HTTPException:
        raise

    except Exception as e:
        error = str(e)

        print("================================================")
        print("Groq API ERROR")
        print(error)
        print("================================================")

        lower = error.lower()

        if "401" in error or "invalid api key" in lower or "authentication" in lower:
            raise HTTPException(
                status_code=401,
                detail="Groq API key is invalid. Check GROQ_API_KEY in backend/.env.",
            )

        if "429" in error or "rate limit" in lower:
            raise HTTPException(
                status_code=429,
                detail="Groq rate limit reached. Please try again shortly.",
            )

        if "403" in error or "permission" in lower:
            raise HTTPException(
                status_code=403,
                detail="Groq denied access to this model/API key.",
            )

        if "404" in error or "not found" in lower:
            raise HTTPException(
                status_code=404,
                detail="Groq model was not found. The configured model is openai/gpt-oss-20b.",
            )

        raise HTTPException(
            status_code=500,
            detail=f"Groq error: {error}",
        )

# ============================================================
# GROQ TRIVIA
# ============================================================

@app.get("/api/ai/trivia/{state_name}")
async def get_trivia(state_name: str):

    if not GROQ_API_KEY or client is None:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is missing.",
        )

    prompt = f"""
Create exactly one multiple-choice trivia question about the
heritage, monuments, history, architecture, culture, or traditions
of {state_name}, India.

Return ONLY valid JSON:

{{
  "question": "string",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": "correct exact option string",
  "fact": "one short interesting fact"
}}
"""

    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": "Return only valid JSON. No markdown.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=300,
        )

        return json.loads(
            completion.choices[0].message.content
        )

    except Exception as e:
        print("Groq Trivia Error:", str(e))
        raise HTTPException(
            status_code=500,
            detail=f"Groq trivia error: {e}",
        )

# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
