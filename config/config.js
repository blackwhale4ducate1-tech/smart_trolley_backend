const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
const environment = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, `../.env.${environment}`);
dotenv.config({ path: envPath });
console.log("process.env: " + process.env.NODE_ENV);

module.exports = {
  development: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_DB,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  },
  test: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_TEST_DB,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  },
  production: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASS,
    database: process.env.MYSQL_PROD_DB,
    host: process.env.MYSQL_HOST,
    dialect: "mysql",
  },
};