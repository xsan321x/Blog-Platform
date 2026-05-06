# BlogSpace — Full-Stack Blog Platform

A production-ready, modern blog platform built with Next.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (connection string already configured)

### Backend Setup
```bash
cd Backend
npm install
npm run seed        # Create master admin
npm run seed:posts  # Add sample posts
npm run dev         # Start on port 5000
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev         # Start on port 3000
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Master Admin | admin@system.com | Admin123! |
| Author | author@demo.com | Author123! |

---

## 📁 Project Structure

```
/Backend
  /src
    /config         # DB, Cloudinary config
    /controllers    # Route handlers
    /middleware     # Auth, RBAC, validation, upload
    /models         # Mongoose schemas (User, Post, Comment)
    /routes         # Express routers
    /seed           # Database seeders
    /utils          # Helpers, error classes
  server.js

/Frontend
  /src
    /app            # Next.js App Router pages
    /components     # UI components (layout, blog, editor, ui)
    /hooks          # Custom React hooks
    /lib            # API client, utilities
    /store          # Zustand auth store
    /types          # TypeScript types
```

---

## 🔌 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Register |
| POST | /api/auth/login | Public | Login |
| GET | /api/auth/me | Auth | Current user |
| GET | /api/posts | Public | List posts |
| GET | /api/posts/search?q= | Public | Search |
| POST | /api/posts | Author+ | Create post |
| PUT | /api/posts/:id | Author+ | Update post |
| DELETE | /api/posts/:id | Author+ | Delete post |
| POST | /api/posts/:id/like | Auth | Toggle like |
| GET | /api/comments/:postId | Public | Get comments |
| POST | /api/comments/:postId | Auth | Add comment |
| GET | /api/users | Admin+ | List users |
| PUT | /api/users/:id/role | Admin+ | Assign role |
| POST | /api/upload/image | Auth | Upload image |
| GET | /api/unsplash/search | Auth | Search Unsplash |
| POST | /api/ai/generate | Author+ | AI content gen |
| POST | /api/ai/improve | Author+ | AI improve text |
| POST | /api/ai/suggest-headings | Author+ | AI headings |

---

## ⚙️ Optional Configuration

Add these to `Backend/.env` for full functionality:

```env
# Cloudinary (image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Unsplash (image search)
UNSPLASH_ACCESS_KEY=your_access_key

# HuggingFace (AI features)
HUGGINGFACE_API_TOKEN=your_token
```

Without these, the platform uses placeholder images and template-based AI responses.

---

## 🛡️ Security Features

- JWT authentication with 7-day expiry
- bcrypt password hashing (12 rounds)
- Role-based access control (Reader → Author → Admin → Master Admin)
- Rate limiting (200 req/15min global, 20 req/15min for auth)
- Helmet.js security headers
- Input validation with Zod
- Master Admin cannot be deleted or demoted

---

## 🎨 UI Features

- Light/Dark mode (system preference default, localStorage persistence)
- Responsive design (mobile-first)
- TipTap rich text editor with full formatting toolbar
- Skeleton loading states
- Toast notifications
- Animated transitions
