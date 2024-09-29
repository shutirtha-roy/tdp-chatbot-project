# main.py
from fastapi import FastAPI
from pydantic import BaseModel
class Chat(BaseModel):
    username: str
    user_id: int
    chat_id: int
    message: str | None = None

app = FastAPI()

@app.get("/")
def main():
    return {
        "message": "Hello, Someone",
        "initialRecommendations": [
            "When was Swiburne built",
            "Swinburne tuition fees",
            "How many departments are there at swinburne"
        ],
    
    }
@app.get("/chats/{chat_id}")
def main():
    return {
        "message": "Hello, Someone",
        "initialRecommendations": [
            {"user","When was Swiburne built"},
            {"bot","1990"},
            {"user","When was Swiburne built"},
            {"bot","1990"},
            {"user","When was Swiburne built"},
            {"bot","1990"},
        ],
       
    }

@app.post("/chats/{chat_id}")
async def main(chat: Chat):
    answer="Answers from chatbot"
    return {
        "message": answer
    }
