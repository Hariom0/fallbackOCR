# 📄 Architecture Document

## Offline OCR System with Confidence-Based Fallback

---

## 1. System Overview

This project is an **offline, web-based OCR system** designed to digitize old scanned documents, including printed and handwritten records, with support for non-English languages. The system is
intentionally built without reliance on cloud-based AI services to ensure data privacy, low latency, and deployability in restricted or on-premise environments.

The architecture emphasizes **reliability over blind automation** by validating OCR output quality and applying structured fallback strategies when extraction confidence is low.

The application consists of:

- A Node.js backend for OCR orchestration and decision-making
- A lightweight HTML/JavaScript frontend for document upload and review
- On-premise OCR engines and image preprocessing tools

---

## 2. Core Components

### Frontend

- Plain HTML, Tailwind CSS, and vanilla JavaScript
- Supports multi-file image uploads
- Displays page previews alongside extracted text
- Enables manual text correction when OCR confidence is low
- Designed for fast navigation across multiple scanned pages

### Backend

- Node.js with Express
- Handles file uploads, OCR execution, confidence evaluation, and fallback logic
- Manages temporary file storage and cleanup
- Returns structured OCR results with metadata for frontend rendering

### OCR & Image Processing

- **Primary OCR Engine:** Tesseract OCR (offline)
- **Image Preprocessing:** Sharp
  - Grayscale conversion
  - Resizing for improved resolution
  - Sharpening to enhance text edges
- OCR confidence is used as the primary signal for decision-making

---

## 3. File Processing Pipeline

Each uploaded image follows a deterministic, multi-stage processing pipeline:

1. Uploaded images are stored temporarily on the server.
2. Primary OCR is executed using Tesseract with the selected language.
3. OCR confidence is evaluated against a predefined threshold.
4. Low-confidence results trigger an image preprocessing step.
5. OCR is retried on the preprocessed image.
6. If both attempts fail, the best available result is retained and flagged.
7. Temporary files (original and processed) are deleted after processing.
8. Results are returned to the client as structured JSON.

This pipeline enables **batch processing of multiple pages** while maintaining output quality and predictable system behavior.

---

## 4. Fallback Strategy

OCR output quality can vary significantly depending on scan quality. To address this, the system implements a **confidence-based fallback mechanism**:

### Fallback Levels

- **Primary Attempt:**  
  Direct OCR using Tesseract.

- **Fallback Attempt:**  
  OCR retry after image preprocessing (grayscale, resize, sharpen).

- **Final Escalation:**  
  If confidence remains low, the document is marked for manual correction instead of returning unreliable output.

This ensures the system never silently accepts poor OCR results and supports a **human-in-the-loop** workflow.

---

---

## 6. Scalability Considerations

The system is designed to scale to thousands of documents with minimal changes:

- OCR tasks can be executed sequentially or moved to background worker queues
- Temporary file cleanup prevents disk space exhaustion
- OCR processing can be parallelized using worker threads or job queues
- Additional OCR engines (EasyOCR or PaddleOCR) can be integrated as secondary fallbacks without refactoring the pipeline
- The frontend remains stateless and can be served independently

---

## 7. Design Principles

- **Offline-first:** No dependency on external or cloud AI services
- **Fail-safe:** Poor OCR output is never silently accepted
- **Extensible:** OCR engines and preprocessing steps can be added incrementally
- **Transparent:** Confidence scores and processing methods are always exposed
- **Human-aware:** Manual correction is treated as a valid system outcome

---

## 8. Conclusion

This architecture delivers a robust and ethical OCR solution for digitizing legacy documents. By combining confidence-based validation, intelligent fallback strategies, and manual correction support,
the system balances automation with accuracy and accountability. The design is practical, scalable, and suitable for real-world deployment in constrained or privacy-sensitive environments.
