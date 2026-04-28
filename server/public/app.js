const statusBox = document.getElementById("statusBox");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const taskForm = document.getElementById("taskForm");
const refreshButton = document.getElementById("refreshButton");
const tasksContainer = document.getElementById("tasks");

let token = localStorage.getItem("taskflow_token") || "";

function setStatus(message, isAuthed = false) {
  statusBox.textContent = message;
  statusBox.style.borderColor = isAuthed ? "#e04f2a" : "rgba(20, 18, 16, 0.12)";
}

function setToken(value) {
  token = value;
  if (token) {
    localStorage.setItem("taskflow_token", token);
  } else {
    localStorage.removeItem("taskflow_token");
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error || "Falha na requisicao";
    throw new Error(message);
  }

  return payload;
}

async function loadTasks() {
  tasksContainer.innerHTML = "<p>Carregando...</p>";

  try {
    const payload = await request("/api/tasks");
    const tasks = payload.data || [];

    if (!tasks.length) {
      tasksContainer.innerHTML = "<p>Nenhuma tarefa cadastrada.</p>";
      return;
    }

    tasksContainer.innerHTML = tasks
      .map(
        (task) => `
      <div class="task">
        <strong>${task.title}</strong>
        <small>${task.status} ${task.dueDate ? "| " + task.dueDate : ""}</small>
        <span>${task.description || "Sem descricao"}</span>
        <small>${task.assignee ? "Responsavel: " + task.assignee : "Sem responsavel"}</small>
      </div>
    `
      )
      .join("");
  } catch (error) {
    tasksContainer.innerHTML = `<p>${error.message}</p>`;
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(registerForm);

  try {
    const payload = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    setToken(payload.token);
    setStatus(`Conectado: ${payload.data.name}`, true);
    await loadTasks();
    registerForm.reset();
  } catch (error) {
    setStatus(error.message);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(loginForm);

  try {
    const payload = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      })
    });

    setToken(payload.token);
    setStatus(`Conectado: ${payload.data.name}`, true);
    await loadTasks();
    loginForm.reset();
  } catch (error) {
    setStatus(error.message);
  }
}

async function handleLogout() {
  setToken("");
  tasksContainer.innerHTML = "<p>Desconectado.</p>";
  setStatus("Desconectado");
}

async function handleCreateTask(event) {
  event.preventDefault();
  const formData = new FormData(taskForm);

  try {
    await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        dueDate: formData.get("dueDate"),
        status: formData.get("status"),
        assignee: formData.get("assignee")
      })
    });

    taskForm.reset();
    await loadTasks();
  } catch (error) {
    setStatus(error.message);
  }
}

function init() {
  if (token) {
    setStatus("Sessao ativa", true);
    loadTasks();
  } else {
    setStatus("Desconectado");
    tasksContainer.innerHTML = "<p>Faca login para ver tarefas.</p>";
  }
}

registerForm.addEventListener("submit", handleRegister);
loginForm.addEventListener("submit", handleLogin);
logoutButton.addEventListener("click", handleLogout);
taskForm.addEventListener("submit", handleCreateTask);
refreshButton.addEventListener("click", loadTasks);

init();