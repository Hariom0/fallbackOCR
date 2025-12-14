import { createWorker } from "tesseract.js";

export async function tesseractOcr(filePath, lang) {
	const worker = await createWorker(lang);
	const ret = await worker.recognize(filePath);
	await worker.terminate();
	return ret.data;
}


