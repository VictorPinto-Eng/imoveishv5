require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg'); 
const poolHv5 = new Pool({ connectionString: process.env.HV5_DATABASE_URL }); 
poolHv5.query("SELECT id, nome, sigla FROM public.apoestado ORDER BY nome").then(res => { 
    console.log("SUCESSO HV5:", res.rows.slice(0, 2)); 
    poolHv5.end(); 
}).catch(err => {
    console.error("ERRO HV5:", err.message);
    poolHv5.end();
});

const poolDb = new Pool({ connectionString: process.env.DATABASE_URL });
poolDb.query("SELECT id, nome, sigla FROM public.apoestado ORDER BY nome").then(res => { 
    console.log("SUCESSO DB:", res.rows.slice(0, 2)); 
    poolDb.end(); 
}).catch(err => {
    console.error("ERRO DB:", err.message);
    poolDb.end();
});
