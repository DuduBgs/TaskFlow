const statusBox = document.getElementById("statusBox");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const logoutButton = document.getElementById("logoutButton");
const taskForm = document.getElementById("taskForm");
const refreshButton = document.getElementById("refreshButton");
const editModal = document.getElementById("editModal");
const editForm = document.getElementById("editForm");
const closeModalButton = document.getElementById("closeModalButton");
const searchInput = document.getElementById("searchInput");

let token = localStorage.getItem("taskflow_token") || "";
let currentTasks = [];
let draggedId = null;

const COLUMNS = {
  "pendente":     { cardsId: "col-pendente",      countId: "count-pendente" },
  "em andamento": { cardsId: "col-em-andamento",  countId: "count-andamento" },
  "concluida":    { cardsId: "col-concluida",      countId: "count-concluida" }
};

function escape(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Falha na requisicao");
  }

  return payload;
}

function buildCard(task) {
  const card = document.createElement("div");
  card.className = "kanban-card";
  card.dataset.id = task.id;
  card.draggable = true;

  card.addEventListener("dragstart", () => {
    draggedId = String(task.id);
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  card.innerHTML = `
    <div class="card-title">${escape(task.title)}</div>
    ${task.description ? `<div class="card-desc">${escape(task.description)}</div>` : ""}
    <div class="card-footer">
      <span class="card-due">${task.dueDate ? "&#128197; " + escape(task.dueDate) : ""}</span>
      <div class="card-assignee" title="${escape(task.assignee || "Sem responsavel")}">${initials(task.assignee)}</div>
    </div>
    <div class="card-actions">
      <button class="ghost btn-edit" data-id="${task.id}" type="button">Editar</button>
      <button class="ghost btn-delete" data-id="${task.id}" type="button">Excluir</button>
    </div>
  `;

  card.querySelector(".btn-edit").addEventListener("click", () => openEditModal(task));
  card.querySelector(".btn-delete").addEventListener("click", () => handleDeleteTask(task.id));

  return card;
}

function filterTasks(tasks) {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return tasks;
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      (t.assignee && t.assignee.toLowerCase().includes(query))
  );
}

function setEmptyColumns(message) {
  Object.values(COLUMNS).forEach(({ cardsId }) => {
    document.getElementById(cardsId).innerHTML = `<p class="empty-col">${message}</p>`;
  });
}

async function loadTasks() {
  setEmptyColumns("Carregando...");

  try {
    const payload = await request("/api/tasks");
    currentTasks = payload.data || [];

    const counts = { "pendente": 0, "em andamento": 0, "concluida": 0 };
    Object.values(COLUMNS).forEach(({ cardsId }) => {
      document.getElementById(cardsId).innerHTML = "";
    });

    const visible = filterTasks(currentTasks);

    if (!visible.length) {
      setEmptyColumns(currentTasks.length ? "Nenhum resultado para a busca." : "Nenhuma tarefa");
    } else {
      visible.forEach((task) => {
        const status = task.status in COLUMNS ? task.status : "pendente";
        counts[status]++;
        document.getElementById(COLUMNS[status].cardsId).appendChild(buildCard(task));
      });
    }

    Object.entries(COLUMNS).forEach(([status, { countId, cardsId }]) => {
      document.getElementById(countId).textContent =
        searchInput.value.trim()
          ? (document.getElementById(cardsId).querySelectorAll(".kanban-card").length)
          : counts[status];

      const col = document.getElementById(cardsId);
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        col.classList.add("drag-over");
      });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", async () => {
        col.classList.remove("drag-over");
        if (!draggedId) return;
        const task = currentTasks.find((t) => String(t.id) === draggedId);
        if (!task || task.status === status) return;
        try {
          await request(`/api/tasks/${draggedId}`, {
            method: "PUT",
            body: JSON.stringify({ status })
          });
          await loadTasks();
        } catch (error) {
          setStatus(error.message);
        }
      });
    });
  } catch (error) {
    setEmptyColumns(error.message);
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
  setStatus("Desconectado");
  setEmptyColumns("Faca login para ver tarefas.");
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
    setEmptyColumns("Faca login para ver tarefas.");
  }
}

registerForm.addEventListener("submit", handleRegister);
loginForm.addEventListener("submit", handleLogin);
logoutButton.addEventListener("click", handleLogout);
taskForm.addEventListener("submit", handleCreateTask);
refreshButton.addEventListener("click", loadTasks);
searchInput.addEventListener("input", loadTasks);
editForm.addEventListener("submit", handleEditTask);
closeModalButton.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => {
  if (e.target === editModal) closeEditModal();
});

init();
