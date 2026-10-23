# 🎓 KnowledgeHub — Intelligent Digital Learning Library

> **Core USP: Upload once. Learn in your language. Practice at your level.**

KnowledgeHub is an AI-powered educational document management and learning platform designed for colleges, educators, and students. It transforms static academic documents (PDFs, Word docs, lecture notes, lab manuals) into interactive, multilingual learning experiences with automated text extraction, conceptual AI summaries, interactive quiz generation, and synchronized category workflows.

---

## 💡 What Makes KnowledgeHub Special?

1. **Multilingual AI Understanding**
   - Read and learn complex academic documents in **English**, **Hindi (हिंदी)**, and **Marathi (मराठी)** with a single click.
   - Built-in text-to-speech audio synthesis allows students to listen to simplified explanations in their native language.

2. **Smart Learning Path & Interactive Quizzes**
   - Automatically generates targeted comprehension questions, multiple-choice quizzes, and practice exercises directly from the uploaded material.
   - Immediate feedback helps students test their understanding and retain key concepts.

3. **Live Category & Subject Domain Management**
   - Full CRUD (Create, Read, Update, Delete) for academic categories with zero reload delay.
   - Edits or deletions dynamically synchronize across both Admin and Student dashboards, the upload form, and the library filters in real time.

4. **Role-Based Access Control (RBAC)**
   - Unified interface supporting both **Faculty Administrators** and **Student Viewers**.
   - Manage real users, adjust storage quotas, toggle roles (`Faculty Admin` ↔ `Student Viewer`), and view real-time system metrics directly backed by SQLite.

5. **Deep Document Inspection & Search**
   - Full-text search with live keyword highlighting across PDF, DOCX, TXT, and Markdown files.
   - In-app document reader with adjustable typography sizes, download capabilities, and an integrated feedback/issue reporting system.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript + Vite
- **Styling**: Tailwind CSS with sleek glassmorphism, responsive dark/light modes, and custom design tokens
- **Icons & Motion**: Lucide React + custom CSS micro-animations
- **Modals**: React Portals (`createPortal`) mounted to `document.body` for flawless layering and stacking context isolation
- **State & Routing**: React Router v6 + Context API (Auth, Theme, Audit logging)
- **Internationalization**: `i18next` with English, Hindi, and Marathi translations

### Backend
- **Runtime**: Node.js + Express.js with TypeScript
- **Database**: SQLite (`dev.db`) with custom optimized SQL schemas for documents, categories, users, tags, audit logs, and feedback
- **AI Engine**: Google Gemini API integration with automatic fallback to mock AI responses for offline resilience
- **Document Extractors**: `pdf-parse` (with page tracking) and `mammoth` (DOCX parsing)
- **Testing**: Vitest automated test suite (65 passing unit & integration tests)

---

## 📂 Project Structure

```text
service-learning/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Document, Category, User, Settings handlers
│   │   ├── database/         # SQLite connection, migrations & seeding (db.ts)
│   │   ├── middleware/       # Multer upload & error handling
│   │   ├── routes/           # REST endpoints (/api/documents, /api/categories, /api/users, etc.)
│   │   ├── services/         # Text extraction, Gemini AI provider, document storage
│   │   └── server.ts         # Express server entry point
│   ├── tests/                # Automated Vitest test suite (65 tests)
│   └── .env                  # Backend configuration (PORT, GEMINI_API_KEY)
├── frontend/
│   ├── src/
│   │   ├── components/       # MaterialCard, MaterialModal, DeleteModal, AdminNavTabs, etc.
│   │   ├── context/          # AuthContext, ThemeContext, AuditContext
│   │   ├── layouts/          # ViewerLayout, AdminLayout with sticky sidebars & topbars
│   │   ├── pages/
│   │   │   ├── admin/        # AdminDashboard, ManageMaterials, ManageCategories, ManageUsers, UploadMaterial
│   │   │   └── viewer/       # ViewerDashboard, SmartLearningPath, Library, Categories, Recent
│   │   ├── services/         # Axios API client with type definitions
│   │   └── i18n/             # Multilingual localization bundles
│   └── vite.config.ts        # Vite configuration & dev proxy
├── uploads/                  # Secure local file storage directory
└── README.md                 # Complete system documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- *(Optional)* Google Gemini API key for live AI generation. (The platform includes built-in mock fallback if no API key is provided).

---

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# (Optional) Add your Gemini API key in backend/.env:
# GEMINI_API_KEY=your_key_here
# PORT=5000

# Start backend in dev watch mode
npm run dev
```

The backend server will start at: `http://localhost:5000`  
*(SQLite database `dev.db` is auto-initialized and seeded with default categories and users).*

---

### 3. Frontend Setup

In a second terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The client web app will open at: `http://localhost:3000`

---

## 🧪 Testing & Validation

Run the automated backend test suite:

```bash
cd backend
npm test
```

All **65 tests** verify:
- Accurate full-text extraction from `.pdf`, `.docx`, `.txt`, and `.md` files
- File corruption detection and edge-case validation
- Category and user CRUD persistence in SQLite
- Multilingual AI summarizer and quiz generator integration

---

## 👥 Default Demo Accounts

| Name | Role | Department | Default Permissions |
| :--- | :--- | :--- | :--- |
| **Dr. Rajesh Sharma** | `ADMIN` (Faculty) | Computer Science | Full document upload, delete, category & user management |
| **Om** | `VIEWER` (Student) | Information Tech | Search, view, download, AI summaries, quizzes, feedback |

*(You can freely switch between Faculty and Student modes using the header navigation or the Manage Users panel).*

---

## 🛡️ License & Contributing

Developed for educational service learning and digital empowerment. Contributions, bug reports, and suggestions are welcome via issues or pull requests.
