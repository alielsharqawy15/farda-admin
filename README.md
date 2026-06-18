# Farda Admin Dashboard

React + Vite admin panel for the Farda e-commerce platform.

## Prerequisites

- Backend running at `http://localhost:3000`
- Node.js 20+

## Setup

```bash
cd admin
npm install
npm run dev
```

Open **http://localhost:5174**

## Login

Use the seeded admin account:

- Email: `admin@farda.com`
- Password: `Password123!`

## Workflow: Dashboard → Database → Mobile

1. **Seed admin only** (no sample products):
   ```bash
   cd backend
   npm run prisma:seed
   ```
2. **Categories & Brands** — create with image/logo upload
3. **Products** — create with variants + product images
4. **Mobile app** — hot restart; data loads from API

## Features

- **Products** — create, edit, delete, upload images
- **Categories** — create, delete, upload category images
- **Brands** — create, delete, upload logos
- **Orders** — list, filter, update status
- **Users** — search and filter by role

## API

Dev server proxies `/api` and `/uploads` to the backend.

Add to backend `.env`:

```
ADMIN_URL=http://localhost:5174
```
