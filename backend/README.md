Fast API

1. Create a virtual env 
python -m venv venv
2. active your env. 
    Windows
venv\Scripts\activate
    macOS/Linux
source venv/bin/activate
3. Install dependencies
pip install -r requirements.txt

# Run the FastAPI app
uvicorn main:app --reload