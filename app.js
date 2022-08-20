require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
const { Pool } = require("pg");

const app = express();
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})

app.use(express.json());

app.post("/student/register", async (req, res) => {
    try {
        const { name, enrolled_from, enrolled_to } = req.body;

        // TODO: Check at enrolled_from er mindre en enrolled_to

        if (!(name && enrolled_from && enrolled_to)) {
            return res.status(400).send("All input is required");
        }

        let id;

        await pool.query('INSERT INTO students (name, enrolled_from, enrolled_to) VALUES ($1::varchar, $2::date, $3::date) RETURNING id',
            [name, enrolled_from, enrolled_to])
            .then((result) => {
                id = result.rows[0].id;
            })
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send()
            })


        const signed_token = jwt.sign(
            {student_id: id, student_name: name},
            process.env.TOKEN_KEY
        );

        let final_result

        await pool.query('UPDATE students SET token = $1::varchar WHERE id = $2::integer RETURNING token',
            [signed_token, id])
            .then((result) => {
                final_result = result.rows[0].token;
            })
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send()
            })


        return res.status(201).json({student_id: id, token: signed_token})

    } catch (error) {
        console.log(error);
    }
})

app.get("/welcome", auth, async (req, res) => {
    res.status(200).send("Welcome!");
})

module.exports = app;
