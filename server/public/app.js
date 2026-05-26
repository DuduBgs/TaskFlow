// ── DOM ──────────────────────────────────────────────────────────────────────

const authScreen       = document.getElementById("authScreen");
const appScreen        = document.getElementById("appScreen");
const authError        = document.getElementById("authError");
const loginForm        = document.getElementById("loginForm");
const registerForm     = document.getElementById("registerForm");
const tabLogin         = document.getElementById("tabLogin");
const tabRegister      = document.getElementById("tabRegister");
const taskForm         = document.getElementById("taskForm");
const refreshButton    = document.getElementById("refreshButton");
const editModal        = document.getElementById("editModal");
const editForm         = document.getElementById("editForm");
const closeModalButton = document.getElementById("closeModalButton");
const searchInput      = document.getElementById("searchInput");
const userAvatar       = document.getElementById("userAvatar");

// ── Estado ───────────────────────────────────────────────────────────────────

let token        = localStorage.getItem("taskflow_token") || "";
let currentTasks = [];
let draggedId    = null;

const COLUMNS = {
  "pendente":     { cardsId: "col-pendente",     countId: "count-pendente"  },
  "em andamento": { cardsId: "col-em-andamento", countId: "count-andamento" },
  "concluida":    { cardsId: "col-concluida",    countId: "count-concluida" }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function escape(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function initials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function dueBadge(dueDate, status) {
  if (!dueDate || status === "concluida") return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due  = new Date(dueDate + "T00:00:00");
  const diff = Math.ceil((due - today) / 86400000);
  if (diff < 0) return '<span class="badge badge-atrasado">Atrasado</span>';
  if (diff <= 3) return '<span class="badge badge-urgente">Urgente</span>';
  return "";
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
  const payload  = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || "Falha na requisicao");
  }

  return payload;
}

// ── Navegacao entre telas ─────────────────────────────────────────────────────

function showAuthScreen() {
  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
  authError.textContent = "";
}

function showAppScreen(name) {
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  userAvatar.textContent = initials(name);
  userAvatar.title = `${name} — clique para sair`;
}

// ── Tabs de autenticacao ──────────────────────────────────────────────────────

function switchTab(tab) {
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  loginForm.classList.toggle("hidden", !isLogin);
  registerForm.classList.toggle("hidden", isLogin);
  authError.textContent = "";
}

// ── Kanban ────────────────────────────────────────────────────────────────────

function filterTasks(tasks) {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return tasks;
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query) ||
      (t.assignee?.toLowerCase().includes(query))
  );
}

function setEmptyColumns(message) {
  Object.values(COLUMNS).forEach(({ cardsId }) => {
    document.getElementById(cardsId).innerHTML = `<p class="empty-col">${message}</p>`;
  });
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
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  card.innerHTML = `
    <div class="card-title">${escape(task.title)}${dueBadge(task.dueDate, task.status)}</div>
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

async function loadTasks() {
  setEmptyColumns("Carregando...");

  try {
    const payload = await request("/api/tasks");
    currentTasks  = payload.data || [];

    const counts = { "pendente": 0, "em andamento": 0, "concluida": 0 };
    Object.values(COLUMNS).forEach(({ cardsId }) => {
      document.getElementById(cardsId).innerHTML = "";
    });

    const visible = filterTasks(currentTasks);

    if (visible.length === 0) {
      setEmptyColumns(currentTasks.length ? "Nenhum resultado para a busca." : "Nenhuma tarefa");
    } else {
      visible.forEach((task) => {
        const status = task.status in COLUMNS ? task.status : "pendente";
        counts[status]++;
        document.getElementById(COLUMNS[status].cardsId).appendChild(buildCard(task));
      });
    }

    Object.entries(COLUMNS).forEach(([status, { countId, cardsId }]) => {
      document.getElementById(countId).textContent = searchInput.value.trim()
        ? document.getElementById(cardsId).querySelectorAll(".kanban-card").length
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
        } finally {
          await loadTasks();
        }
      });
    });
  } catch (error) {
    setEmptyColumns(error.message);
  }
}

// ── Modal de edicao ───────────────────────────────────────────────────────────

function openEditModal(task) {
  editForm.elements.id.value          = task.id;
  editForm.elements.title.value       = task.title;
  editForm.elements.description.value = task.description || "";
  editForm.elements.dueDate.value     = task.dueDate || "";
  editForm.elements.status.value      = task.status;
  editForm.elements.assignee.value    = task.assignee || "";
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
        title:       formData.get("title"),
        description: formData.get("description"),
        dueDate:     formData.get("dueDate"),
        status:      formData.get("status"),
        assignee:    formData.get("assignee")
      })
    });
    closeEditModal();
  } finally {
    await loadTasks();
  }
}

async function handleDeleteTask(id) {
  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
  try {
    await request(`/api/tasks/${id}`, { method: "DELETE" });
  } finally {
    await loadTasks();
  }
}

async function handleCreateTask(event) {
  event.preventDefault();
  const formData = new FormData(taskForm);

  try {
    await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        title:       formData.get("title"),
        description: formData.get("description"),
        dueDate:     formData.get("dueDate"),
        status:      formData.get("status"),
        assignee:    formData.get("assignee")
      })
    });
    taskForm.reset();
    await loadTasks();
  } catch (error) {
    setEmptyColumns(error.message);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function handleLogin(event) {
  event.preventDefault();
  authError.textContent = "";
  const formData = new FormData(loginForm);

  try {
    const payload = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email:    formData.get("email"),
        password: formData.get("password")
      })
    });
    setToken(payload.token);
    showAppScreen(payload.data.name);
    loginForm.reset();
    await loadTasks();
  } catch (error) {
    authError.textContent = error.message;
  }
}

async function handleRegister(event) {
  event.preventDefault();
  authError.textContent = "";
  const formData = new FormData(registerForm);

  try {
    const payload = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name:     formData.get("name"),
        email:    formData.get("email"),
        password: formData.get("password")
      })
    });
    setToken(payload.token);
    showAppScreen(payload.data.name);
    registerForm.reset();
    await loadTasks();
  } catch (error) {
    authError.textContent = error.message;
  }
}

async function handleLogout() {
  setToken("");
  currentTasks = [];
  showAuthScreen();
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  if (token) {
    try {
      const payload = await request("/api/auth/me");
      showAppScreen(payload.data.name);
      await loadTasks();
    } catch {
      setToken("");
      showAuthScreen();
    }
  } else {
    showAuthScreen();
  }
}

// ── Eventos ───────────────────────────────────────────────────────────────────

loginForm.addEventListener("submit", handleLogin);
registerForm.addEventListener("submit", handleRegister);
tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));
taskForm.addEventListener("submit", handleCreateTask);
refreshButton.addEventListener("click", loadTasks);
searchInput.addEventListener("input", loadTasks);
editForm.addEventListener("submit", handleEditTask);
closeModalButton.addEventListener("click", closeEditModal);
editModal.addEventListener("click", (e) => { if (e.target === editModal) closeEditModal(); });
userAvatar.addEventListener("click", handleLogout);