const fileInput = document.getElementById("fileInput");
const thumbnailList = document.getElementById("thumbnailList");
const emptyThumbNote = document.getElementById("emptyThumbNote");
const imagePreview = document.getElementById("imagePreview");
const ocrText = document.getElementById("ocrText");
const editToggleBtn = document.getElementById("editToggleBtn");
const saveTextBtn = document.getElementById("saveTextBtn");

let uploadedImages = [];
let currentIndex = -1;

// Load thumbnails when files are selected
fileInput.addEventListener("change", (e) => {
	uploadedImages = Array.from(e.target.files);
	thumbnailList.innerHTML = ""; // Clear old

	uploadedImages.forEach((file, index) => {
		const url = URL.createObjectURL(file);

		const div = document.createElement("div");
		div.className = "cursor-pointer border rounded-lg p-2 bg-white hover:bg-gray-100";
		div.dataset.index = index;

		div.innerHTML = `
          <img src="${url}" class="h-20 w-full object-cover rounded" />
          <p class="text-sm mt-1">Page ${index + 1}</p>
        `;

		div.addEventListener("click", () => selectImage(index));

		thumbnailList.appendChild(div);
	});

	emptyThumbNote.classList.add("hidden");
});

// Select image for preview
function selectImage(index) {
	currentIndex = index;
	const file = uploadedImages[index];
	const url = URL.createObjectURL(file);
	imagePreview.src = url;

	// Reset text area for demo (will be replaced by backend OCR result)
	ocrText.value = `Dummy OCR result for Page ${index + 1}.\nReal text will appear here after backend processing.`;

	// Lock editing initially
	ocrText.setAttribute("readonly", true);
	ocrText.classList.add("bg-gray-100");
	ocrText.classList.remove("bg-white");
	saveTextBtn.classList.add("hidden");
	editToggleBtn.textContent = "Edit";
}

// Toggle editable mode
editToggleBtn.addEventListener("click", () => {
	if (currentIndex === -1) return alert("Select an image first!");

	const isReadOnly = ocrText.hasAttribute("readonly");

	if (isReadOnly) {
		ocrText.removeAttribute("readonly");
		ocrText.classList.replace("bg-gray-100", "bg-white");
		saveTextBtn.classList.remove("hidden");
		editToggleBtn.textContent = "Cancel Edit";
	} else {
		ocrText.setAttribute("readonly", true);
		ocrText.classList.replace("bg-white", "bg-gray-100");
		saveTextBtn.classList.add("hidden");
		editToggleBtn.textContent = "Edit";
	}
});

function handleSubmit(e) {
	const imageForm = document.getElementById("imageForm");

	const formData = new FormData(imageForm);

	const files = formData.getAll("images");
	console.log("Uploaded files:", files); // Should show File[] list

	// send to backend
	fetch("http://localhost:6969/api/ocr", {
		method: "POST",
		body: formData,
	})
		.then((res) => res.json())
		.then((data) => console.log("OCR result:", data))
		.catch((err) => console.error(err));
}
