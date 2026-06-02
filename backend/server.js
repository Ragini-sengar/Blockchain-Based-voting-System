import express from "express";
import mysql from "mysql2";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.log("MySQL connection failed:", err);
        return;
    }

    console.log("MySQL connected successfully");
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashValue(value) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

// USER SEND OTP
app.post("/user/send-otp", (req, res) => {
    const { aadhaar } = req.body;

    const sql = "SELECT * FROM users WHERE aadhaar = ?";

    db.query(sql, [aadhaar], (err, users) => {
        if (err) return res.status(500).json(err);

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];
        const otp = generateOTP();

        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        const otpSql = `
            INSERT INTO otp_logs
            (mobile, otp, expiry_time, verified)
            VALUES (?, ?, ?, 0)
        `;

        db.query(otpSql, [user.mobile, otp, expiry], (err) => {
            if (err) return res.status(500).json(err);

            console.log("USER OTP:", otp);

            res.json({
                message: "OTP sent successfully",
                demo_otp: otp,
                mobile: user.mobile
            });
        });
    });
});

// USER VERIFY OTP
app.post("/user/verify-otp", (req, res) => {
    const { aadhaar, otp } = req.body;

    const userSql = "SELECT * FROM users WHERE aadhaar = ?";

    db.query(userSql, [aadhaar], (err, users) => {
        if (err) return res.status(500).json(err);

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        const otpSql = `
            SELECT * FROM otp_logs
            WHERE mobile = ?
            AND otp = ?
            AND verified = 0
            AND expiry_time > NOW()
            ORDER BY otp_id DESC
            LIMIT 1
        `;

        db.query(otpSql, [user.mobile, otp], (err, logs) => {
            if (err) return res.status(500).json(err);

            if (logs.length === 0) {
                return res.status(400).json({
                    message: "Invalid or expired OTP"
                });
            }

            db.query(
                "UPDATE otp_logs SET verified = 1 WHERE otp_id = ?",
                [logs[0].otp_id]
            );

            res.json({
                message: "User login successful",
                user: user
            });
        });
    });
});

// ADMIN SEND OTP
app.post("/admin/send-otp", (req, res) => {
    const { admin_id } = req.body;

    const sql = "SELECT * FROM admins WHERE admin_id = ?";

    db.query(sql, [admin_id], (err, admins) => {
        if (err) return res.status(500).json(err);

        if (admins.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const admin = admins[0];
        const otp = generateOTP();
        const expiry = new Date(Date.now() + 5 * 60 * 1000);

        const otpSql = `
            INSERT INTO otp_logs
            (mobile, otp, expiry_time, verified)
            VALUES (?, ?, ?, 0)
        `;

        db.query(otpSql, [admin.mobile, otp, expiry], (err) => {
            if (err) return res.status(500).json(err);

            console.log("ADMIN OTP:", otp);

            res.json({
                message: "OTP sent successfully",
                demo_otp: otp,
                mobile: admin.mobile
            });
        });
    });
});

// ADMIN VERIFY OTP
app.post("/admin/verify-otp", (req, res) => {
    const { admin_id, otp } = req.body;

    const sql = "SELECT * FROM admins WHERE admin_id = ?";

    db.query(sql, [admin_id], (err, admins) => {
        if (err) return res.status(500).json(err);

        if (admins.length === 0) {
            return res.status(404).json({
                message: "Admin not found"
            });
        }

        const admin = admins[0];

        const otpSql = `
            SELECT * FROM otp_logs
            WHERE mobile = ?
            AND otp = ?
            AND verified = 0
            AND expiry_time > NOW()
            ORDER BY otp_id DESC
            LIMIT 1
        `;

        db.query(otpSql, [admin.mobile, otp], (err, logs) => {
            if (err) return res.status(500).json(err);

            if (logs.length === 0) {
                return res.status(400).json({
                    message: "Invalid or expired OTP"
                });
            }

            db.query(
                "UPDATE otp_logs SET verified = 1 WHERE otp_id = ?",
                [logs[0].otp_id]
            );

            res.json({
                message: "Admin login successful",
                admin: admin
            });
        });
    });
});

// CREATE SCHEME
app.post("/admin/create-scheme", (req, res) => {
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
        [
            name,
            description,
            age_min,
            age_max,
            gender,
            income_limit,
            region,
            start_date,
            expiry_date
        ],
        (err, result) => {
            if (err) return res.status(500).json(err);

            res.json({
                message: "Scheme created successfully",
                scheme_id: result.insertId
            });
        }
    );
});

// DELETE/CLOSE SCHEME
app.put("/admin/close-scheme/:scheme_id", (req, res) => {
    const { scheme_id } = req.params;

    const sql = `
        UPDATE schemes
        SET status = 'CLOSED'
        WHERE scheme_id = ?
    `;

    db.query(sql, [scheme_id], (err) => {
        if (err) return res.status(500).json(err);

        res.json({
            message: "Scheme closed successfully"
        });
    });
});

// GET ELIGIBLE SCHEMES
app.post("/user/eligible-schemes", (req, res) => {
    const { aadhaar } = req.body;

    const userSql = "SELECT * FROM users WHERE aadhaar = ?";

    db.query(userSql, [aadhaar], (err, users) => {
        if (err) return res.status(500).json(err);

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = users[0];

        const schemeSql = `
            SELECT * FROM schemes
            WHERE status = 'ACTIVE'
            AND age_min <= ?
            AND age_max >= ?
            AND income_limit >= ?
            AND (gender = ? OR gender = 'Other')
            AND (region = ? OR region = 'All')
            AND expiry_date >= CURDATE()
        `;

        db.query(
            schemeSql,
            [
                user.age,
                user.age,
                user.income,
                user.gender,
                user.region
            ],
            (err, schemes) => {
                if (err) return res.status(500).json(err);

                res.json({
                    user: user,
                    schemes: schemes
                });
            }
        );
    });
});

// SAVE VOTE TRANSACTION
app.post("/save-vote", (req, res) => {
    const {
        scheme_id,
        voter_aadhaar,
        transaction_hash
    } = req.body;

    const voter_hash = hashValue(voter_aadhaar);

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
                message: "Vote saved successfully",
                vote_id: result.insertId
            });
        }
    );
});

// ADMIN LIVE RESULTS FROM DATABASE
app.get("/admin/live-results", (req, res) => {
    const sql = `
        SELECT 
            schemes.scheme_id,
            schemes.name,
            COUNT(votes.vote_id) AS total_votes
        FROM schemes
        LEFT JOIN votes
        ON schemes.scheme_id = votes.scheme_id
        GROUP BY schemes.scheme_id, schemes.name
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);

        res.json(results);
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Backend running on http://localhost:${process.env.PORT}`);
});