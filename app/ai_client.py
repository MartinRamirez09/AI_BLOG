# app/ai_client.py
import os
import json
import google.generativeai as genai

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")


async def generate_blog_post(prompt: str) -> dict:
    """
    Devuelve un dict con:
    {
      "title": "...",
      "body": "...",
      "seo_description": "..."
    }
    """
    model = genai.GenerativeModel(MODEL_NAME)

    full_prompt = f"""
    Eres un generador de artículos de blog.

    A partir del siguiente prompt de usuario:
    \"\"\"{prompt}\"\"\"

    Genera un artículo de blog en español con el siguiente formato JSON ESTRICTO.
    IMPORTANTE:
    - Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin texto antes ni después.
    - El JSON debe tener exactamente estas 3 claves: title, body, seo_description.

    Ejemplo de formato esperado (NO lo devuelvas tal cual, solo respeta la estructura):

    {{
      "title": "Título atractivo para el blog",
      "body": "Cuerpo completo del artículo, con varios párrafos.",
      "seo_description": "Descripción corta optimizada para SEO (máx 150 caracteres)."
    }}
    """

    response = model.generate_content(full_prompt)

    text = response.text.strip()

    # Intentar parsear JSON directamente
    try:
        data = json.loads(text)
        return {
            "title": data.get("title", "Artículo generado"),
            "body": data.get("body", text),
            "seo_description": data.get("seo_description", ""),
        }
    except json.JSONDecodeError:
        # Fallback: si no viene JSON, usamos todo el texto como body
        return {
            "title": "Artículo generado",
            "body": text,
            "seo_description": "",
        }
