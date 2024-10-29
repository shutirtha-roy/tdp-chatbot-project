from fastapi import APIRouter, HTTPException
from models import ChatRequest, ChatResponse, AddDataRequest, AddTopicRequest, SimilarTopicRequest, SimilarTopicResponse
from database import VectorDB
from chatbot import ChatBot
from utils import update_topic_count, get_most_frequent_topics
from langchain_core.documents import Document

router = APIRouter()

vector_db = VectorDB(vector_path='Swinburne_Chat_Bot')
vector_db_topic = VectorDB(vector_path='Swinburne_Chat_Bot_Topics')
chatbot = ChatBot(vector_db)

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        answer, similar_questions = chatbot.process_user_input(request.query)
        return ChatResponse(answer=answer, similar_questions=similar_questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/health")
def health_check():
    return {"status": "OK"}

# this is for adding data to the database, for testing only since the database is large
@router.post("/add-data")
async def add_data(request: AddDataRequest):
    try:
        documents = [Document(page_content=text) for text in request.documents]
        vector_db.add_documents(documents)
        return {"message": "Documents added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while adding data: {str(e)}")

# this is for adding topics
@router.post("/add-topic")
async def add_topic(request: AddTopicRequest):
    try:
        topics=[(chatbot.checkQuerySpelling(topic)).strip('\"') for topic in request.topics]
        print(topics)
        new_documents = [Document(page_content=topic) for topic in topics]
        vector_db_topic.add_documents(new_documents)
        update_topic_count(topics)
        return {"message": "Topics added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while adding topics: {str(e)}")

@router.post("/similar-topics", response_model=SimilarTopicResponse)
async def get_similar_topics(request: SimilarTopicRequest):
    try:
        if request.query:

            # Get result from OpenAI if there is a chat history
            chatbotResponse= chatbot.generate_similar_questionsWithFormat(request.query)
            similar_topics = chatbotResponse
            # Get result from db
            # search_results = vector_db_topic.similarity_search(request.query, k=4)
            # similar_topics = [doc.page_content for doc in search_results]
        else:
            
            similar_topics = get_most_frequent_topics()
        return SimilarTopicResponse(topics=similar_topics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")