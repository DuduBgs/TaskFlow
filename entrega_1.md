# Entrega 1 - Planejamento Inicial

## Nome do projeto
TaskFlow

## Tema da aplicacao
Organizacao e acompanhamento de tarefas em projetos academicos ou profissionais.

## Objetivo do sistema
Centralizar a gestao de tarefas e responsabilidades, reduzindo falta de clareza sobre prazos, status e atribuicoes.

## Escopo (visao macro)
O sistema permitira:
- Cadastrar usuarios
- Criar projetos
- Cadastrar, atribuir, editar e remover tarefas
- Acompanhar status e prazos
- Visualizar andamento do projeto

## Principais funcionalidades (3 a 5)
- Cadastro e login de usuarios
- Criacao e gerenciamento de projetos
- CRUD completo de tarefas
- Atribuicao de tarefas a membros da equipe
- Atualizacao de status (pendente, em andamento, concluida)

## CRUD principal
Gerenciamento de tarefas:
- Create: cadastrar nova tarefa
- Read: listar tarefas cadastradas
- Update: editar titulo, descricao, prazo e status
- Delete: remover tarefas

## Tecnologias pretendidas
- Front-end: React
- Back-end: Node.js com Express
- Banco de dados: PostgreSQL
- Containerizacao: Docker
- Orquestracao: Docker Compose
- Versionamento: GitHub + GitFlow
- CI/CD: Jenkins
- Qualidade de codigo: SonarQube

## Justificativa das tecnologias
- React: ecossistema maduro e componentes reutilizaveis para UI rapida.
- Node.js/Express: desenvolvimento agil de APIs REST com grande comunidade.
- PostgreSQL: banco relacional robusto, adequado para dados estruturados.
- Docker/Compose: ambiente consistente e facil de replicar.
- GitHub + GitFlow: padrao claro para colaboracao e controle de versoes.
- Jenkins: automatiza build e deploy com flexibilidade.
- SonarQube: auxilia na manutencao da qualidade e padroes de codigo.