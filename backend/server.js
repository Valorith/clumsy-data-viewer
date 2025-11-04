const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { loadConfig, getPoolConfig } = require('./config');
const { parseNumberParam, parseItemTypesParam } = require('./utils/query-params');

const config = loadConfig();

const app = express();

const dbConfig = getPoolConfig();

const pool = mysql.createPool(dbConfig);

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json());

const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : config.server.corsOrigins;

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/items', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize) || config.api.pageSize, config.api.maxPageSize);
    const offset = (page - 1) * pageSize;
    
    const search = req.query.search || '';
    const minMeleeDps = parseNumberParam(req.query.minMeleeDps, 0);
    const maxMeleeDps = parseNumberParam(req.query.maxMeleeDps, 9999);
    const minSpellDps = parseNumberParam(req.query.minSpellDps, 0);
    const maxSpellDps = parseNumberParam(req.query.maxSpellDps, 9999);
    const hasBane = req.query.hasBane === 'true';
    const hasBackstab = req.query.hasBackstab === 'true';
    const { itemTypes, error: itemTypesError } = parseItemTypesParam(req.query.itemTypes);
    if (itemTypesError) {
      return res.status(400).json({ error: itemTypesError });
    }
    const sortBy = req.query.sortBy || 'item_id';
    const sortOrder = req.query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    const validSortFields = ['item_id', 'name', 'mh_dps', 'mh_spell_dps', 'oh_spell_dps', 
                            'oh_dps', 'mh_oh_dps', 'bs_dps', 'bane_dps', 'total_dps'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'item_id';
    
    let whereConditions = ['1=1'];
    let queryParams = [];
    
    if (search) {
      whereConditions.push('(i.Name LIKE ? OR ip.notes LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    whereConditions.push('ip.mh_dps >= ? AND ip.mh_dps <= ?');
    queryParams.push(minMeleeDps, maxMeleeDps);
    
    whereConditions.push('ip.mh_spell_dps >= ? AND ip.mh_spell_dps <= ?');
    queryParams.push(minSpellDps, maxSpellDps);
    
    if (hasBane) {
      whereConditions.push('ip.bane_dps > 0');
    }
    
    if (hasBackstab) {
      whereConditions.push('ip.bs_dps > 0');
    }
    
    if (itemTypes.length > 0) {
      whereConditions.push(`i.itemtype IN (${itemTypes.map(() => '?').join(',')})`);
      queryParams.push(...itemTypes);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM items_parses ip
      LEFT JOIN items i ON ip.item_id = i.id
      WHERE ${whereClause}
    `;
    
    const [[{ total }]] = await pool.execute(countQuery, queryParams);
    
    const dataQuery = `
      SELECT 
        ip.*,
        i.Name as name,
        i.icon,
        i.itemtype,
        i.classes,
        i.races,
        i.slots,
        i.damage,
        i.delay,
        i.ac,
        i.hp,
        i.mana,
        i.endur,
        i.astr,
        i.asta,
        i.aagi,
        i.adex,
        i.acha,
        i.aint,
        i.awis,
        i.heroic_str,
        i.heroic_sta,
        i.heroic_agi,
        i.heroic_dex,
        i.heroic_cha,
        i.heroic_int,
        i.heroic_wis,
        i.reqlevel,
        i.reclevel,
        i.weight,
        i.price,
        i.proceffect,
        i.clickeffect,
        i.clicktype,
        i.worneffect,
        i.worntype,
        i.focuseffect
      FROM items_parses ip
      LEFT JOIN items i ON ip.item_id = i.id
      WHERE ${whereClause}
      ORDER BY ${sortField === 'name' ? 'i.Name' : 'ip.' + sortField} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(pageSize, offset);
    const [rows] = await pool.execute(dataQuery, queryParams);
    
    res.json({
      items: rows,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/items/:id', async (req, res) => {
  try {
    const itemId = req.params.id;
    
    const query = `
      SELECT 
        ip.*,
        i.*
      FROM items_parses ip
      LEFT JOIN items i ON ip.item_id = i.id
      WHERE ip.item_id = ?
    `;
    
    const [rows] = await pool.execute(query, [itemId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as totalItems,
        MAX(mh_dps) as maxMeleeDps,
        MAX(mh_spell_dps) as maxSpellDps,
        MAX(total_dps) as maxTotalDps,
        COUNT(CASE WHEN bane_dps > 0 THEN 1 END) as baneItems,
        COUNT(CASE WHEN bs_dps > 0 THEN 1 END) as backstabItems
      FROM items_parses
    `;
    
    const typeCountsQuery = `
      SELECT i.itemtype, COUNT(*) as count
      FROM items_parses ip
      LEFT JOIN items i ON ip.item_id = i.id
      WHERE i.itemtype IS NOT NULL
      GROUP BY i.itemtype
    `;
    
    const [[stats]] = await pool.execute(statsQuery);
    const [typeCounts] = await pool.execute(typeCountsQuery);
    
    const typeCountMap = {};
    typeCounts.forEach(row => {
      typeCountMap[row.itemtype] = row.count;
    });
    
    res.json({
      ...stats,
      typeCounts: typeCountMap
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

if (process.env.NODE_ENV === 'production') {
  const publicDir = path.join(__dirname, 'public');
  const indexFile = path.join(publicDir, 'index.html');

  if (fs.existsSync(publicDir) && fs.existsSync(indexFile)) {
    app.use(express.static(publicDir));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(indexFile);
    });
  } else {
    console.warn('Production static assets not found; skipping static file serving.');
  }
}

const PORT = process.env.SERVER_PORT || config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log('Database config:', { 
    host: dbConfig.host, 
    port: dbConfig.port, 
    database: dbConfig.database 
  });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});
