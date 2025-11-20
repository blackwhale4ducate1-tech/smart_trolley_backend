const express = require("express");
const { superAdminDB } = require("./config/database.js");
const { syncDatabase } = require("./models");
// Import all route modules
const authRoutes = require("./routes/authRoutes.js");
const productRoutes = require("./routes/productRoutes.js");
const invoiceRoutes = require("./routes/invoiceRoutes.js");
const adminRoutes = require("./routes/adminRoutes.js");
const apiRoutes = require("./routes/routes.js");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const bodyParser = require("body-parser");

// process.env.NODE_ENV = "local";
const environment = process.env.NODE_ENV || "development";
const envPath = path.resolve(__dirname, `.env.${environment}`);

dotenv.config({ path: envPath });

const NODE_BASE_URL = process.env.NODE_BASE_URL || "http://localhost:3000";
const PORT = process.env.PORT;

console.log("process.env.NODE_BASE_URL:" + process.env.NODE_BASE_URL);
console.log("process.env.PORT: " + process.env.PORT);

const app = express();
(async () => {
  try {
    await superAdminDB.authenticate();
    console.log("Database connected...");
    
    // Sync database models
    await syncDatabase();
    console.log("Database models synchronized...");
  } catch (error) {
    console.error("Connection error:", error);
  }
})();

app.use(
  cors({
    origin: `${NODE_BASE_URL}`,
    credentials: true,
  })
);
// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//   })
// );

// Add body-parser middleware here
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(express.json());


app.use(express.static(path.join(__dirname, "/public")));

// Mount individual routes directly
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/admin", adminRoutes);

// Mount main routes (includes health check and 404 handler)
app.use("/api", apiRoutes);

// Serve the frontend app for any other requests

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
