# FallbackOCR — Offline Document Digitization Tool

FallbackOCR is an offline web-based OCR system designed to digitize old scanned documents using on-premise AI models.  
The system prioritizes reliability by validating OCR results using confidence thresholds and applying intelligent fallback strategies when extraction quality is low.


## Live Demo

The application is live and accessible at:

**Live URL:** https://fallbackocr.onrender.com/
---

## Features

- Offline OCR using Tesseract (no cloud APIs)
- Multi-image batch processing
- Confidence-based OCR validation
- Image preprocessing fallback (grayscale, resize, sharpen)
- Manual correction workflow for low-quality results
- Plain HTML + JavaScript frontend
- Linux-friendly Node.js backend structure

---

## Tech Stack

### Backend
- Node.js
- Express.js
- Tesseract.js
- Sharp (image preprocessing)
- Multer (file uploads)

### Frontend
- HTML
- Tailwind CSS
- Vanilla JavaScript

---

## System Flow

1. User uploads one or more scanned images
2. Images are stored temporarily on the server
3. Primary OCR is performed using Tesseract
4. OCR confidence is evaluated
5. If confidence is low:
   - Image is preprocessed
   - OCR is retried
6. If OCR still fails:
   - Best available output is selected
   - File is flagged for manual correction
7. Temporary files are cleaned up
8. Structured OCR results are returned to the client

---

## Fallback Decision Logic

- Confidence ≥ 80%  
  → Accept OCR result

- Confidence < 80%  
  → Apply image preprocessing and retry OCR

- Retry still below threshold  
  → Mark document for manual review

This ensures unreliable OCR output is never silently accepted.

---
## How to Run Locally

```bash
git clone https://github.com/Hariom0/fallbackOCR
cd fallbackOCR/backend
npm install
npm run dev