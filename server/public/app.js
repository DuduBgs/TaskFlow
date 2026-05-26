const statusBox = document.getElementById("statusBox");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const taskForm = document.getElementById("taskForm");
const refreshButton = document.getElementById("refreshButton");
const tasksContainer = document.getElementById("tasks");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const closeModalButton = document.getElementById("closeModalButton");

let token = localStorage.getItem("taskflow_token") || "";
let currentTasks = [];

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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
    currentTasks = payload.data || [];

    if (!currentTasks.length) {
      tasksContainer.innerHTML = "<p>Nenhuma tarefa cadastrada.</p>";
      return;
    }

    tasksContainer.innerHTML = currentTasks
      .map(
        (task) => `
      <div class="task">
        <div class="task-header">
          <strong>${escape(task.title)}</strong>
          <div class="task-actions">
            <button class="ghost btn-edit" data-id="${task.id}" type="button">Editar</button>
            <button class="ghost btn-delete" data-id="${task.id}" type="button">Excluir</button>
          </div>
        </div>
        <small>${escape(task.status)}${task.dueDate ? " | " + escape(task.dueDate) : ""}</small>
        <span>${escape(task.description || "Sem descricao")}</span>
        <small>${task.assignee ? "Responsavel: " + escape(task.assignee) : "Sem responsavel"}</small>
      </div>
    `
      )
      .join("");

    tasksContainer.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const task = currentTasks.find((t) => String(t.id) === btn.dataset.id);
        if (task) openEditModal(task);
      });
    });

    tasksContainer.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => handleDeleteTask(btn.dataset.id));
    });
  } catch (error) {
    tasksContainer.innerHTML = `<p>${error.message}</p>`;
  }
}

function openEditModal(task) {
  editForm.elements.id.value = task.id;
  editForm.elements.title.value = task.title;
  editForm.elements.description.value = task.description || "";
  editForm.elements.dueDate.value = task.dueDate || "";
  editForm.elements.status.value = task.status;
  editForm.elements.assignee.value = task.assignee || "";
  editModal.classList.add("open");
}

function closeEditModal() {
  editModal.classList.remove("open");
  editForm.reset();
}

async function handleEditTask(event) {
  event.preventDefault();
  const formData = new FormData(editForm);
  const id = formData.get("id");

  try {
    await request(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        title: formData.get("title"),
        description: formData.get("description"),
        dueDate: formData.get("dueDate"),
        status: formData.get("status"),
        assignee: formData.get("assignee")
      })
    });

    closeEditModal();
    await loadTasks();
  } catch (error) {
    setStatus(error.message);
  }
}

async function handleDeleteTask(id) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

  try {
    await request(`/api/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
  } catch (error) {
    setStatus(error.message);
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
  currentTasks = [];
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
editForm.addEventListener("submit", handleEditTask);
closeModalButton.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

init();
