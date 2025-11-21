# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import Base, engine, get_db
from . import models, schemas, auth
from .ai_client import generate_blog_post

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Blog Backend",
    version="1.0.0",
)

# CORS – Orígenes permitidos
origins = [
    "https://martinramirez09.github.io",  # Sin barra al final
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check ---

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/")
def root():
    return {"message": "AI-Blog API is running"}

# --- Auth ---

@app.post("/register", response_model=schemas.AuthorOut, status_code=status.HTTP_201_CREATED)
def register(author_in: schemas.AuthorCreate, db: Session = Depends(get_db)):
    existing = auth.get_author_by_email(db, author_in.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = auth.get_password_hash(author_in.password)
    author = models.Author(email=author_in.email, hashed_password=hashed_password)

    db.add(author)
    db.commit()
    db.refresh(author)

    return author


@app.post("/token", response_model=schemas.Token)
def login_for_access_token(
    form_data: auth.OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    author = auth.authenticate_author(db, form_data.username, form_data.password)
    if not author:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": author.email})
    return {"access_token": access_token, "token_type": "bearer"}


# --- AI & Posts ---

@app.post("/generate-post", response_model=schemas.PostPublic)
async def generate_post(
    post_in: schemas.PostCreate,
    db: Session = Depends(get_db),
    current_author: models.Author = Depends(auth.get_current_author),
):
    ai_result = await generate_blog_post(post_in.prompt)

    title = ai_result.get("title", "Artículo generado")
    body = ai_result.get("body", "")
    seo_description = ai_result.get("seo_description", "")

    post = models.Post(
        title=title,
        body=body,
        seo_description=seo_description,
        author_id=current_author.id,
    )
    db.add(post)
    db.commit()
    db.refresh(post)

    return post


@app.get("/posts", response_model=List[schemas.PostPublic])
def list_posts(db: Session = Depends(get_db)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).all()
    return posts