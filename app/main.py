from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import auth, entries, holidays, validation, user

app = FastAPI(
    title="Time Tracking API",
    description="API para controle de horas trabalhadas e ausências",
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(entries.router, prefix="/api", tags=["entries"])
app.include_router(holidays.router, prefix="/api/holidays", tags=["holidays"])
app.include_router(validation.router, prefix="/api", tags=["validation"])
app.include_router(user.router, prefix="/api/user", tags=["user"])

@app.get("/")
async def root():
    return {
        "message": "Time Tracking API",
        "docs": "/docs",
        "redoc": "/redoc"
    }
