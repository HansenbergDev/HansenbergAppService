const { Client } = require("pg")

exports.connect = () => {
    new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT
    }).connect()
        .then(() => console.log('Connected to database'))
        .catch(err => {
            console.error('Database connection failed', err.stack);
            process.exit(1);
        });
}