const { Pool, Client } = require('pg')

// const client = new Client({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'reviewclass',
//   password: '123456',
//   port: 5432,
// })
// client.connect()
// client.query('SELECT * from movies', (err, res) => {
//   console.log(res.rows)
//   client.end()
// })


const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    password: '123456',
    port: 5432,
    database: 'reviewclass'
})
const deletePOI = async (id) => {
    const client = await pool.connect()

    const result = await client.query(`delete * from TABLE where id='${id}'`)
    
    client.release();
    
    if (err) {
        return console.error('Error executing query', err.stack)
    }
    return result;


}

data = getPOI()

console.log(data)
