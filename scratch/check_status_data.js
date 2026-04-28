
const { query } = require('../lib/db');

async function check() {
    try {
        const res = await query('SELECT status, statusimovel FROM produtos_servicos LIMIT 10');
        console.log('Sample data:', res.rows);
        
        const statuses = await query('SELECT * FROM statimovel');
        console.log('Available physical statuses:', statuses.rows);
    } catch (e) {
        console.error(e);
    }
}

check();
