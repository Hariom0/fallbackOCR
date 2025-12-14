// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
	fileInput: document.getElementById("fileInput"),
	imageForm: document.getElementById("imageForm"),
	thumbnailList: document.getElementById("thumbnailList"),
	emptyThumbNote: document.getElementById("emptyThumbNote"),
	imagePreview: document.getElementById("imagePreview"),
	ocrText: document.getElementById("ocrText"),
	editToggleBtn: document.getElementById("editToggleBtn"),
	saveTextBtn: document.getElementById("saveTextBtn"),
	exportPdfBtn: document.getElementById("exportPdfBtn"),
	processAllBtn: document.getElementById("processAllBtn"),
	processBtnIcon: document.getElementById("processBtnIcon"),
	processBtnText: document.getElementById("processBtnText"),
	processBtnSpinner: document.getElementById("processBtnSpinner"),
	toastContainer: document.getElementById("toastContainer"),
	manualRequiredOverlay: document.getElementById("manualRequiredOverlay"),
	closeManualOverlay: document.getElementById("closeManualOverlay"),
	ocrMetadataCard: document.getElementById("ocrMetadataCard"),
	ocrStatus: document.getElementById("ocrStatus"),
	ocrMethod: document.getElementById("ocrMethod"),
	ocrConfidence: document.getElementById("ocrConfidence"),
	currentFileName: document.getElementById("currentFileName"),
	imageMetadata: document.getElementById("imageMetadata"),
	loadingOverlay: document.getElementById("loadingOverlay"),
	loadingTitle: document.getElementById("loadingTitle"),
	loadingMessage: document.getElementById("loadingMessage"),
	loadingProgress: document.getElementById("loadingProgress"),
	loadingProgressBar: document.getElementById("loadingProgressBar"),
	fileCount: document.getElementById("fileCount")
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
	uploadedImages: [],
	currentIndex: -1,
	ocrResults: {}, 
	isProcessing: false,
	isHandlingFileSelection: false
};

// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================
function showToast(message, type = "info", duration = 4000) {
	const toast = document.createElement("div");
	toast.className = `toast-enter bg-white rounded-2xl shadow-2xl border-l-4 p-5 flex items-start gap-4 min-w-[320px] pointer-events-auto ${
		type === "success" ? "border-green-500" :
		type === "error" ? "border-red-500" :
		type === "warning" ? "border-amber-500" :
		"border-blue-500"
	}`;

	const icons = {
		success: `<svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>`,
		error: `<svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>`,
		warning: `<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
		</svg>`,
		info: `<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
		</svg>`
	};

	toast.innerHTML = `
		<div class="flex-shrink-0">${icons[type] || icons.info}</div>
		<div class="flex-1 min-w-0">
			<p class="text-sm font-semibold text-slate-900 leading-relaxed">${message}</p>
		</div>
		<button class="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100" onclick="this.parentElement.remove()">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
			</svg>
		</button>
	`;

	elements.toastContainer.appendChild(toast);

	setTimeout(() => {
		toast.classList.remove("toast-enter");
		toast.classList.add("toast-exit");
		setTimeout(() => toast.remove(), 300);
	}, duration);
}

// ============================================
// LOADING OVERLAY MANAGEMENT
// ============================================
function showLoadingOverlay(totalFiles) {
	elements.loadingTitle.textContent = "Processing Documents";
	elements.loadingMessage.textContent = "Please wait while we extract text from your images...";
	elements.loadingProgress.textContent = `0 / ${totalFiles}`;
	elements.loadingProgressBar.style.width = "0%";
	elements.loadingOverlay.classList.remove("hidden");
	elements.loadingOverlay.classList.add("flex");
	document.body.style.overflow = "hidden";
}

function updateLoadingProgress(current, total) {
	elements.loadingProgress.textContent = `${current} / ${total}`;
	const percentage = Math.round((current / total) * 100);
	elements.loadingProgressBar.style.width = `${percentage}%`;
}

function hideLoadingOverlay() {
	elements.loadingOverlay.classList.add("hidden");
	elements.loadingOverlay.classList.remove("flex");
	document.body.style.overflow = "";
}

// ============================================
// FILE SELECTION HANDLER
// ============================================
elements.fileInput.addEventListener("change", (e) => {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
	
	if (state.isHandlingFileSelection) {
		console.log("File selection already in progress, ignoring duplicate event");
		return;
	}
	
	state.isHandlingFileSelection = true;
	
	try {
		state.uploadedImages = Array.from(e.target.files);
		elements.thumbnailList.innerHTML = "";
		state.ocrResults = {};
		state.currentIndex = -1;

		if (state.uploadedImages.length === 0) {
			elements.emptyThumbNote.classList.remove("hidden");
			elements.fileCount.classList.add("hidden");
			resetWorkspace();
			return;
		}

		elements.emptyThumbNote.classList.add("hidden");
		elements.fileCount.textContent = `${state.uploadedImages.length} file${state.uploadedImages.length > 1 ? 's' : ''}`;
		elements.fileCount.classList.remove("hidden");

		state.uploadedImages.forEach((file, index) => {
			const url = URL.createObjectURL(file);
			const div = document.createElement("div");
			div.className = `cursor-pointer bg-white rounded-xl border-2 border-transparent p-3 hover:border-blue-400 hover:shadow-lg transition-all duration-300 group fade-in`;
			div.dataset.index = index;
			div.style.animationDelay = `${index * 0.05}s`;

			div.innerHTML = `
				<div class="relative mb-3">
					<img src="${url}" class="h-32 w-full object-cover rounded-lg group-hover:opacity-90 transition-opacity" />
					<div id="statusBadge-${index}" class="absolute top-2 right-2 hidden"></div>
					<div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors"></div>
				</div>
				<p class="text-xs font-semibold text-slate-700 truncate mb-2">${file.name}</p>
				<div id="thumbnailMeta-${index}" class="hidden space-y-2">
					<div class="flex items-center justify-between text-xs">
						<span id="thumbConfidence-${index}" class="px-2 py-1 rounded-full font-bold"></span>
						<span id="thumbMethod-${index}" class="px-2 py-1 rounded-lg text-slate-600 bg-slate-100 font-medium"></span>
					</div>
				</div>
			`;

			div.addEventListener("click", () => selectImage(index));
			elements.thumbnailList.appendChild(div);
		});

		resetWorkspace();
		showToast(`${state.uploadedImages.length} file(s) uploaded successfully`, "success");
	} finally {
		state.isHandlingFileSelection = false;
	}
});

// ============================================
// IMAGE SELECTION
// ============================================
function selectImage(index) {
	state.currentIndex = index;
	const file = state.uploadedImages[index];

	// Update thumbnail active states
	document.querySelectorAll("#thumbnailList > div").forEach((div, i) => {
		if (i === index) {
			div.classList.add("border-blue-500", "bg-blue-50/50", "shadow-md");
			div.classList.remove("border-transparent", "bg-white");
		} else {
			div.classList.remove("border-blue-500", "bg-blue-50/50", "shadow-md");
			div.classList.add("border-transparent", "bg-white");
		}
	});

	elements.imagePreview.src = URL.createObjectURL(file);
	elements.currentFileName.textContent = file.name;
	elements.imageMetadata.classList.remove("hidden");

	const result = state.ocrResults[file.name];
	if (result) {
		elements.ocrText.value = result.text || "No text extracted.";
		updateMetadataDisplay(result);
		elements.ocrMetadataCard.classList.remove("hidden");
	} else {
		elements.ocrText.value = "OCR not processed yet. Click 'Process OCR'.";
		elements.ocrMetadataCard.classList.add("hidden");
	}

	lockEditor();
}

// ============================================
// THUMBNAIL METADATA UPDATE
// ============================================
function updateThumbnailMetadata(result) {
	const thumbIndex = state.uploadedImages.findIndex(f => f.name === result.fileName);
	if (thumbIndex === -1) return;

	const thumbMeta = document.getElementById(`thumbnailMeta-${thumbIndex}`);
	const thumbConfidence = document.getElementById(`thumbConfidence-${thumbIndex}`);
	const thumbMethod = document.getElementById(`thumbMethod-${thumbIndex}`);
	const statusBadgeEl = document.getElementById(`statusBadge-${thumbIndex}`);

	if (!thumbMeta || !thumbConfidence || !thumbMethod || !statusBadgeEl) return;

	const confidenceValue = result.confidence ? Math.round(result.confidence) : 0;
	const confidenceClass = confidenceValue >= 90 ? "text-green-700 bg-green-100" : 
		confidenceValue >= 70 ? "text-amber-700 bg-amber-100" : "text-red-700 bg-red-100";
	
	const methodLabels = {
		"tesseract-primary": "Primary",
		"tesseract-preprocessed": "Preprocessed",
		"ocr_failed": "Failed"
	};

	thumbMeta.classList.remove("hidden");
	thumbConfidence.className = `px-2 py-1 rounded-full font-bold ${confidenceClass}`;
	thumbConfidence.textContent = `${confidenceValue}%`;
	thumbMethod.textContent = methodLabels[result.method] || result.method;
	
	statusBadgeEl.className = result.status === "success" 
		? "absolute top-2 right-2 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg"
		: "absolute top-2 right-2 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg";
	statusBadgeEl.innerHTML = result.status === "success" 
		? `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`
		: `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
	statusBadgeEl.classList.remove("hidden");
}

// ============================================
// METADATA DISPLAY UPDATE
// ============================================
function updateMetadataDisplay(result) {
	const statusBadge = result.status === "success" 
		? `<span class="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ Success</span>`
		: `<span class="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">⚠ Manual Required</span>`;
	elements.ocrStatus.innerHTML = statusBadge;

	const methodLabels = {
		"tesseract-primary": "Primary OCR",
		"tesseract-preprocessed": "Preprocessed OCR",
		"ocr_failed": "OCR Failed"
	};
	elements.ocrMethod.textContent = methodLabels[result.method] || result.method;

	const confidenceValue = result.confidence ? Math.round(result.confidence) : 0;
	const confidenceColor = confidenceValue >= 90 ? "text-green-600" : 
		confidenceValue >= 70 ? "text-amber-600" : "text-red-600";
	elements.ocrConfidence.innerHTML = `<span class="${confidenceColor} font-bold text-lg">${confidenceValue}%</span>`;

	updateThumbnailMetadata(result);
}

// ============================================
// OCR PROCESSING
// ============================================
elements.processAllBtn.addEventListener("click", async () => {
	if (state.isProcessing) {
		showToast("Processing already in progress. Please wait...", "warning");
		return;
	}

	if (state.uploadedImages.length === 0) {
		showToast("Please upload images first", "warning");
		return;
	}

	state.isProcessing = true;

	elements.processAllBtn.disabled = true;
	elements.processBtnIcon.classList.add("hidden");
	elements.processBtnSpinner.classList.remove("hidden");
	elements.processBtnText.textContent = "Processing...";
	
	showLoadingOverlay(state.uploadedImages.length);

	const formData = new FormData(elements.imageForm);

	try {
		elements.loadingMessage.textContent = `Processing ${state.uploadedImages.length} file(s)... This may take a moment.`;

		// console.log
		const res = await fetch("/api/ocr", {
			method: "POST",
			body: formData,
		});

		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}

		const data = await res.json();
		console.log(data)
		if (!data.extractedData || data.extractedData.length === 0) {
			throw new Error("No data received from server");
		}

		elements.loadingTitle.textContent = "Processing Results";
		elements.loadingMessage.textContent = "Analyzing OCR results and updating interface...";
		
		let successCount = 0;
		let manualRequiredCount = 0;
		let hasManualRequired = false;

		for (let index = 0; index < data.extractedData.length; index++) {
			const item = data.extractedData[index];
			updateLoadingProgress(index + 1, data.extractedData.length);
			
			if (index < data.extractedData.length - 1) {
				await new Promise(resolve => setTimeout(resolve, 100));
			}

			state.ocrResults[item.fileName] = {
				text: item.output || "",
				confidence: item.confidence || 0,
				status: item.status || "unknown",
				method: item.method || "unknown",
				fileName: item.fileName
			};

			updateThumbnailMetadata(state.ocrResults[item.fileName]);

			if (item.status === "success") {
				successCount++;
				const methodMsg = item.method === "tesseract-preprocessed" ? " (with preprocessing)" : "";
				showToast(
					`${item.fileName}: OCR successful${methodMsg} - Confidence: ${Math.round(item.confidence)}%`,
					"success",
					5000
				);
			} else if (item.status === "manual_required") {
				manualRequiredCount++;
				hasManualRequired = true;
				showToast(
					`${item.fileName}: Manual review required - Low confidence: ${Math.round(item.confidence)}%`,
					"warning",
					6000
				);
			}
		}

		hideLoadingOverlay();

		if (successCount > 0 && manualRequiredCount === 0) {
			showToast(`All ${successCount} page(s) processed successfully!`, "success", 4000);
		} else if (manualRequiredCount > 0) {
			showToast(
				`Processing complete: ${successCount} successful, ${manualRequiredCount} require manual review`,
				"warning",
				6000
			);
		}

		if (hasManualRequired) {
			setTimeout(() => {
				elements.manualRequiredOverlay.classList.remove("hidden");
				elements.manualRequiredOverlay.classList.add("flex");
				const manualFiles = data.extractedData
					.filter(item => item.status === "manual_required")
					.map(item => item.fileName)
					.join(", ");
				document.getElementById("manualRequiredMessage").textContent = 
					`The following file(s) have low OCR confidence and require manual review: ${manualFiles}. Please review and correct the extracted text using the Edit button.`;
			}, 500);
		}

		if (state.uploadedImages.length > 0) {
			selectImage(0);
		}

	} catch (err) {
		console.error("OCR failed:", err);
		hideLoadingOverlay();
		showToast(`OCR processing failed: ${err.message}`, "error", 6000);
	} finally {
		state.isProcessing = false;
		elements.processAllBtn.disabled = false;
		elements.processBtnIcon.classList.remove("hidden");
		elements.processBtnSpinner.classList.add("hidden");
		elements.processBtnText.textContent = "Process OCR for All Files";
	}
});

// ============================================
// MANUAL REQUIRED OVERLAY
// ============================================
elements.closeManualOverlay.addEventListener("click", () => {
	elements.manualRequiredOverlay.classList.add("hidden");
	elements.manualRequiredOverlay.classList.remove("flex");
});

// ============================================
// EDIT FUNCTIONALITY
// ============================================
elements.editToggleBtn.addEventListener("click", () => {
	if (state.currentIndex === -1) {
		showToast("Please select an image first", "warning");
		return;
	}

	const isReadOnly = elements.ocrText.hasAttribute("readonly");

	if (isReadOnly) {
		elements.ocrText.removeAttribute("readonly");
		elements.ocrText.classList.remove("bg-white");
		elements.ocrText.classList.add("bg-yellow-50", "ring-2", "ring-amber-500");
		elements.saveTextBtn.classList.remove("hidden");
		elements.editToggleBtn.innerHTML = `
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
			</svg>
			Cancel
		`;
		elements.editToggleBtn.classList.remove("from-amber-500", "to-orange-500");
		elements.editToggleBtn.classList.add("from-slate-500", "to-slate-600");
		elements.ocrText.focus();
	} else {
		lockEditor();
	}
});

elements.saveTextBtn.addEventListener("click", () => {
	const file = state.uploadedImages[state.currentIndex];
	if (state.ocrResults[file.name]) {
		state.ocrResults[file.name].text = elements.ocrText.value;
		showToast("Text saved successfully", "success");
	} else {
		state.ocrResults[file.name] = {
			text: elements.ocrText.value,
			confidence: 0,
			status: "manual",
			method: "manual_edit",
			fileName: file.name
		};
		showToast("Text saved successfully", "success");
	}
	lockEditor();
});

function lockEditor() {
	elements.ocrText.setAttribute("readonly", true);
	elements.ocrText.classList.add("bg-white");
	elements.ocrText.classList.remove("bg-yellow-50", "ring-2", "ring-amber-500");
	elements.saveTextBtn.classList.add("hidden");
	elements.editToggleBtn.innerHTML = `
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
		</svg>
		Edit
	`;
	elements.editToggleBtn.classList.add("from-amber-500", "to-orange-500");
	elements.editToggleBtn.classList.remove("from-slate-500", "to-slate-600");
}

// ============================================
// PDF EXPORT
// ============================================
elements.exportPdfBtn.addEventListener("click", () => {
	if (state.currentIndex === -1) {
		showToast("Please select an image first", "warning");
		return;
	}

	const file = state.uploadedImages[state.currentIndex];
	const result = state.ocrResults[file.name];
	const text = result ? result.text : "";

	if (!text || text.trim() === "" || text === "OCR not processed yet. Click 'Process OCR'.") {
		showToast("No recognized text available for this page. Please process OCR first.", "warning");
		return;
	}

	try {
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF();

		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;
		const maxWidth = pageWidth - 2 * margin;
		const lineHeight = 7;

		const lines = doc.splitTextToSize(text, maxWidth);

		let y = margin;
		let pageNum = 1;

		doc.setFontSize(16);
		doc.setFont(undefined, "bold");
		doc.text(`Page ${pageNum}: ${file.name}`, margin, y);
		y += lineHeight * 2;

		if (result && result.confidence) {
			doc.setFontSize(10);
			doc.setFont(undefined, "normal");
			doc.setTextColor(100, 100, 100);
			doc.text(`Confidence: ${Math.round(result.confidence)}% | Method: ${result.method} | Status: ${result.status}`, margin, y);
			y += lineHeight * 1.5;
			doc.setTextColor(0, 0, 0);
		}

		doc.setLineWidth(0.5);
		doc.line(margin, y, pageWidth - margin, y);
		y += lineHeight * 1.5;

		doc.setFontSize(11);
		doc.setFont(undefined, "normal");

		lines.forEach((line) => {
			if (y + lineHeight > pageHeight - margin) {
				doc.addPage();
				pageNum++;
				y = margin;
				doc.setFontSize(16);
				doc.setFont(undefined, "bold");
				doc.text(`Page ${pageNum}: ${file.name} (continued)`, margin, y);
				y += lineHeight * 2;
				doc.setLineWidth(0.5);
				doc.line(margin, y, pageWidth - margin, y);
				y += lineHeight * 1.5;
				doc.setFontSize(11);
				doc.setFont(undefined, "normal");
			}
			doc.text(line, margin, y);
			y += lineHeight;
		});

		const fileName = file.name.replace(/\.[^/.]+$/, "") + "_OCR.pdf";
		doc.save(fileName);
		showToast(`PDF exported: ${fileName}`, "success");
	} catch (err) {
		console.error("PDF export failed:", err);
		showToast("PDF export failed. Please try again.", "error");
	}
});

// ============================================
// FORM SUBMISSION PREVENTION
// ============================================
elements.imageForm.addEventListener("submit", (e) => {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
	return false;
});

elements.fileInput.addEventListener("click", (e) => e.stopPropagation());
elements.fileInput.addEventListener("focus", (e) => e.stopPropagation());
elements.fileInput.addEventListener("blur", (e) => e.stopPropagation());

// ============================================
// UTILITY FUNCTIONS
// ============================================
function resetWorkspace() {
	elements.imagePreview.src = "";
	elements.ocrText.value = "Select an image to begin OCR.";
	lockEditor();
	state.currentIndex = -1;
	elements.ocrMetadataCard.classList.add("hidden");
	elements.imageMetadata.classList.add("hidden");
}