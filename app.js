require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const jwt = require("jsonwebtoken");
const student_auth = require("./middleware/student_auth");
const admin_auth = require("./middleware/admin_auth");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs/dist/bcrypt");

const app = express();
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})

app.use(express.json());

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,PUT,PATCH,POST,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

function decodeStudentToken(req) {
    return jwt.verify(req.headers["x-access-token"], process.env.STUDENT_TOKEN_KEY);
}

function decodeAdminToken(req) {
    return jwt.verify(req.headers["x-access-token"], process.env.ADMIN_TOKEN_KEY);
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
        let date = new Date()

        await pool.query('INSERT INTO students (name, enrolled_from, enrolled_to, created_on) VALUES ($1::varchar, $2::date, $3::date, $4::timestamp) RETURNING id',
            [name, enrolled_from, enrolled_to, date])
            .then((result) => {
                id = result.rows[0].id;
            })
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send()
            })

        const signed_token = jwt.sign(
            { id: id, date: date, stuff: Math.random() },
            process.env.STUDENT_TOKEN_KEY
        );

        return res.status(201).json({ token: signed_token })

    } catch (error) {
        console.error(error);
        return res.status(400).send()
    }
})

app.get(api + "/student", student_auth, async (req, res) => {
    const decoded_token = decodeStudentToken(req)

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

app.delete(api + "/student", student_auth, async (req, res) => {

    const decoded_token = decodeStudentToken(req)

    await pool.query('DELETE FROM students WHERE id = $1::integer',
        [decoded_token["id"]])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(410).send()
})

app.post(api + "/student/enlistment", student_auth, async (req, res) => {
    const { year, week, monday, tuesday, wednesday, thursday, friday } = req.body;
    const decoded_token = decodeStudentToken(req)

    if (!(year && week && monday && tuesday && wednesday && thursday && friday)) {
        return res.status(400).send("All input is required");
    }

    await pool.query('INSERT INTO enlistments (student_id, year, week, monday, tuesday, wednesday, thursday, friday, created_on) VALUES ($1::integer, $2::integer, $3::integer, $4::boolean, $5::boolean, $6::boolean, $7::boolean, $8::boolean, $9::timestamp)',
        [decoded_token["id"], year, week, monday, tuesday, wednesday, thursday, friday, new Date()])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(201).send()
})

app.patch(api + '/student/enlistment', student_auth, async (req, res) => {
    const { year, week, monday, tuesday, wednesday, thursday, friday } = req.body;
    const decoded_token = decodeStudentToken(req)

    if (!(year && week && monday && tuesday && wednesday && thursday && friday)) {
        return res.status(400).send("All input is required");
    }

    await pool.query('UPDATE enlistments SET monday = $1::boolean, tuesday = $2::boolean, wednesday = $3::boolean, thursday = $4::boolean, friday = $5::boolean WHERE student_id = $6::integer and year = $7::integer and week = $8::integer',
        [monday, tuesday, wednesday, thursday, friday, decoded_token['id'], year, week])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).send()
})

app.get(api + "/student/enlistment/all", student_auth, async (req, res) => {
    const decoded_token = decodeStudentToken(req)

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

app.get(api + "/student/enlistment/single", student_auth, async (req, res) => {
    const decoded_token = decodeStudentToken(req)
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

app.post(api + "/staff/register", admin_auth, async (req, res) => {
    const decoded_token = decodeAdminToken(req)

    try {
        const { username, password } = req.body;

        if (!(username && password)) {
            return res.status(400).send("All input is required");
        }

        let existingUserCheck

        await pool.query('SELECT username FROM admins WHERE username = $1::varchar',
            [username])
            .then((q_res) => {
                existingUserCheck = q_res.rows.length == 1
            })
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send();
            })

        if (existingUserCheck) {
            return res.status(409).send("User already exists, please login");
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        await pool.query('INSERT INTO admins (username, password) VALUES ($1::varchar, $2::varchar)',
            [username, encryptedPassword])
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send()
            })

        return res.status(201).send()
    }
    catch (error) {
        console.error(error);
        return res.status(400).send()
    }
})

app.post(api + "/staff/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!(username && password)) {
            return res.status(400).send("All input is required");
        }

        let existingUserCheck
        let storedPassword

        await pool.query('SELECT username, password FROM admins WHERE username = $1::varchar',
            [username])
            .then((q_res) => {
                existingUserCheck = q_res.rows.length == 1

                if (existingUserCheck) {
                    storedPassword = q_res.rows[0].password
                }
            })
            .catch((error) => {
                console.error('Error executing query', error.stack);
                return res.status(400).send();
            })

        if (existingUserCheck && (await bcrypt.compare(password, storedPassword))) {
            const signed_token = jwt.sign(
                { username: username, stuff: Math.random() },
                process.env.ADMIN_TOKEN_KEY,
                { expiresIn: "12h", }
            );

            return res.status(200).json({ token: signed_token })
        }
        else {
            return res.status(400).send("Username or password incorrect.")
        }
    }
    catch (error) {
        console.error(error);
        return res.status(400).send();
    }
})

app.get(api + "/staff/enlistment/day", admin_auth, async (req, res) => {
    const year = req.query.year
    const week = req.query.week
    const day = req.query.day

    if (day != 'monday' && day != 'tuesday' && day != 'wednesday' && day != 'thursday' && day != 'friday') {
        return res.status(400).send("'day' input should be either: 'monday', 'tuesday', 'wednesday', or 'thursday'");
    }

    let result

    await pool.query('SELECT COUNT(*) FROM enlistments WHERE ' + day + ' = true AND week = $1::integer AND year = $2::integer',
        [week, year])
        .then((q_res) => {
            result = q_res.rows[0]
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

app.post(api + "/staff/enrolled_number/week", admin_auth, async (req, res) => {
    const { week, year, number } = req.body;

    if (!(week && year && number)) {
        return res.status(400).send("All input is required");
    }

    await pool.query('INSERT INTO enrollments (week, year, number_of_enrolled_students) VALUES ($1::integer, $2::integer, $3::integer)',
        [week, year, number])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(201).send()
})

app.patch(api + "/staff/enrolled_number/week", admin_auth, async (req, res) => {
    const { week, year, number } = req.body;

    if (!(week && year && number)) {
        return res.status(400).send("All input is required");
    }

    await pool.query('UPDATE enrollments SET number_of_enrolled_students = $1::integer WHERE week = $2::integer AND year = $3::integer',
        [number, week, year])
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).send()
})

app.get(api + "/staff/enrolled_number/week", admin_auth, async (req, res) => {
    const year = req.query.year
    const week = req.query.week

    let result

    await pool.query('SELECT number_of_enrolled_students FROM enrollments WHERE week = $1::integer AND year = $2::integer',
        [week, year])
        .then((q_res) => {
            result = q_res.rows[0]
        })
        .catch((error) => {
            console.error('Error executing query', error.stack);
            return res.status(400).send()
        })

    return res.status(200).json(result)
})

app.post(api + "/menu", admin_auth, async (req, res) => {
    const { year, week, monday, tuesday, wednesday, thursday } = req.body;

    if (!(year && week && monday && tuesday && wednesday && thursday)) {
        return res.status(400).send("All input is required");
    }

    await pool.query('INSERT INTO menus (week, year, monday, tuesday, wednesday, thursday, created_on) VALUES ($1::integer, $2::integer, $3::varchar, $4::varchar, $5::varchar, $6::varchar, $7::timestamp)',
        [week, year, monday, tuesday, wednesday, thursday, new Date()])
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


app.post(api + "/student/tokenCheck", student_auth, async (req, res) => {
    return res.status(200).send()
})

app.post(api + "/staff/tokenCheck", admin_auth, async (req, res) => {
    return res.status(200).send()
})

module.exports = app;
