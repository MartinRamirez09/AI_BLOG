# app/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# --- Auth ---

class AuthorBase(BaseModel):
    email: EmailStr


class AuthorCreate(AuthorBase):
    password: str


class AuthorOut(AuthorBase):
    id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# --- Posts ---

class PostBase(BaseModel):
    title: str
    body: str
    seo_description: Optional[str] = None


class PostCreate(BaseModel):
    prompt: str


class PostPublic(PostBase):
    id: int
    created_at: datetime
    author_id: int

    class Config:
        from_attributes = True


class PostList(BaseModel):
    posts: List[PostPublic]
