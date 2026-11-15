import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    print(f"Starting SkillBridge AI Microservice on http://{host}:{port}")
    uvicorn.run("app.main:app", host=host, port=port, reload=debug)

