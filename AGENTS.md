<!-- BEGIN:nextjs-agent-rules -->
# AGENTS.md

# PumpDesk

This repository contains PumpDesk, a modern SaaS platform for concrete pumping companies.

The goal is not to recreate CreteSuite.

The goal is to build a faster, simpler, AI-first platform that operators and office staff actually enjoy using.

---

# Design Philosophy

Always prefer:

- Simplicity
- Readability
- Consistency
- Scalability
- Accessibility

Avoid unnecessary abstraction.

If a simple solution works, prefer it over a clever one.

---

# Technology

Frontend

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

Backend

- Supabase
    - PostgreSQL
    - Authentication
    - Storage
    - Row Level Security

Infrastructure

- GitHub
- Vercel

---

# Code Style

Use TypeScript everywhere.

Prefer:

- named exports
- functional components
- async / await
- server components

Avoid:

- any
- deeply nested components
- duplicated code
- inline styles

Every component should have a single responsibility.

---

# Folder Structure

src/

app/
components/
features/
hooks/
lib/
services/
types/
utils/

Keep business logic out of page components whenever possible.

---

# UI Guidelines

PumpDesk should feel modern.

Think:

- Linear
- Stripe Dashboard
- Notion
- Raycast

Not:

- Enterprise ERP
- Windows desktop software
- Outdated admin panels

Use whitespace generously.

Prefer fewer controls over more.

Every screen should have a clear primary action.

---

# Theme

Support both:

- Light Mode
- Dark Mode

Never hardcode colors.

Always use theme variables.

---

# Database

Database design lives in:

docs/database.dbml

Do not create or modify database tables before updating the DBML.

The DBML is the source of truth.

All operational tables should belong to a company.

Use UUID primary keys.

Never rely on sequential IDs.

---

# Security

Never expose:

- Service Role Keys
- Secrets
- API Keys

Use Supabase Row Level Security.

Assume the frontend is public.

---

# AI Features

PumpDesk is AI-first.

When adding features, always consider whether AI can:

- reduce clicks
- automate repetitive work
- improve scheduling
- improve dispatch
- predict maintenance
- summarize notes

AI should enhance workflows without getting in the user's way.

---

# Naming

Prefer descriptive names.

Good

Customer
JobSite
WorkTicket
PumpAssignment

Avoid abbreviations.

---

# Components

Components should be:

small

reusable

predictable

Prefer composition over inheritance.

---

# Forms

Use:

React Hook Form

Zod

Keep validation shared between client and server whenever possible.

---

# State

Use local state first.

Introduce global state only when necessary.

Avoid unnecessary complexity.

---

# Error Handling

Fail gracefully.

Show meaningful errors.

Never expose internal implementation details.

---

# Performance

Optimize for:

fast page loads

minimal JavaScript

server rendering

lazy loading when appropriate

Avoid premature optimization.

Readable code comes first.

---

# Git

Small commits.

Descriptive commit messages.

Example:

feat(schedule): add drag and drop scheduling

fix(invoice): resolve tax calculation

refactor(customers): simplify contact editor

---

# Documentation

When adding major features:

Update README.md if setup changes.

Update database.dbml if schema changes.

Document architectural decisions.

---

# Goal

Every feature should answer:

Does this make a concrete pumping company faster?

If not, reconsider the design.

PumpDesk should become the simplest and most enjoyable concrete pumping platform available.
<!-- END:nextjs-agent-rules -->
