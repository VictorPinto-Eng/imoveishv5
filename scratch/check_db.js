const path = require('path');
const { query } = require(path.join(process.cwd(), 'lib', 'db'));

async function check() {
    try {
        const res = await query(`
            SELECT id, descricao, estado_id, COUNT(*) OVER(PARTITION BY translate(UPPER(descricao), 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'AAAAAEEEEIIIIOOOOOUUUUC'), estado_id) as cnt
            FROM apocidade
            ORDER BY cnt DESC, descricao
            LIMIT 50
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    }
}

check();
