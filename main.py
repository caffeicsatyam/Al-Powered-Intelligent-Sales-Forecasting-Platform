from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from router import leads, analysis


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Sales AI",
    description="AI Sales Assistant and Lead Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan

)

# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]

)


# REGISTER ROUTERS
app.include_router(leads.router)
app.include_router(analysis.router)

@app.get("/")
def home():
    return {
        "message": "SalesGenie AI Backend Running Successfully"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }