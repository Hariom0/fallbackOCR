import express from "express";
import { handleOcr } from "../controllers/handleOcr.controller.js";
import imageUploader from "../middleware/fileupload.middleware.js";

const router = express.Router()

router.post("/",imageUploader.array("images") ,handleOcr)

export default router