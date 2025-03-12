const XLSX = require("xlsx");
const pool = require("./db");
require("dotenv").config();

async function importData(filePath) {
  let databaseTable = process.env.DB_TABLE;
  console.time("ImportTime");
  const BATCH_SIZE = 3000;
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const filteredData = data.filter((row) => row.matricule);

  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    for (let i = 0; i < filteredData.length; i += BATCH_SIZE) {
      const batch = filteredData.slice(i, i + BATCH_SIZE);
      const values = batch.map((row) => [
        row.matricule,
        row.nom,
        row.prenom,
        row.datedenaissance,
        row.status,
      ]);

      await connection.query(
        `INSERT INTO ${databaseTable} (matricule, nom, prenom, datedenaissance, status) VALUES ?`,
        [values]
      );
    }

    await connection.commit();
    connection.release();
  } catch (error) {
    console.error("Error importing data:", error.message);
    if (connection) {
      await connection.rollback();
      connection.release();
    }
  }

  console.timeEnd("ImportTime");
}

module.exports = importData;
