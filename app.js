// app.js
// URL de tu backend en Render
const API_BASE_URL = "https://ai-blog-ogij.onrender.com";

// --- Referencias del DOM ---
const regEmail = document.getElementById("reg-email");
const regPassword = document.getElementById("reg-password");
const regMsg = document.getElementById("reg-msg");

const loginEmail = document.getElementById("login-email");
const loginPassword = document.getElementById("login-password");
const loginMsg = document.getElementById("login-msg");

const logoutBtn = document.getElementById("btn-logout");

const promptInput = document.getElementById("prompt");
const genMsg = document.getElementById("gen-msg");
const generateSection = document.getElementById("generate-section");

const postsContainer = document.getElementById("posts-container");

// --- Eventos ---
document.getElementById("btn-register").addEventListener("click", register);
document.getElementById("btn-login").addEventListener("click", login);
document.getElementById("btn-generate").addEventListener("click", generatePost);
logoutBtn.addEventListener("click", logout);

// --- Estado ---
let token = localStorage.getItem("access_token") || null;
updateUI();
loadPosts();

// ---------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------
function updateUI() {
  if (token) {
    generateSection.style.display = "block";
    logoutBtn.style.display = "inline-block";
    loginMsg.textContent = "Sesión iniciada.";
  } else {
    generateSection.style.display = "none";
    logoutBtn.style.display = "none";
  }
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
async function register() {
  regMsg.textContent = "";

  const body = {
    email: regEmail.value,
    password: regPassword.value,
  };

  if (!body.email || !body.password) {
    regMsg.textContent = "Llena todos los campos.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      regMsg.textContent = data.detail || "Error al registrar.";
      return;
    }

    regMsg.textContent = "Usuario registrado: " + data.email;
    regEmail.value = "";
    regPassword.value = "";
  } catch (err) {
    console.error(err);
    regMsg.textContent = "Error de red.";
  }
}

async function login() {
  loginMsg.textContent = "";

  const formData = new URLSearchParams();
  formData.append("username", loginEmail.value);
  formData.append("password", loginPassword.value);

  if (!loginEmail.value || !loginPassword.value) {
    loginMsg.textContent = "Llena todos los campos.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      loginMsg.textContent = data.detail || "Error al iniciar sesión.";
      return;
    }

    token = data.access_token;
    localStorage.setItem("access_token", token);
    loginMsg.textContent = "Login exitoso.";
    updateUI();
  } catch (err) {
    console.error(err);
    loginMsg.textContent = "Error de red.";
  }
}

function logout() {
  token = null;
  localStorage.removeItem("access_token");
  loginMsg.textContent = "Sesión cerrada.";
  updateUI();
}

// ---------------------------------------------------------------------
// Generar post (endpoint protegido)
// ---------------------------------------------------------------------
async function generatePost() {
  genMsg.textContent = "";

  if (!token) {
    genMsg.textContent = "Debes iniciar sesión.";
    return;
  }

  const body = { prompt: promptInput.value };

  if (!body.prompt.trim()) {
    genMsg.textContent = "Escribe un prompt primero.";
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/generate-post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      genMsg.textContent = data.detail || "Error al generar el artículo.";
      return;
    }

    genMsg.textContent = "Artículo generado y guardado: " + data.title;
    promptInput.value = "";
    loadPosts();
  } catch (err) {
    console.error(err);
    genMsg.textContent = "Error de red.";
  }
}

// ---------------------------------------------------------------------
// Limpieza de contenido viejo (cuando viene como JSON en un string)
// ---------------------------------------------------------------------
function extractJsonFromBody(rawBody) {
  if (!rawBody) return null;

  // Quitamos posibles ```json ``` al inicio/fin
  let text = rawBody.trim();
  if (text.startsWith("```")) {
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
  }

  // Intentar encontrar un bloque JSON dentro del texto
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonCandidate = text.slice(firstBrace, lastBrace + 1);

  try {
    const obj = JSON.parse(jsonCandidate);
    return obj;
  } catch (e) {
    return null;
  }
}

// ---------------------------------------------------------------------
// Cargar posts públicos
// ---------------------------------------------------------------------
async function loadPosts() {
  postsContainer.innerHTML = "<p>Cargando artículos...</p>";

  try {
    const res = await fetch(`${API_BASE_URL}/posts`);
    const posts = await res.json();

    if (!res.ok) {
      postsContainer.innerHTML = "<p>Error al cargar los artículos.</p>";
      return;
    }

    if (!posts.length) {
      postsContainer.innerHTML = "<p>No hay artículos aún.</p>";
      return;
    }

    postsContainer.innerHTML = "";

    posts.forEach((post) => {
      let title = post.title || "Artículo";
      let bodyText = post.body || "";

      // Si el body parece contener JSON embebido (viejos registros),
      // intentamos extraer "title" y "body" del JSON:
      const embedded = extractJsonFromBody(bodyText);
      if (embedded) {
        if (embedded.title && title === "Artículo generado") {
          // Si el título guardado es genérico, usamos el del JSON
          title = embedded.title;
        }
        if (embedded.body) {
          bodyText = embedded.body;
        }
      }

      // Crear elementos
      const div = document.createElement("div");
      div.className = "post";

      const titleEl = document.createElement("div");
      titleEl.className = "post-title";
      titleEl.textContent = title;

      const meta = document.createElement("div");
      meta.className = "post-meta";
      const date = new Date(post.created_at);
      meta.textContent = `Publicado: ${date.toLocaleString()} · Autor ID: ${post.author_id}`;

      const bodyEl = document.createElement("div");
      bodyEl.className = "post-body";
      bodyEl.textContent = bodyText; // solo el texto limpio

      div.appendChild(titleEl);
      div.appendChild(meta);
      div.appendChild(bodyEl);
      postsContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    postsContainer.innerHTML = "<p>Error de red al cargar artículos.</p>";
  }
}
