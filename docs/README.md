
AppPonto — Documentation
![GitHub repo size](https://img.shields.io/github/repo-size/LuisViQ/AppPonto)
![GitHub last commit](https://img.shields.io/github/last-commit/LuisViQ/AppPonto)
![GitHub issues](https://img.shields.io/github/issues/LuisViQ/AppPonto)
![GitHub license](https://img.shields.io/github/license/LuisViQ/AppPonto)

![Offline First](https://img.shields.io/badge/architecture-offline--first-blue)
![Mobile](https://img.shields.io/badge/platform-mobile-lightgrey)
![Backend](https://img.shields.io/badge/backend-Express-green)
![Database](https://img.shields.io/badge/database-MySQL-blue)
![Local DB](https://img.shields.io/badge/local--db-RealmDB-purple)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

About the Project | Sobre o Projeto

PT-BR
O AppPonto é um sistema de controle de ponto e horários desenvolvido com foco em offline-first. Todas as ações do usuário são persistidas localmente primeiro e sincronizadas posteriormente com a API, garantindo funcionamento mesmo sem conexão.

EN
AppPonto is a time and attendance system built with an offline-first approach. All user actions are stored locally first and synchronized later with the API, ensuring full usability without an internet connection.

Documentation Index | Índice da Documentação

A documentação está dividida em arquivos específicos, cada um cobrindo uma parte do sistema.

Files | Arquivos
ARCHITECTURE.md  -> Architecture overview and offline-first flow
APP.md           -> Mobile app (screens, services, Realm, UI)
API.md           -> Express API, endpoints and payloads
DATABASE.md      -> MySQL schema, extra fields and triggers
FLOW.md          -> Technical flow, function by function
SYNC_FLOW.md     -> Save and sync flow (push / pull / Outbox)
FILE_INDEX.md    -> File index with functions, props and exports

Detailed Description | Descrição Detalhada
ARCHITECTURE.md

PT-BR: Visão geral da arquitetura, princípios offline-first e estratégia de sincronização.
EN: Architecture overview, offline-first principles and synchronization strategy.

APP.md

PT-BR: Aplicativo mobile, incluindo telas, serviços, RealmDB e UI.
EN: Mobile application details, including screens, services, RealmDB and UI.

API.md

PT-BR: API Express, endpoints, payloads e regras de negócio.
EN: Express API, endpoints, payloads and business rules.

DATABASE.md

PT-BR: Modelagem do banco MySQL, campos adicionais e triggers.
EN: MySQL schema, additional fields and triggers.

FLOW.md

PT-BR: Fluxo técnico detalhado, explicando cada função.
EN: Detailed technical flow, explaining each function.

SYNC_FLOW.md

PT-BR: Fluxo completo de salvar e sincronizar dados (Outbox, push e pull).
EN: Complete save and synchronization flow (Outbox, push and pull).

FILE_INDEX.md

PT-BR: Referência rápida de todos os arquivos do projeto.
EN: Quick reference for all project files.

How to Read | Como Ler
PT-BR

Comece por ARCHITECTURE.md para entender o fluxo geral.

Em seguida, leia APP.md e API.md.

Use FILE_INDEX.md como referência rápida.

EN

Start with ARCHITECTURE.md to understand the overall flow.

Then read APP.md and API.md.

Use FILE_INDEX.md as a quick reference.

Full Documentation | Documentação Completa

A versão mais completa e detalhada da documentação está disponível no Notion:

https://www.notion.so/Documenta-es-2faa0c91d571804aa57ef1cc5a58e254?source=copy_link

Core Concepts | Conceitos-Chave

Offline-first architecture

RealmDB as UI source of truth

Outbox pattern for synchronization

Controlled push and pull

Data consistency and predictabilit
