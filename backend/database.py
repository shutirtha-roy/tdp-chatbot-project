import os
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores.faiss import FAISS
from langchain_core.documents import Document
from dotenv import load_dotenv
load_dotenv()

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

        if not os.path.exists(index_file_path):
            print(f"FAISS index not found. Creating a new one at {self.vector_path}...")
            documents = [
                Document(page_content="Swinburne University is located in Melbourne, Australia."),
                Document(page_content="The university offers a wide range of undergraduate and postgraduate programs."),
                Document(page_content="Swinburne is known for its focus on innovation, entrepreneurship, and technology."),
                Document(page_content="Swinburne provides various student support services, including counseling and career advice.")
            ]
            embedder = OpenAIEmbeddings()
            vector_store = FAISS.from_documents(documents, embedder)
            vector_store.save_local(self.vector_path)
            print("FAISS index created successfully.")
        else:
            print(f"Loading existing FAISS index from {self.vector_path}...")
            vector_store = self._load_vector_store()
        
        return vector_store

    def get_retriever(self):
        return self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={'k': 1, "score_threshold": 0.1}
        )

    def add_documents(self, documents):
        self.vector_store.add_documents(documents)
        self.vector_store.save_local(self.vector_path)

    def similarity_search(self, query, k=5):
        return self.vector_store.similarity_search(query, k=k)