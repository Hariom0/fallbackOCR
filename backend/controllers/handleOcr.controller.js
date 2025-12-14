import sharp from "sharp";
import { tesseractOcr } from "../utils/ocr.js";
import fs from "fs";

function isOcrFailed({ text = "", confidence = 0 }) {
	const isLowConfidence = confidence < 80;
	return isLowConfidence;
}

async function preprocessImage(inputPath, outputPath) {
	await sharp(inputPath).grayscale().resize(2000).sharpen().toFile(outputPath);
}

async function extractData(fileNames, lang) {
	const results = [];

	for (const fileName of fileNames) {
		const originalPath = `tmp/${fileName}`;
		let processedPath;
		let method = "tesseract-primary";

		// First attempt
		let result = await tesseractOcr(originalPath, lang);

		// 1st Fallback preprocessing & retry
		if (isOcrFailed(result)) {
			processedPath = `tmp/processed_${fileName}`;
			await preprocessImage(originalPath, processedPath);

			const retry = await tesseractOcr(processedPath, lang);

			// Clean file
			if (originalPath) {
				fs.unlink(originalPath, (err) => {
					if (err) console.log(err);
				});
			}
			if (processedPath) {
				fs.unlink(processedPath, (err) => {
					if (err) console.log(err);
				});
			}

			// If retry success
			if (!isOcrFailed(retry)) {
				result = retry;
				method = "tesseract-preprocessed";
			} else {
				// Both attempts failed pick higher confidence
				const best = retry.confidence > result.confidence ? retry : result;

				results.push({
					fileName,
					output: best.text,
					confidence: best.confidence,
					status: "manual_required",
					method: "ocr_failed",
				});
				continue;
			}
		}

		// Clean file
		if (fs.access(originalPath , (err)=>{
			if(err) return console.log(err)
			fs.unlink(originalPath, (err) => {
				if (err) console.log(err);
			});
		})
		// OCR
		results.push({
			fileName,
			output: result.text,
			confidence: result.confidence,
			status: "success",
			method,
		});
	}

	return results;
}

export async function handleOcr(req, res) {
	console.log(req.body);
	const lang = (req.body.lang || "eng").toLowerCase();
	const fileNames = req.files?.map((file) => file.filename) || [];

	if (!fileNames.length) {
		return res.status(400).json({ error: "No files uploaded" });
	}

	const extractedData = await extractData(fileNames, lang);
	res.json({ extractedData });
}
