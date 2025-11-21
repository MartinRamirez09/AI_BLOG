# app/ai_client.py
import os
import json
import google.generativeai as genai
import markdown  # <-- NUEVO: Para limpiar y formatear el texto

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
    \"\"\"{prompt}\"\"\"\

    Genera un artículo de blog en español con el siguiente formato JSON ESTRICTO.
    IMPORTANTE:
    - Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin texto antes ni después.
    - El JSON debe tener exactamente estas 3 claves: title, body, seo_description.
    """

    response = model.generate_content(full_prompt)

    text = response.text.strip()

    try:
        data = json.loads(text)

        # Convertir Markdown -> HTML limpio y sin escapes raros
        clean_title = markdown.markdown(data.get("title", "Artículo generado"))
        clean_body = markdown.markdown(data.get("body", ""))
        clean_seo = markdown.markdown(data.get("seo_description", ""))

        return {
            "title": clean_title,
            "body": clean_body,
            "seo_description": clean_seo,
        }

    except json.JSONDecodeError:
        # Si Gemini no devuelve JSON, al menos limpiamos el texto
        clean_body = markdown.markdown(text)
        return {
            "title": "Artículo generado",
            "body": clean_body,
            "seo_description": "",
        }
