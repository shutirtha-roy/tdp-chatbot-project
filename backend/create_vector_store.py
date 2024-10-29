from dotenv import load_dotenv
load_dotenv()
from langchain_community.document_loaders import WebBaseLoader
from langchain_community.vectorstores.faiss import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from urls_list import urls
import os

os.environ["USER_AGENT"] = os.getenv('USER_AGENT')

def storeVector(urls):
    embedder = OpenAIEmbeddings(openai_api_key = os.getenv('OPENAI_API_KEY'))
    splitter = RecursiveCharacterTextSplitter()
    vector_store = None
    splitted_docs = splitter.split_documents(WebBaseLoader(urls).load())
    vector_store = FAISS.from_documents(splitted_docs, embedder)

    return vector_store  

#splitter = RecursiveCharacterTextSplitter()
#embedder = OpenAIEmbeddings(openai_api_key = os.getenv('OPENAI_API_KEY'))

#splitted_docs = splitter.split_documents(WebBaseLoader(urls).load())

#vector_store = FAISS.from_documents(splitted_docs, embedder)
#vector_store.save_local("Swinburne_Chat_Bot")

#vector_store = storeVector(urls)
#vector_store.save_local("Swinburne_Chat_Bot")

#embedder = OpenAIEmbeddings(openai_api_key = os.getenv('OPENAI_API_KEY'))
#old_vector_store = FAISS.load_local('Swinburne_Chat_Bot', embedder, index_name="index", allow_dangerous_deserialization=True)
#vector_store.merge_from(old_vector_store)
#vector_store.save_local("Swinburne_Chat_Bot-6000-6036")


# embedder = OpenAIEmbeddings(openai_api_key = os.getenv('OPENAI_API_KEY'))
# vector_store = FAISS.load_local('Swinburne_Chat_Bot-0-499', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_500_999 = FAISS.load_local('Swinburne_Chat_Bot-500-999', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_1000_1999 = FAISS.load_local('Swinburne_Chat_Bot-1000-1999', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_2000_2500 = FAISS.load_local('Swinburne_Chat_Bot-2000-2500', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_2500_3499 = FAISS.load_local('Swinburne_Chat_Bot-2500-3499', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_3500_4000 = FAISS.load_local('Swinburne_Chat_Bot-3500-4000', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_4000_5000 = FAISS.load_local('Swinburne_Chat_Bot-4000-5000', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_5000_6000 = FAISS.load_local('Swinburne_Chat_Bot-5000-6000', embedder, index_name="index", allow_dangerous_deserialization=True)
# vector_store_6000_6036 = FAISS.load_local('Swinburne_Chat_Bot-6000-6036', embedder, index_name="index", allow_dangerous_deserialization=True)

# vector_store.merge_from(vector_store_500_999)
# vector_store.merge_from(vector_store_1000_1999)
# vector_store.merge_from(vector_store_2000_2500)
# vector_store.merge_from(vector_store_2500_3499)
# vector_store.merge_from(vector_store_3500_4000)
# vector_store.merge_from(vector_store_4000_5000)
# vector_store.merge_from(vector_store_5000_6000)
# vector_store.merge_from(vector_store_6000_6036)
#vector_store.save_local("Swinburne_Chat_Bot")