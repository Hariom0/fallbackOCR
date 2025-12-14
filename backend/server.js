import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import ocr from "./routes/ocr.route.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

app.use("/api/ocr", ocr);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

// ES Module dirname setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userFrontendDir = path.join(__dirname, "..", "frontend");

app.use(express.static(userFrontendDir))

