import sharp from "sharp";
import fs from "fs/promises";
import { tesseractOcr } from "../utils/ocr.js";

function isOcrFailed({ confidence = 0 }) {
	return confidence < 80;
}

async function preprocessImage(inputPath, outputPath) {
	await sharp(inputPath)
		.grayscale()
		.resize({
			width: 2000,
			withoutEnlargement: true,
		})
		.sharpen()
		.normalize()
		.toFile(outputPath);
}


async function safeUnlink(path) {
	if (!path) return;
	try {
		await fs.unlink(path);
	} catch (_) {
	}
}

async function extractData(fileNames, lang) {
	const results = [];

	for (const fileName of fileNames) {
		const originalPath = `tmp/${fileName}`;
		const processedPath = `tmp/processed_${fileName}`;

		let method = "tesseract-primary";
		let result;

		try {
			// First attempt
			result = await tesseractOcr(originalPath, lang);

			// Fallback attempt
			if (isOcrFailed(result)) {
				await preprocessImage(originalPath, processedPath);
				const retry = await tesseractOcr(processedPath, lang);

				if (!isOcrFailed(retry)) {
					result = retry;
					method = "tesseract-preprocessed";
				} else {
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

			results.push({
				fileName,
				output: result.text,
				confidence: result.confidence,
				status: "success",
				method,
			});
		} catch (err) {
			results.push({
				fileName,
				output: "",
				confidence: 0,
				status: "error",
				method: "exception",
				error: err.message,
			});
		} finally {
			await safeUnlink(originalPath);
			await safeUnlink(processedPath);
		}
	}

	return results;
}

export async function handleOcr(req, res) {
	const lang = (req.body?.lang || "eng").toLowerCase();
	const fileNames = req.files?.map((file) => file.filename) || [];

	if (!fileNames.length) {
		return res.status(400).json({ error: "No files uploaded" });
	}

	try {
		const extractedData = await extractData(fileNames, lang);
		return res.json({ extractedData });
	} catch (err) {
		return res.status(500).json({
			error: "OCR processing failed",
			details: err.message,
		});
	}
}
