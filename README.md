# 📸 Online Photo Collage Tool

A modern web application that allows users to upload multiple images and generate beautiful photo collages. Built using a decoupled client-server architecture with React (Vite) on the frontend and Node.js (Express) on the backend.

---

## 🚀 Features

- **Multi-image upload:** Upload multiple images seamlessly.
- **Collage Customization:** Process images, select layouts, and customize sizes/margins.
- **Real-time processing:** Fast image stitching backend built with Node.js.
- **High-quality download:** Generate and download high-resolution final collages.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express, Canvas/Sharp (Image processing)
- **Tooling:** Concurrently (to run frontend and backend simultaneously in dev)

---

## 📂 Project Structure

```text
Online-Photo-Collage/
├── client/                 # React frontend (Vite)
│   ├── src/                # React components & styles
│   ├── public/             # Static assets
│   └── package.json        # Frontend configuration & scripts
├── server/                 # Express backend (Node.js)
│   ├── uploads/            # Temporary & processed collage storage
│   ├── imageProcessor.js   # Image stitching & layout logic
│   └── package.json        # Backend configuration & scripts
├── package.json            # Root orchestrator scripts
└── README.md               # Project documentation
```

---

## 💻 Getting Started

### Prerequisites

Make sure you have **Node.js** (v18 or higher) and **npm** installed on your machine.

### Installation

Clone the repository and run the root installation helper script to install dependencies for both `client` and `server` directories at once:

```bash
# Install all dependencies (root, client, and server)
npm install
npm run install:all
```

### Running Locally

To launch both the frontend client and backend server concurrently in development mode:

```bash
# Start both dev servers
npm run dev
```

- **Frontend client** runs at: [http://localhost:5173](http://localhost:5173)
- **Backend server** runs at: [http://localhost:5000](http://localhost:5000)

---

## 📦 Deployment & Hosting

The application is optimized for single-service deployment (where the Express backend serves the built React frontend statically in production). This is ideal for free hosting platforms like Render.

### Deploying to Render (Recommended)

1. Create a new **Web Service** on Render and connect your GitHub repository.
2. Configure the following settings:
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm start --prefix server`
   - **Environment Variables:**
     - `NODE_ENV`: `production`
     - `NODE_VERSION`: `20`

This compiles the frontend client assets into `client/dist` and spins up the Express server, which serves both the frontend static site and handles the backend collage processing endpoints under a single domain.

*Note: Since the backend uses ephemeral storage for processing, uploaded files and generated collages will naturally expire when the free instance sleeps or restarts, matching the app's 30-minute auto-cleanup security logic.*
