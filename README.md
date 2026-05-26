# TaskFlow

Sistema web de gerenciamento de tarefas no estilo Kanban, desenvolvido como projeto acadêmico.

**Participantes:** Eduardo Cunha Borges & Luiz Felipe Vilhena

---

## Sobre o projeto

O TaskFlow permite criar, organizar e acompanhar tarefas distribuídas em três colunas: **Pendente**, **Em Andamento** e **Concluída**. As tarefas podem ser arrastadas entre colunas, filtradas por texto e atribuídas a responsáveis com prazo definido.

O frontend é servido como arquivo estático pelo próprio backend — basta subir a API e acessar `http://localhost:3000`.

---

## Stack

- **Backend:** Node.js + Express
- **Banco de dados:** PostgreSQL
- **Autenticação:** JWT + bcrypt
- **Frontend:** HTML, CSS e JavaScript puro
- **Containerização:** Docker + Docker Compose
- **CI:** GitHub Actions
- **Qualidade:** SonarCloud

---

## Como rodar

### Com Docker (recomendado)

```bash
docker-compose up --build
```

Acesse `http://localhost:3000`. O banco de dados sobe junto e as tabelas são criadas automaticamente.

### Sem Docker

```bash
cd server
npm install
```

Copie o arquivo de exemplo e preencha as variáveis:

```bash
cp server/.env.example server/.env
```

```env
PORT=3000
DATABASE_URL=postgres://usuario:senha@localhost:5432/taskflow
JWT_SECRET=seu-segredo-aqui
```

Inicie o servidor:

```bash
node src/index.js
```

> Se `DATABASE_URL` não estiver definida, o sistema funciona com armazenamento em memória (dados são perdidos ao reiniciar).

---

## Testes

```bash
cd server
npm test
```

---

## Endpoints

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Cadastra novo usuário |
| POST | /api/auth/login | Autentica e retorna token JWT |
| GET | /api/auth/me | Retorna dados do usuário logado |

### Tarefas — requer `Authorization: Bearer <token>`

| Método | Rota | Descrição |
|---|---|---|
| GET | /api/tasks | Lista todas as tarefas |
| POST | /api/tasks | Cria nova tarefa |
| GET | /api/tasks/:id | Busca tarefa por ID |
| PUT | /api/tasks/:id | Atualiza tarefa |
| DELETE | /api/tasks/:id | Remove tarefa |

### Outros

| Método | Rota | Descrição |
|---|---|---|
| GET | /health | Verifica se a API está no ar |

---

## Exemplos de requisição

**Registro / Login**
```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "senha-segura"
}
```

**Criar / Atualizar tarefa**
```json
{
  "title": "Escrever documentação",
  "description": "Detalhar os requisitos do sistema",
  "dueDate": "2026-06-10",
  "status": "em andamento",
  "assignee": "Ana"
}
```

Valores válidos para `status`: `pendente`, `em andamento`, `concluida`
