from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import router
from .logging_config import logger
from .config import settings

logger.info("Starting Fake Review Detection API...")

app = FastAPI(
    title=settings.app_name,
    description="AI-powered fake review detection API using a fine-tuned BERT model and LIME explanations.",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Fake Review Detection API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
