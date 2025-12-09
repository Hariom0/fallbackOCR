import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import ocr from "./routes/ocr.route.js"
const app = express();
dotenv.config()
app.use(cors())

app.use("/api/ocr",ocr)

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})