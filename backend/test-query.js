const mysql = require('mysql2/promise');
const { getDatabaseCredentials } = require('./config');

async function testQuery() {
  try {
    const connection = await mysql.createConnection(getDatabaseCredentials());

    // Test a simple query first
    const query = `
      SELECT
        ip.*,
        i.id,
        i.Name,
        i.itemtype,
        i.classes,
        i.races,
        i.slots,
        i.damage,
        i.delay,
        i.ac,
        i.hp,
        i.mana
      FROM items_parses ip
      LEFT JOIN items i ON ip.item_id = i.id
      LIMIT 1
    `;

    const [rows] = await connection.execute(query);
    console.log('Query successful! Sample item:');
    console.log(rows[0]);

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuery();
