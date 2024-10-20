from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage

class ChatBot:
    def __init__(self, vector_db):
        self.vector_db = vector_db
        self.chain = self._create_chain()
        self.chat_history = []

    def _create_chain(self):
        model = ChatOpenAI(model="gpt-4-0125-preview", temperature=0.5)
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
    
    def generate_similar_questions(self, query):
        prompt = f"Generate 3 similar questions in bullet points related to: '{query}'. The questions should be about Swinburne University."
        response = self.process_chat(prompt, [])
        return response.split('\n')
    
    def process_chat_with_similar_questions(self, query):
        similar_questions = self.generate_similar_questions(query)
        return "*".join(similar_questions)
    
    def process_user_input(self, user_input):
        self.chat_history.append(HumanMessage(content=user_input))
        ai_output = self.process_chat(user_input, self.chat_history)
        self.chat_history.append(AIMessage(content=ai_output))
        similar_questions = self.process_chat_with_similar_questions(user_input)
        return ai_output, similar_questions