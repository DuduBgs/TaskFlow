# TaskFlow

Projeto inicial para o sistema de organizacao e acompanhamento de tarefas.

## Participantes

Eduardo Cunha Borges & Luiz Felipe Vilhena

## Backend (API)
A API cobre o CRUD de tarefas em memoria, usa PostgreSQL quando `DATABASE_URL` estiver definida e possui autenticacao via JWT.

## Frontend (estatico)
O frontend simples esta embutido no backend. Apos iniciar a API, abra:
- http://localhost:3000

### Como rodar
```powershell
cd server
npm.cmd install
npm.cmd run dev
```

### Banco de dados (PostgreSQL)
1. Crie um banco chamado `taskflow`.
2. Execute o script SQL em [server/sql/schema.sql](server/sql/schema.sql).
3. Defina `DATABASE_URL` no `.env` (use [server/.env.example](server/.env.example) como base).

### Autenticacao
- Defina `JWT_SECRET` no `.env`.
- Use `Authorization: Bearer <token>` para acessar `/api/tasks`.

### Docker Compose
Suba API e Postgres com um comando:
```powershell
docker compose up --build
```

O banco vai subir com usuario e senha `taskflow`. A API usa `DATABASE_URL` apontando para o servico `db`.

#### Endpoints
- GET /health
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me
- GET /api/tasks
- POST /api/tasks
- GET /api/tasks/:id
- PUT /api/tasks/:id
- DELETE /api/tasks/:id

### Exemplo de payload
```json
{
  "title": "Escrever documentacao",
  "description": "Detalhar requisitos",
  "dueDate": "2026-05-10",
  "status": "em andamento",
  "assignee": "Ana"
}
```

### Exemplo de registro/login
```json
{
  "name": "Ana",
  "email": "ana@example.com",
  "password": "senha-segura"
}
```

### Testes
```powershell
cd server
npm.cmd test
```
