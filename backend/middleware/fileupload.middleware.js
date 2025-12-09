import multer from "multer";
import path from "path";
import fs from "fs";


const TMP_DIR = "tmp";
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR);
const imageTypes = /jpeg|jpg|png/;

const imageStorage = multer.diskStorage({
	destination: (req, file, cb) => cb(null, TMP_DIR),
	filename:  (req, file, cb) => {
		const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
		let name = file.fieldname + "-" + uniqueName;
		cb(null, name);
	},
});

const imageFilter = (req, file, cb) => {
	const isValid =
		imageTypes.test(file.mimetype.toLowerCase()) && imageTypes.test(path.extname(file.originalname).toLowerCase());
	cb(isValid ? null : new Error("Only image files are allowed : (jpeg|jpg|png) "), isValid);
};

const imageUploader = multer({storage: imageStorage, fileFilter: imageFilter,});

export default imageUploader;