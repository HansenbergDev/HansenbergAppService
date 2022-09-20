import { setStudentApi } from "./student.js";
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

app = setStudentApi(app);

module.exports = app;
