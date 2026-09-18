# 📚 Digital Library & Document Management System

A clean, modern **Digital Library & Document Management** web application. Upload, store, organize, tag, search, and inspect your multi-format documents in a responsive dark-mode workspace.

---

## 🌟 Key Features

- 📄 **Multi-Format Document Upload**: Support for PDF, DOCX, TXT, and Markdown (`.md`) files up to 50MB.
- ⚡ **Automated Text Extraction**: Extracts full text and maps page boundaries for instant viewing.
- 🔍 **Search & Filtering**: Search across filenames, tags, or content. Filter easily by file format.
- 📌 **Tagging & Metadata Management**: Organize files with custom tags, descriptions, and view mode options (Grid/Table).
- 👁️ **Interactive Document Inspector**: Full extracted text reader, PDF preview frame, tag editor, and file downloader.
- 📊 **Dashboard & Metrics**: Live metrics for total documents, storage used, PDF/DOCX count, and database health check.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React + Vite + TypeScript
- **Styling**: Tailwind CSS + Modern dark mode glassmorphism
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Routing**: React Router DOM

### Backend
- **Runtime**: Node.js + Express.js + TypeScript
- **Database**: SQLite with Prisma ORM (`dev.db`)
- **Text Parsers**: `pdf-parse` (with page tracking) and `mammoth` (DOCX)

---

## 📂 Project Structure

```text
digital-library/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma      # SQLite Database Schema
│   ├── src/
│   │   ├── controllers/        # Document, Search, Settings handlers
│   │   ├── database/           # Prisma client instance
│   │   ├── middleware/         # Multer file upload & error handlers
│   │   ├── routes/             # REST API endpoint routes
│   │   ├── services/           # Extraction & document storage services
│   │   ├── types/              # TypeScript interfaces
│   │   └── server.ts           # Express App Entrypoint
│   └── tests/                  # Vitest automated test suite
├── frontend/
│   ├── src/
│   │   ├── components/         # DocumentCard, DocumentViewerModal, Sidebar, Toast, etc.
│   │   ├── layouts/            # MainLayout shell
│   │   ├── pages/              # DashboardPage, UploadPage, SettingsPage
│   │   ├── services/           # Axios API client
│   │   └── types/              # Frontend interfaces
│   ├── vite.config.ts          # Vite proxy configuration
│   └── tailwind.config.js      # Tailwind CSS configuration
├── uploads/                    # Local safe document file storage
├── README.md                   # Technical documentation
└── ABOUT-THIS.md               # Group presentation & project overview
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

### 2. Environment Setup

Create `.env` in `backend/` or set variables:
```env
PORT=5000
DATABASE_URL="file:./prisma/dev.db"
```

---

### 3. Backend Setup & Run

```bash
cd backend

# 1. Install dependencies
npm install

# 2. Push SQLite database schema
npx prisma db push

# 3. Start backend dev server
npm run dev
```
Backend will start on: `http://localhost:5000`

---

### 4. Frontend Setup & Run

In a new terminal window:

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Start frontend dev server
npm run dev
```
Frontend will open on: `http://localhost:3000`

---

## ⚙️ How Document Processing Works

1. **Upload & Validation**: File type (.pdf, .docx, .txt, .md) and file size (<50MB) are verified. The original file is saved in `/uploads`.
2. **Text Extraction**:
   - `pdf-parse` extracts full text and maps page boundaries.
   - `mammoth` parses raw text from Word `.docx`.
   - TXT/Markdown files are read directly via UTF-8 buffer.
3. **Indexing & Storage**: Extracted text, metadata, and tags are indexed in SQLite via Prisma ORM.
4. **Inspection & Management**: Users can inspect full text, view PDF previews, edit tags, search, and manage files through the React interface.

---

## 🧪 Running Automated Tests

Run backend unit & integration tests:

```bash
cd backend
npm test
```

Verifies:
- Text extraction logic for PDF, DOCX, TXT.
- Document storage and metadata retrieval.
- Complete document upload and deletion lifecycle.

---

## 🔒 Security & Best Practices

- Filenames are sanitized and assigned timestamp UUID prefixes to prevent path traversal.
- Uploaded files are restricted to non-executable document extensions.
- Storage directory is safely contained within local server environment.
