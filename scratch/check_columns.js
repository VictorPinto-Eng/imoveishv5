
const { query } = require('../lib/db');

async function checkColumns() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'produtos_servicos'
            ORDER BY column_name
        `);
        console.log('Columns in produtos_servicos:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    } catch (e) {
        console.error(e);
    }
}

checkColumns();
