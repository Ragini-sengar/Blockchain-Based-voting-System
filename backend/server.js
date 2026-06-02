import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Rs_132005",
    database: "voting_system"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed", err);
        return;
    }
    console.log("MySQL connected successfully");
});

// Add scheme
app.post("/add-scheme", (req, res) => {
    const {
        name,
        description,
        age_min,
        age_max,
        gender,
        income_limit,
        region,
        start_date,
        expiry_date
    } = req.body;

    const sql = `
        INSERT INTO schemes
        (name, description, age_min, age_max, gender, income_limit, region, start_date, expiry_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
    `;

    db.query(
        sql,
        [name, description, age_min, age_max, gender, income_limit, region, start_date, expiry_date],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Scheme added successfully",
                scheme_id: result.insertId
            });
        }
    );
});

// Register user
app.post("/register-user", (req, res) => {
    const {
        aadhaar,
        mobile,
        name,
        age,
        gender,
        income,
        region
    } = req.body;

    const sql = `
        INSERT INTO users
        (aadhaar, mobile, name, age, gender, income, region)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [aadhaar, mobile, name, age, gender, income, region],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "User registered successfully",
                user_id: result.insertId
            });
        }
    );
});

// Save vote transaction
app.post("/save-vote", (req, res) => {
    const {
        scheme_id,
        voter_hash,
        transaction_hash
    } = req.body;

    const sql = `
        INSERT INTO votes
        (scheme_id, voter_hash, transaction_hash)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [scheme_id, voter_hash, transaction_hash],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Vote transaction saved",
                vote_id: result.insertId
            });
        }
    );
});

// Get all schemes
app.get("/schemes", (req, res) => {
    db.query(
        "SELECT * FROM schemes WHERE status='ACTIVE'",
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
});

app.listen(5000, () => {
    console.log("Backend running on http://localhost:5000");
});