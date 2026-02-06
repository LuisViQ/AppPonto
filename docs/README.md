# AppPonto — Documentation

<p align="center">
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/LuisViQ/AppPonto" />
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/LuisViQ/AppPonto" />
  <img alt="GitHub issues" src="https://img.shields.io/github/issues/LuisViQ/AppPonto" />
  <img alt="GitHub license" src="https://img.shields.io/github/license/LuisViQ/AppPonto" />
</p>

<p align="center">
  <img alt="Architecture" src="https://img.shields.io/badge/architecture-offline--first-blue" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-mobile-lightgrey" />
  <img alt="Backend" src="https://img.shields.io/badge/backend-Express-green" />
  <img alt="Database" src="https://img.shields.io/badge/database-MySQL-blue" />
  <img alt="Local DB" src="https://img.shields.io/badge/local--db-RealmDB-purple" />
  <img alt="Status" src="https://img.shields.io/badge/status-in%20development-yellow" />
</p>

---

## Visão Geral | Overview

**PT-BR**
O AppPonto é um sistema de controle de ponto e horários com foco em **offline-first**. Todas as ações do usuário são persistidas localmente primeiro e sincronizadas depois com a API, garantindo funcionamento completo mesmo sem conexão.

**EN**
AppPonto is a time and attendance system built with an **offline-first** approach. All user actions are stored locally first and synchronized later with the API, ensuring full usability without an internet connection.

---

## Principais Ideias | Core Ideas

- Offline-first como regra de produto e arquitetura.
- Persistência local imediata com sincronização posterior.
- Outbox pattern para segurança na entrega de dados.
- Push e pull controlados para consistência.
- Fonte única de verdade na UI via RealmDB.

---

## Índice da Documentação | Documentation Index

| Arquivo | Descrição (PT-BR) | Description (EN) |
| --- | --- | --- |
| `ARCHITECTURE.md` | Visão geral da arquitetura, princípios offline-first e estratégia de sincronização. | Architecture overview, offline-first principles, and synchronization strategy. |
| `APP.md` | Aplicativo mobile, incluindo telas, serviços, RealmDB e UI. | Mobile application details, including screens, services, RealmDB and UI. |
| `API.md` | API Express, endpoints, payloads e regras de negócio. | Express API, endpoints, payloads, and business rules. |
| `DATABASE.md` | Modelagem do MySQL, campos adicionais e triggers. | MySQL schema, additional fields, and triggers. |
| `FLOW.md` | Fluxo técnico detalhado, explicando cada função. | Detailed technical flow, explaining each function. |
| `SYNC_FLOW.md` | Fluxo completo de salvar e sincronizar dados (Outbox, push e pull). | Complete save and synchronization flow (Outbox, push and pull). |
| `FILE_INDEX.md` | Referência rápida de todos os arquivos do projeto. | Quick reference for all project files. |

---

## Como Ler | How to Read

**PT-BR**
1. Comece por `ARCHITECTURE.md` para entender o fluxo geral.
2. Em seguida, leia `APP.md` e `API.md`.
3. Use `FILE_INDEX.md` como referência rápida durante o desenvolvimento.

**EN**
1. Start with `ARCHITECTURE.md` to understand the overall flow.
2. Then read `APP.md` and `API.md`.
3. Use `FILE_INDEX.md` as a quick reference during development.

---

## Conceitos-Chave | Key Concepts

- Offline-first architecture.
- RealmDB as UI source of truth.
- Outbox pattern for synchronization.
- Controlled push and pull.
- Data consistency and predictability.

---

## Documentação Completa | Full Documentation

**PT-BR**
A versão mais completa e detalhada está disponível no Notion:

`https://www.notion.so/Documenta-es-2faa0c91d571804aa57ef1cc5a58e254?source=copy_link`

**EN**
The most complete and detailed version is available on Notion:

`https://www.notion.so/Documenta-es-2faa0c91d571804aa57ef1cc5a58e254?source=copy_link`

