import os
from dotenv import load_dotenv
import streamlit as st
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores.faiss import FAISS
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage

load_dotenv()

class VectorDB:
    def __init__(self, vector_path):
        self.vector_path = vector_path
        self.vector_store = self._load_vector_store()

    def _load_vector_store(self):
        embedder = OpenAIEmbeddings()
        return FAISS.load_local(
            self.vector_path,
            embedder,
            index_name="index",
            allow_dangerous_deserialization=True
        )

    def get_retriever(self):
        return self.vector_store.as_retriever(
            search_type="mmr",
            search_kwargs={'k': 1, "score_threshold": 0.1}
        )

    # def similarity_search(self, query):
    #     return self.vector_store.similarity_search_with_score(
    #         query,
    #         search_type="similarity",
    #         k=1
    #     )[0][1]

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

            1. ONLY answer questions based on the given context {context} about Swinburne University.
            2. If a question is not specifically about Swinburne University, DO NOT answer it. This includes but is not limited to:
               - General knowledge questions (e.g., "Who is the CEO of Google?")
               - Weather information
               - Current events not related to Swinburne
               - Any topic not directly concerning Swinburne University
            3. For non-Swinburne questions, respond with: "I'm sorry, but I can only provide information about Swinburne University. If you have any questions related to Swinburne, I'd be happy to help!"
            4. Be friendly and supportive, but maintain a professional tone when discussing Swinburne-related topics.
            5. If you're unsure about a Swinburne-related answer, say so and suggest where the student might find more information within the university.
            6. Do not provide personal opinions or advice. Stick strictly to official Swinburne University information.
            7. For sensitive Swinburne-related topics, direct students to appropriate university resources or support services.

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

class ChatInterface:
    def __init__(self, chatbot):
        self.chatbot = chatbot
        self.chat_history = []

    def setup_page(self):
        st.set_page_config(page_title="Chat With Swinburne FAQ", page_icon="🎓")
        st.header("Chat With Swinburne FAQ 🎓")

    def display_chat_history(self):
        for msg in reversed(self.chat_history):
            if isinstance(msg, HumanMessage):
                st.chat_message("user", avatar="🧑").markdown(f"**You:** {msg.content}")
            else:
                st.chat_message("assistant", avatar="🤖").markdown(f"**FAQ:** {msg.content}")

    def get_user_input(self):
        with st.form(key='user_input_form', clear_on_submit=True):
            user_input = st.text_input("Ask me anything:", placeholder="Type your message and press Enter")
            submit_button = st.form_submit_button(label='Send')
        return user_input if submit_button else None

    def process_user_input(self, user_input):
        with st.spinner('FAQ Chatbot is thinking...'):
            self.chat_history.append(HumanMessage(content=user_input))
            ai_output = self.chatbot.process_chat(user_input, self.chat_history)
            self.chat_history.append(AIMessage(content=ai_output))

    def run(self):
        self.setup_page()
        user_input = self.get_user_input()
        if user_input:
            self.process_user_input(user_input)
        self.display_chat_history()

def main():
    vector_db = VectorDB(vector_path='Swinburne_Chat_Bot')
    chatbot = ChatBot(vector_db)
    interface = ChatInterface(chatbot)
    interface.run()

if __name__ == '__main__':
    main()