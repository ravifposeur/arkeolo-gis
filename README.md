# Arkeolo-GIS: Islamic Archaeological Data Management Platform

> "Preserving history through digital mapping and collaborative data verification."

**Arkeolo-GIS** is a specialized Web GIS platform designed to map, document, and preserve Islamic archaeological sites in Java. It addresses the need for a structured, verified repository of historical data, moving away from scattered records to a centralized, geospatial database.

This project implements a secure, **Role-Based Access Control (RBAC)** system to ensure data integrity, allowing the public to contribute while maintaining strict academic verification standards.

---

## Technical Stack

### Backend
![NodeJS](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

---

## Key Features

### 1. Interactive Geospatial Interface
* **Minimalist Cartography:** Utilizes Carto Positron basemaps for a clean, data-focused visualization.
* **Side Panel Navigation:** Detailed site information, including related artifacts and researchers, is presented in a sliding side panel rather than small popups.
* **Smart Filtering:** Real-time filtering by site type (Candi, Makam, etc.) and search functionality.

### 2. Role-Based Verification System
The system distinguishes between three user tiers to protect data quality:

| Role | Permissions |
| :--- | :--- |
| **Contributor** | Can submit new sites, artifacts, and master data. All submissions default to `pending`. |
| **Verifier** | Can review, approve, or reject pending submissions. Can manage master data directly. |
| **Administrator** | Full system access, including permanent deletion of records and user management. |

### 3. Intelligent Data Entry
* **Chain Reaction Logic:** Submitting a site automatically handles the creation of related master data (Kingdoms, Researchers) if they do not exist.
* **Cascading Verification:** Approving a site automatically approves all new, pending master data linked to it.
* **Smart Rejection:** Rejecting a site intelligently cleans up related master data only if it is not referenced by other valid sites.
* **GPS Integration:** One-click geolocation locking for field surveyors.

---

## Installation & Setup (Local)

Follow these instructions to run the project on your local machine.

### Prerequisites
* Node.js (v18+)
* PostgreSQL
* Git

### Step 1: Clone Repository
```bash
git clone [https://github.com/ravifposeur/arkeolo-gis.git](https://github.com/yourusername/arkeolo-gis.git)
cd arkeolo-gis
```

### Step 2: Install Dependencies

Navigate to the backend folder and install the required packages.

```bash
cd backend
npm install
```

### Step 3: Database Configuration

1.  Create a local PostgreSQL database named `arkeologiDB`.
2.  Execute the provided SQL script `db.sql` in your database tool (DBeaver/pgAdmin) to generate tables and relationships.

### Step 4: Environment Variables

Create a `.env` file in the root directory. Do not commit this file.

```ini
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_NAME=arkeologiDB
DB_PORT=5432
JWT_SECRET=your_secure_random_string
```

### Step 5: Run Application

Start the backend server:

```bash
node index.js
```

The API will be available at `http://localhost:3000`. Use **Live Server** (VS Code Extension) to run the frontend `index.html`.

-----

## Deployment Guide

This project is optimized for a serverless deployment architecture.

### Database (Neon.tech)

1.  Create a project on **Neon.tech**.
2.  Copy the provided **Connection String**.
3.  Connect via DBeaver and run the `skema_lengkap.sql` script to initialize the cloud database.

### Backend (Vercel)

1.  Push the backend code to GitHub.
2.  Import the project into **Vercel**.
3.  Add the following Environment Variables in Vercel settings:
      * `DATABASE_URL`: (Paste your Neon connection string)
      * `JWT_SECRET`: (Your secret key)
      * `DB_SSL`: `true`
4.  Deploy.

### Frontend (Vercel)

1.  Update `modules/api.js` in your frontend code to point to the **Vercel Backend URL** instead of localhost.
2.  Push changes to GitHub.
3.  Import the repo into Vercel as a **new project**.
4.  Set the **Root Directory** to `frontend`.
5.  Deploy.

-----

## Project Structure

```
Arkeolo-GIS/
├── backend/
│   ├── middleware/      # Auth & Validation Logic
│   ├── routes/          # API Endpoints (CRUD)
│   ├── validators/      # Joi Schemas
│   ├── db.js            # Database Connection
    ├── db.sql           # SQL Queries
│   └── index.js         # Entry Point
│
└── frontend/
    ├── assets/          # CSS & Static Files
    ├── modules/         # Modular JavaScript logic
    │   ├── api.js       # API Fetcher
    │   ├── map.js       # Leaflet Logic
    │   └── ui.js        # DOM Manipulation
    ├── index.html       # Main Map Interface
    └── dashboard.html   # Admin Interface
```
