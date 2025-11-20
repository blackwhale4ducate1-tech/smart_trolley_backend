const Sequelize = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

const environment = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, `../.env.${environment}`);

dotenv.config({ path: envPath });

const superAdminDB = new Sequelize(
  process.env.MYSQL_DB,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASS,
  {
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  }
);
const getAdminDb = (AdminDbName) => {
  const adminDb = new Sequelize(
    AdminDbName,
    process.env.MYSQL_USER,
    process.env.MYSQL_PASS,
    {
      host: process.env.MYSQL_HOST,
      dialect: "mysql",
    }
  );
  return adminDb;
};
module.exports = { superAdminDB, getAdminDb };
