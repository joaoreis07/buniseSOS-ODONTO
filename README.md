# BusinessOS Odonto

SaaS multi-tenant para gestão de clínicas odontológicas (Foundation).

Produto irmão do [BusinessOS Finance](https://github.com/joaoreis07/buniseSOS-FINANCE) — mesma filosofia de arquitetura, identidade visual própria.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui + Geist
- Prisma 6 + PostgreSQL 16 (Docker Compose)
- Auth.js (Credentials + JWT)
- Zod + React Hook Form + TanStack Query
- Sonner + cmdk (Command Palette)

## Setup

> Este projeto usa `.npmrc` com `ignore-workspace=true`, `node-linker=hoisted` e `package-import-method=copy` (compatível com Dropbox).

```bash
# Dependências
npx pnpm@9.15.9 install

# Variáveis de ambiente
cp .env.example .env

# PostgreSQL (porta 5433 — não colide com Finance)
npx pnpm@9.15.9 db:up

# Schema + dados demo
npx pnpm@9.15.9 db:migrate
npx pnpm@9.15.9 db:seed

# Desenvolvimento
npx pnpm@9.15.9 dev
```

Abra [http://localhost:3000](http://localhost:3000).

### Contas demo (seed)

| Email | Senha | Role |
|---|---|---|
| `admin@odonto.demo` | `Demo@123456` | ADMIN |
| `gerente@odonto.demo` | `Demo@123456` | MANAGER |

### Rotas (Foundation)

| Rota | Descrição |
|---|---|
| `/` | Landing |
| `/login` `/register` | Autenticação |
| `/app` | Dashboard inicial |
| `/app/settings` | Placeholder (RBAC ativo) |
| `/app/agenda` etc. | Placeholders — módulos futuros |

## Banco

- Database: `businessos_odonto`
- Porta host: `5433` (container interno `5432`)
- Container: `businessos-odonto-postgres`

**Nunca** compartilha schema com BusinessOS Finance.

## Estrutura

```text
src/
  app/           # rotas Next.js + APIs
  modules/       # auth, app-shell, dashboard, marketing
  shared/        # UI, lib (auth, rbac, prisma, storage)
prisma/          # schema foundation (tenant + auth)
```

## Agenda

Hub operacional em `/app/agenda`:

- Views: dia, semana, mês, timeline, lista
- Drag & drop + resize de horários
- Sheet lateral com ações rápidas
- Sidebar: mini-calendário, profissionais, salas, cadeiras, legenda, espera, retornos
- Multi-tenant + RBAC (`agenda:view` / `agenda:manage`)
