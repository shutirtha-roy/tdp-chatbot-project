from pydantic import BaseModel

class Chat(BaseModel):
    username: str
    user_id: int
    chat_id: int
    message: str | None = None

class AddDataRequest(BaseModel):
    documents: list[str]

class AddTopicRequest(BaseModel):
    topics: list[str]

class SimilarTopicRequest(BaseModel):
    query: str | None = None

class SimilarTopicResponse(BaseModel):
    topics: list[str]

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    similar_questions: str