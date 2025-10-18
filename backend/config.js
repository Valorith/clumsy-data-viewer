const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

let cachedConfig = null;

const DEFAULT_CONFIG = {
  server: {
    port: 3001,
    host: '0.0.0.0',
    corsOrigins: []
  },
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: '',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
  },
  api: {
    pageSize: 50,
    maxPageSize: 200,
    cacheTime: 300
  }
};

function resolveConfigPath() {
  if (process.env.BACKEND_CONFIG_PATH) {
    return path.resolve(process.env.BACKEND_CONFIG_PATH);
  }

  return path.join(__dirname, 'config.json');
}

function readConfigFile(configPath) {
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    const rawConfig = fs.readFileSync(configPath, 'utf8');
    if (!rawConfig.trim()) {
      return {};
    }

    return JSON.parse(rawConfig);
  } catch (error) {
    throw new Error(`Failed to read backend config from ${configPath}: ${error.message}`);
  }
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') {
    return { ...base };
  }

  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(base[key] || {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

function loadConfig() {
  if (!cachedConfig) {
    const configPath = resolveConfigPath();
    const fileConfig = readConfigFile(configPath);
    cachedConfig = deepMerge(DEFAULT_CONFIG, fileConfig);
  }

  return cachedConfig;
}

function parsePort(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getDatabaseCredentials() {
  const config = loadConfig();
  const databaseConfig = config.database || {};
  const envPort = parsePort(process.env.DB_PORT);

  return {
    host: process.env.DB_HOST || databaseConfig.host,
    port: envPort ?? databaseConfig.port,
    user: process.env.DB_USER || databaseConfig.user,
    password: process.env.DB_PASSWORD || databaseConfig.password,
    database: process.env.DB_NAME || databaseConfig.database
  };
}

function getPoolConfig() {
  const config = loadConfig();
  const databaseConfig = config.database || {};

  return {
    ...getDatabaseCredentials(),
    connectionLimit: databaseConfig.connectionLimit,
    waitForConnections: databaseConfig.waitForConnections,
    queueLimit: databaseConfig.queueLimit
  };
}

module.exports = {
  loadConfig,
  getDatabaseCredentials,
  getPoolConfig,
  resolveConfigPath
};
