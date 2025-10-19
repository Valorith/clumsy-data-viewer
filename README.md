# Clumsy's World Parse Viewer

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

### Hosting on an IONOS (formerly 1&1 IONOS) Web Server

The project can be hosted on a basic IONOS "web hosting" or "managed server" plan by building the frontend as static assets and running the backend on the Linux shell environment provided with the contract.

1. **Prepare the environment**
   - Enable SSH access from the IONOS control panel.
   - SSH into the server and install Node.js (16+ recommended). On Debian/Ubuntu based templates you can use the NodeSource installer:

     ```bash
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs build-essential
     ```

   - Install MySQL client libraries if you plan to connect to an external database (`sudo apt-get install default-libmysqlclient-dev`).

2. **Clone and configure the app**
   ```bash
   cd ~
   git clone https://github.com/<your-account>/clumsy-data-viewer.git
   cd clumsy-data-viewer

   # backend dependencies
   cd backend && npm install

   # copy config and set credentials for your MySQL instance (can be an IONOS Managed DB or external)
   cp .env.example .env
   nano .env

   # frontend dependencies
   cd ../frontend && npm install
   cp .env.example .env.local
   nano .env.local   # set VITE_API_URL to the public URL that will proxy to the backend
   ```

3. **Build the frontend and upload to the web root**
   ```bash
   cd ~/clumsy-data-viewer/frontend
   npm run build
   ```

   Copy the contents of `frontend/dist/` into the document root that IONOS serves (e.g. `~/www/` or `/var/www/vhosts/<domain>/httpdocs`). For example:

   ```bash
   rsync -av dist/ ~/www/
   ```

4. **Run the backend API**
   - Change into the backend folder and start the API with PM2 so it keeps running after logout:

     ```bash
     cd ~/clumsy-data-viewer/backend
     pm2 start server.js --name eq-item-api
     pm2 save
     ```

   - Expose the API on an internal port (default 3001). Ensure your firewall allows outbound MySQL traffic and inbound traffic on the API port if you intend to access it directly.

5. **Proxy API requests through the IONOS web server**
   - If you have an Apache-based plan, create/update `.htaccess` in the document root to forward `/api` calls to the Node backend:

     ```apache
     RewriteEngine On
     RewriteCond %{REQUEST_URI} ^/api
     RewriteRule ^(.*)$ http://127.0.0.1:3001/$1 [P,L]
     ProxyPassReverse /api http://127.0.0.1:3001/
     ```

   - For nginx-based managed servers, add a server block similar to the one above in "Serve with a Web Server" that points `/api` to `http://127.0.0.1:3001` and the root to the `frontend/dist` directory.

6. **Keep services running**
   - PM2 will keep the Node.js backend alive; run `pm2 startup` once to install the system service and `pm2 save` after any process changes.
   - Rebuild and re-sync `frontend/dist/` whenever you deploy new frontend changes.

7. **Optional hardening**
   - Use HTTPS by enabling a free Let's Encrypt certificate from the IONOS control panel or by installing Certbot on the server.
   - Restrict access to the Node backend port via firewall (e.g. `ufw allow 3001/tcp` for localhost only).
   - Configure environment variables rather than committing credentials.

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
