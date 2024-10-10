# main.py
import csv
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores.faiss import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.documents import Document
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class Chat(BaseModel):
    username: str
    user_id: int
    chat_id: int
    message: str | None = None
origins = [
    "http://localhost:5173",  # Your Vite frontend URL
]
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # You can specify which methods to allow
    allow_headers=["*"],  # You can specify which headers to allow
)


class AddDataRequest(BaseModel):
    documents: list[str]  # List of new texts to add to FAISS

class AddTopicRequest(BaseModel):
    topics: list[str]  # List of topics (user queries) to add to FAISS

class SimilarTopicRequest(BaseModel):
    query: str | None = None  # Optional user query
class SimilarTopicResponse(BaseModel):
    topics: list[str]  # List of the top 3 most similar topics

# Define data model for user input
class ChatRequest(BaseModel):
    query: str
    chat_history: list

# Define response model
class ChatResponse(BaseModel):
    answer: str

class VectorDB:
    def __init__(self, vector_path):
        self.vector_path = vector_path
        self.vector_store = self._load_or_create_vector_store()

    def _load_vector_store(self):
        embedder = OpenAIEmbeddings()
        return FAISS.load_local(
            self.vector_path,
            embedder,
            index_name="index",
            allow_dangerous_deserialization=True
        )
    def _load_or_create_vector_store(self):
        index_file_path = os.path.join(self.vector_path, "index.faiss")

        # Check if the FAISS index file exists
        if not os.path.exists(index_file_path):
            print(f"FAISS index not found. Creating a new one at {self.vector_path}...")

            # Create some sample documents
            documents = [
                Document(page_content="Swinburne University is located in Melbourne, Australia."),
                Document(page_content="The university offers a wide range of undergraduate and postgraduate programs."),
                Document(page_content="Swinburne is known for its focus on innovation, entrepreneurship, and technology."),
                Document(page_content="Swinburne provides various student support services, including counseling and career advice.")
            ]

            # Initialize embeddings
            embedder = OpenAIEmbeddings()

            # Create FAISS index
            vector_store = FAISS.from_documents(documents, embedder)

            # Save the new FAISS index to disk
            vector_store.save_local(self.vector_path)

            print("FAISS index created successfully.")
        else:
            # Load the FAISS index if it exists
            print(f"Loading existing FAISS index from {self.vector_path}...")
            embedder = OpenAIEmbeddings()
            vector_store = FAISS.load_local(
                self.vector_path,
                embedder,
                index_name="index",
                allow_dangerous_deserialization=True
            )
        
        return vector_store

    def get_retriever(self):
        return self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={'k': 1, "score_threshold": 0.1}
        )

class ChatBot:
    def __init__(self, vector_db):
        self.vector_db = vector_db
        self.chain = self._create_chain()

    def _create_chain(self):
        model = ChatOpenAI(model="gpt-4o", temperature=0.5)
        prompt = self._create_prompt()
        document_chain = create_stuff_documents_chain(prompt=prompt, llm=model)
        retriever = self.vector_db.get_retriever()
        return create_retrieval_chain(retriever, document_chain)

    def _create_prompt(self):
        return ChatPromptTemplate.from_messages([
            ('system', """You are an AI assistant exclusively designed for Swinburne University students. Your sole purpose is to provide information directly related to Swinburne University. Here are your strict guidelines:

            # 1. ONLY answer questions based on the given context {context} about Swinburne University.
            # 2. If a question is not specifically about Swinburne University, DO NOT answer it. This includes but is not limited to:
            #    - General knowledge questions (e.g., "Who is the CEO of Google?")
            #    - Weather information
            #    - Current events not related to Swinburne
            #    - Any topic not directly concerning Swinburne University
            # 3. For non-Swinburne questions, respond with: "I'm sorry, but I can only provide information about Swinburne University. If you have any questions related to Swinburne, I'd be happy to help!"
            # 4. Be friendly and supportive, but maintain a professional tone when discussing Swinburne-related topics.
            # 5. If you're unsure about a Swinburne-related answer, say so and suggest where the student might find more information within the university.
            # 6. Do not provide personal opinions or advice. Stick strictly to official Swinburne University information.
            # 7. For sensitive Swinburne-related topics, direct students to appropriate university resources or support services.

            Remember, you are NOT a general-purpose AI. Your knowledge and responses are limited EXCLUSIVELY to Swinburne University-related information."""),

            MessagesPlaceholder('chat_history'),
            ('human', 'Gives greetings'),
            ('system', 'Hi! I am Swinburne Chat Bot. I am a chat assistant designed for the students of Swinburne University. How may I help you?'),
            ('human', '{input}')
        ])

    def process_chat(self, query, chat_history):
        response = self.chain.invoke({
            'input': query,
            'chat_history': chat_history
        })
        return response['answer']


# Initialize the vector database and chatbot once when the app starts
vector_db = VectorDB(vector_path='Swinburne_Chat_Bot')

vector_db_topic = VectorDB(vector_path='Swinburne_Chat_Bot_Topics')
chatbot = ChatBot(vector_db)

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Process the user's chat query using the chatbot
        response = chatbot.process_chat(request.query, request.chat_history)
        return ChatResponse(answer=response)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# You can also define a health check route
@app.get("/health")
def health_check():
    return {"status": "OK"}

@app.post("/add-data")
async def add_data(request: AddDataRequest):
    try:
        # Get documents from the request
        documents = [Document(page_content=text) for text in request.documents]
        
        # Add documents to FAISS
        vector_db.vector_store = FAISS.from_documents(documents, vector_db.vector_store.embedding_function)
        
        # Save the FAISS index to the disk
        vector_db.vector_store.save_local(vector_db.vector_path)
        
        return {"message": "Documents added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while adding data: {str(e)}")

@app.post("/add-topic")
async def add_topic(request: AddTopicRequest):
    try:
        # Convert user topics into Document objects
        new_documents = [Document(page_content=topic) for topic in request.topics]

        print(new_documents)

        # Load the existing FAISS index from the disk, enabling dangerous deserialization
        vector_db_topic.vector_store = FAISS.load_local(vector_db_topic.vector_path, vector_db_topic.vector_store.embedding_function, allow_dangerous_deserialization=True)

        # Append the new documents to the existing vector store
        vector_db_topic.vector_store.add_documents(new_documents)

        # Save the updated FAISS index to the disk
        vector_db_topic.vector_store.save_local(vector_db_topic.vector_path)
        
        
        # Update the topic count in the CSV file
        update_topic_count(request.topics)

        return {"message": "Topics added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred while adding topics: {str(e)}")

@app.post("/similar-topics", response_model=SimilarTopicResponse)
async def get_similar_topics(request: SimilarTopicRequest):
    try:
        if request.query:
            print(request.query)
            # If a query is provided, get the top 3 most similar topics
            search_results = vector_db_topic.vector_store.similarity_search(
                request.query, k=5
            )
            similar_topics = [doc.page_content for doc in search_results]
        else:
            similar_topics = get_most_frequent_topics()

        return SimilarTopicResponse(topics=similar_topics)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")



topics_file = "topics.csv"

def initialize_topics_file():
    if not os.path.exists(topics_file):
        with open(topics_file, mode='w', newline='') as file:
            writer = csv.writer(file)
            writer.writerow(["topic", "count"])

def update_topic_count(new_topics):
    topics_dict = {}
    if os.path.exists(topics_file):
        with open(topics_file, mode='r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                topics_dict[row["topic"]] = int(row["count"])
    
    for topic in new_topics:
        topics_dict[topic] = topics_dict.get(topic, 0) + 1
    
    with open(topics_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["topic", "count"])
        for topic, count in topics_dict.items():
            writer.writerow([topic, count])

def get_most_frequent_topics(n=5):
    topics = []
    if os.path.exists(topics_file):
        with open(topics_file, mode='r') as file:
            reader = csv.DictReader(file)
            sorted_topics = sorted(reader, key=lambda x: int(x["count"]), reverse=True)
            topics = [row["topic"] for row in sorted_topics[:n]]
    return topics
