# 🚀 ShahJI Drive — Fast Google Drive Folder Cloner & Bulk Uploader

ShahJI Drive is a production-grade, high-performance web application designed for recursive Google Drive folder cloning, bulk file uploads, and PDF watermarking directly in the cloud. Built with a modern, visually stunning WebGL interface, the app runs cloud-to-cloud operations at maximum speeds.

---

## 🌟 Key Features

* **Recursive Folder Cloner**: Replicate entire Google Drive directories, including all subfolders and files, directly into a parent folder.
* **Smart Filter & Cleaning**: Remove specific watermarks, keywords (e.g. promotional strings, links), or prefixes automatically during cloning operations.
* **Blazing Fast Upload Queue**: Drag-and-drop file uploader supporting simultaneous batch uploads with visual progress tracking.
* **Dynamic PDF Watermarker**: Generate, brand, and apply customized header, footer, and branding assets to educational PDFs on-the-fly.
* **Developer API Keys**: Provision domain-restricted API tokens to access cloud transfer features programmatically.
* **Interactive WebGL Visuals**: Experience a high-end, responsive dark interface built with custom WebGL shader backgrounds.

---

## 🛠️ Technology Stack

### Frontend (React SPA)
* **Core**: [React 19](https://react.dev/) + [Vite](https://vite.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)
* **Graphics**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
* **Icons**: [Lucide React](https://lucide.dev/)

### Backend (Node API)
* **Runtime**: Node.js + TypeScript
* **Router**: Express.js
* **Integrations**: Google APIs (`googleapis`)
* **Database Driver**: `pg` (PostgreSQL client)
* **Security & Defense**: `helmet` headers, timing-safe authorization checks, and `express-rate-limit` policies.

### Database
* **Engine**: PostgreSQL (Hosted via Supabase)

---

## 📁 Repository Structure

```
shahji-drive/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── config/           # Auth and environment helper configurations
│   │   ├── db/               # PostgreSQL Database connections
│   │   ├── middlewares/      # Security & validation controllers
│   │   ├── routes/           # Endpoint routes (Admin, API, Auth, Coupons, Drive)
│   │   └── services/         # Recursive Google Drive cloning logic
│   └── tsconfig.json
├── database/
│   └── migrations.sql        # Database schema definitions and indexes
├── frontend/                 # Vite + React 19 Client
│   ├── public/               # Static graphic assets and manifests
│   └── src/
│       ├── constants/        # Centralized SEO constants
│       ├── contexts/         # Authentication and state contexts
│       ├── pages/            # View pages (Admin, API keys, Auth, Dashboard, Home)
│       └── services/         # SEO meta-tag hoisting utilities
└── README.md                 # Main Project Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher)
* PostgreSQL Database instance (e.g. Supabase)
* Google Developer Console Account (for Drive API integration)

### 2. Backend Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` configuration file based on the provided template:
   ```bash
   cp .env.example .env
   ```
4. Configure variables in `.env`:
   * `PORT`: Port configuration (default is `5000`).
   * `DATABASE_URL`: PostgreSQL connection URI.
   * `JWT_SECRET`: HMAC verification key.
   * `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials.
   * `GOOGLE_REDIRECT_URI`: Redirect route (e.g. `http://localhost:5000/api/google-drive?action=exchange-token`).
5. Run the production build and start the server:
   ```bash
   npm run build
   npm start
   ```

### 3. Frontend Configuration
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:3000/`.

---

## 🔒 Security Audited & Hardened
* **ReDoS Prevention**: Sanitized user text filters using input-escaping algorithms.
* **HMAC Side-Channel Protections**: Applied constant-time buffer matches (`crypto.timingSafeEqual`) for token validation.
* **Strict JWT Variable Enforcement**: Environment settings strictly asserted, forcing process crash on launch if missing.
* **CORS & Secure Headers**: Hardened with Helmet HTTP response headers and endpoint rate-limits.

---

## 📝 License
This project is licensed under the MIT License.
