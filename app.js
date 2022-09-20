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

function decodeToken(req) {
    return jwt.verify(req.headers["x-access-token"], process.env.TOKEN_KEY);
}

const api = process.env.API_BASE

app.post(api + "/student/register", async (req, res) => {
    try {
        const { name, enrolled_from, enrolled_to } = req.body;

        if (!(name && enrolled_from && enrolled_to)) {
            return res.status(400).send("All input is required");
        }

        if (Date.parse(enrolled_from) > Date.parse(enrolled_to)) {
            return res.status(400).send("enrolled_to must be greater than enrolled_from");
        }

        let id;

        await pool.query('INSERT INTO students (name, enrolled_from, enrolled_to, registered_on) VALUES ($1::varchar, $2::date, $3::date, $4::timestamp) RETURNING id',
            [name, enrolled_from, enrolled_to, new Date()])
            .then((result) => {
                id = result.rows[0].id;
            })
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send()
            })

        const signed_token = jwt.sign(
            { id: id, stuff: Math.random() },
            process.env.TOKEN_KEY
        );

        return res.status(201).json({ token: signed_token })

    } catch (error) {
        console.error(error);
    }
})

app.get(api + "/student", auth, async (req, res) => {
    const decoded_token = decodeToken(req)

    let result

    await pool.query('SELECT * FROM students WHERE id = $1::integer',
        [decoded_token["id"]])
        .then((q_res) => {
            q_res.rows.forEach((row) => {
                delete row.id
                delete row.token
            })
            result = q_res.rows[0]
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

app.delete(api + "/student", auth, async (req, res) => {
    // TODO: Implement this
})

app.post(api + "/student/enlistment", auth, async (req, res) => {
    const { year, week, monday, tuesday, wednesday, thursday, friday } = req.body;
    const decoded_token = decodeToken(req)

    await pool.query('INSERT INTO enlistments (student_id, year, week, monday, tuesday, wednesday, thursday, friday) VALUES ($1::integer, $2::integer, $3::integer, $4::boolean, $5::boolean, $6::boolean, $7::boolean, $8::boolean)',
        [decoded_token["id"], year, week, monday, tuesday, wednesday, thursday, friday])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(201).send()
})

app.patch(api + '/student/enlistment', auth, async (req, res) => {
    const { year, week, monday, tuesday, wednesday, thursday, friday } = req.body;
    const decoded_token = decodeToken(req)

    await pool.query('UPDATE enlistments SET monday = $1::boolean, tuesday = $2::boolean, wednesday = $3::boolean, thursday = $4::boolean, friday = $5::boolean WHERE student_id = $6::integer and year = $7::integer and week = $8::integer',
        [monday, tuesday, wednesday, thursday, friday, decoded_token['id'], year, week])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).send()
})

app.get(api + "/student/enlistment/all", auth, async (req, res) => {
    const decoded_token = decodeToken(req)

    let result

    await pool.query('SELECT * FROM enlistments WHERE student_id = $1::integer',
        [decoded_token["id"]])
        .then((q_res) => {
            q_res.rows.forEach((row) => delete row.student_id)
            result = q_res.rows;
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

app.get(api + "/student/enlistment/single", auth, async (req, res) => {
    const decoded_token = decodeToken(req)
    const year = req.query.year
    const week = req.query.week

    let result

    await pool.query('SELECT * FROM enlistments WHERE student_id = $1::integer and year = $2::integer and week = $3::integer',
        [decoded_token["id"], year, week])
        .then((q_res) => {
            q_res.rows.forEach((row) => delete row.student_id)
            result = q_res.rows[0];
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

app.get(api + "/staff/enlistment", auth, async (req, res) => {
    const year = req.query.year
    const week = req.query.week

    // TODO: Implement
})

app.post(api + "/staff/enrolled_number", auth, async (req, res) => {
    // TODO: Implement
})

app.get(api + "/staff/enrolled_number", auth, async (req, res) => {
    // TODO: Implement
})

app.post(api + "/menu", auth, async (req, res) => {
    const { year, week, monday, tuesday, wednesday, thursday } = req.body;

    await pool.query('INSERT INTO menus (week, year, monday, tuesday, wednesday, thursday) VALUES ($1::integer, $2::integer, $3::varchar, $4::varchar, $5::varchar, $6::varchar)',
        [week, year, monday, tuesday, wednesday, thursday])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(201).send()
})

app.get(api + "/menu/single", async (req, res) => {
    const year = req.query.year
    const week = req.query.week

    let result

    await pool.query('SELECT * FROM menus WHERE year = $1::integer and week = $2::integer',
        [year, week])
        .then((q_res) => {
            result = q_res.rows[0]
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

app.get(api + "/menu/all", async (req, res) => {
    let result

    await pool.query('SELECT * FROM menus')
        .then((q_res) => {
            result = q_res.rows
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

module.exports = app;
