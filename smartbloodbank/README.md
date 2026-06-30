# Smart Blood Bank System

A web-based blood bank management system with donor registration, blood requests, events, and notifications.

## Project Structure

```
smartbloodbank/
├── backend/          # Node.js + Express + MongoDB API
│   ├── middleware/   # JWT auth middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   └── server.js     # Entry point
└── frontend/         # HTML + CSS + JS
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your values
npm run dev
```

### Frontend
Open `frontend/index.html` in your browser, or serve with any static server.

## Default Admin Login
- Username: `admin`
- Password: `123456789`
