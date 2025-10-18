const mysql = require('mysql2/promise');
const { getDatabaseCredentials } = require('./config');

async function checkColumns() {
  try {
    const connection = await mysql.createConnection(getDatabaseCredentials());

    const [columns] = await connection.execute('SHOW COLUMNS FROM items');
    const columnNames = columns.map(col => col.Field);

    console.log('Total columns in items table:', columnNames.length);
    console.log('\nFirst 20 columns:');
    columnNames.slice(0, 20).forEach(col => console.log(' - ' + col));

    // Check specific columns we're trying to use
    const checkCols = ['combat_effects', 'worn_effects', 'heroic_str', 'heroic_sta'];
    console.log('\nChecking for specific columns:');
    checkCols.forEach(col => {
      console.log(` - ${col}: ${columnNames.includes(col) ? 'EXISTS' : 'MISSING'}`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkColumns();
