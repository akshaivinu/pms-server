# PMS Server

Backend API for the Project Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pms?retryWrites=true&w=majority
JWT_SECRET=your-secret-key
PORT=8000
```

3. Run the server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:8000`.
