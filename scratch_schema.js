require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); 
pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'hv5';").then(res => { 
    console.log(JSON.stringify(res.rows, null, 2)); 
    pool.end(); 
}).catch(err => {
    console.error(err);
    pool.end();
});
