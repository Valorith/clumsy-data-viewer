# EverQuest Item Database Viewer

A lightweight web application for viewing and filtering EverQuest item parsing data with DPS calculations.

## Features

- **Item Browsing**: View parsed item data with DPS calculations
- **Advanced Filtering**: Filter by melee DPS, spell DPS, bane, backstab capabilities
- **Search**: Search items by name or notes
- **Sorting**: Sort by various DPS metrics and item properties
- **Statistics Dashboard**: View database-wide statistics
- **Allakhazam Integration**: Direct links to item details on Allakhazam

## Prerequisites

- Node.js 16+ and npm
- MySQL database with EverQuest item data
- Access to `items` and `items_parses` tables

## Installation

### 1. Clone or Download the Repository

```bash
cd clumsy-data-viewer
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure Database Connection

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your database credentials:
```
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_eq_database
```

Alternatively, edit `config.json` directly for more advanced configuration. The backend will also honour a custom configuration file by setting `BACKEND_CONFIG_PATH=/path/to/config.json` before starting the server.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

#### Configure API Endpoint

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. For production, update `VITE_API_URL` to point to your backend:
```
VITE_API_URL=http://your-server:3001/api
```

## Running the Application

### Development Mode

Start both servers in separate terminals:

**Backend:**
```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

**Frontend:**
```bash
cd frontend
npm run dev
# Application runs on http://localhost:5173
```

### Backend Tests

```bash
npm test --prefix backend
```

### Production Deployment

#### Build Frontend
```bash
cd frontend
npm run build
# Creates optimized build in frontend/dist/
```

#### Serve with a Web Server

1. **Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/clumsy-data-viewer/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **PM2 Process Manager (for Node.js backend):**
```bash
npm install -g pm2
cd backend
pm2 start server.js --name eq-item-api
pm2 save
pm2 startup
```

## Configuration Options

### Backend (config.json)

- `server.port`: API server port (default: 3001)
- `server.host`: Bind address (default: 0.0.0.0)
- `server.corsOrigins`: Allowed CORS origins
- `database.*`: MySQL connection settings
- `api.pageSize`: Default items per page
- `api.maxPageSize`: Maximum allowed page size

### Frontend

- `VITE_API_URL`: Backend API URL
- Edit `src/config.js` for additional frontend settings

## Database Requirements

The application expects these tables:
- `items_parses`: Contains DPS parsing data
- `items`: Contains item details (following EQEmu schema)

## Security Notes

1. Never commit `.env` files or expose database credentials
2. Use environment variables for production deployments
3. Configure CORS origins appropriately
4. Consider adding authentication for public deployments
5. Use HTTPS in production

## Troubleshooting

### Backend won't connect to database
- Verify MySQL is running and accessible
- Check credentials in `.env` or `config.json`
- Ensure database and tables exist

### Frontend can't reach backend
- Check if backend is running on correct port
- Verify CORS origins include frontend URL
- Check `VITE_API_URL` in frontend `.env`

### Page loads but no items appear
- Check browser console for errors
- Verify API endpoint is accessible
- Check that items_parses table has data

## License

This project is for personal/educational use with EverQuest game data.