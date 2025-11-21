// app.js
// CAMBIA esto si tu backend tiene otra URL
const API_BASE_URL = "https://martinramirez09.github.io";

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

document.getElementById("btn-register").addEventListener("click", register);
document.getElementById("btn-login").addEventListener("click", login);
document.getElementById("btn-generate").addEventListener("click", generatePost);
logoutBtn.addEventListener("click", logout);

let token = localStorage.getItem("access_token") || null;
updateUI();
loadPosts();

// --- UI helpers ---
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

// --- Auth ---
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

// --- Generate post (protegido) ---
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

// --- Posts públicos ---
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
      const div = document.createElement("div");
      div.className = "post";

      const title = document.createElement("div");
      title.className = "post-title";
      title.textContent = post.title;

      const meta = document.createElement("div");
      meta.className = "post-meta";
      const date = new Date(post.created_at);
      meta.textContent = `Publicado: ${date.toLocaleString()} · Autor ID: ${post.author_id}`;

      const body = document.createElement("div");
      body.className = "post-body";
      body.textContent = post.body;

      div.appendChild(title);
      div.appendChild(meta);
      div.appendChild(body);
      postsContainer.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    postsContainer.innerHTML = "<p>Error de red al cargar artículos.</p>";
  }
}
