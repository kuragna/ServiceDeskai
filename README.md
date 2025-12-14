# ServiceDeskai

A ticketing system for reporting office problems with real-time chat, geolocation, and AI image analysis.

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/kuragna/ServiceDeskai.git
cd ex00
```

## Quick Start

### Run with Docker

```bash
# 1. Create backend/.env file
echo "NODE_ENV=production" > backend/.env
echo "MONGODB_URI=mongodb://mongodb:27017/servicedeskai" >> backend/.env
echo "JWT_SECRET=42Madrid" >> backend/.env
echo "JWT_EXPIRES_IN=7d" >> backend/.env
echo "PORT=5000" >> backend/.env
echo "FRONTEND_URL=http://localhost:5173" >> backend/.env

# 2. Create frontend/.env file
echo "VITE_API_URL=http://localhost:5000/api" > frontend/.env

# 4. Build and start containers
docker compose build
docker compose up -d

# 5. Create test users (optional)
docker compose exec backend npm run create-test-users
```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

### Test Users
- **Admin**: admin@test.com / admin123
- **Service Desk**: servicedesk@test.com / servicedesk123
- **Standard**: standard@test.com / standard123

## Local Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tech Stack
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Frontend**: React, Redux, Vite
