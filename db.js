require("dotenv").config();

let pool;
const dbType = process.env.DB_TYPE || "mysql";

try {
  if (dbType === "mysql") {
    const mysql = require("mysql2");
    pool = mysql
      .createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      })
      .promise();
  } else if (dbType === "postgres") {
    const { Pool } = require("pg");
    pool = new Pool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  } else if (dbType === "sqlite") {
    const sqlite3 = require("sqlite3").verbose();
    const { open } = require("sqlite");
    pool = open({
      filename: process.env.DB_FILE || "./database.sqlite",
      driver: sqlite3.Database,
    });
  } else {
    throw new Error(`Unsupported database type: ${dbType}`);
  }

  console.log(`Database connection pool created for ${dbType}.`);
} catch (error) {
  console.error("Error creating database pool:", error.message);
  process.exit(1);
}

module.exports = pool;
