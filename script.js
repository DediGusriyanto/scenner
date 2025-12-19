const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const preview = document.getElementById("preview");

let photos = [];
let stream = null;
let facingMode = "environment"; // belakang

// Kamera
async function startCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode },
  });
  video.srcObject = stream;
}

// Ganti kamera
function switchCamera() {
  facingMode = facingMode === "environment" ? "user" : "environment";
  startCamera();
}

// Ambil foto + auto crop + hitam putih
function takePhoto() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  imgData = grayscale(imgData);
  ctx.putImageData(imgData, 0, 0);

  const dataUrl = canvas.toDataURL("image/jpeg", 1.0);
  photos.push(dataUrl);
  renderPreview();
}

// Efek hitam putih
function grayscale(imgData) {
  for (let i = 0; i < imgData.data.length; i += 4) {
    const avg =
      (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = avg;
  }
  return imgData;
}

// Render preview + hapus + urutkan
function renderPreview() {
  preview.innerHTML = "";
  photos.forEach((src, index) => {
    const card = document.createElement("div");
    card.className = "card";

    const img = document.createElement("img");
    img.src = src;

    const del = document.createElement("button");
    del.innerText = "✖";
    del.onclick = () => {
      photos.splice(index, 1);
      renderPreview();
    };

    card.appendChild(img);
    card.appendChild(del);
    preview.appendChild(card);
  });
}

// Buat & download PDF
async function downloadPDF() {
  if (photos.length === 0) {
    alert("Belum ada halaman");
    return;
  }

  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.create();

  for (let photo of photos) {
    const bytes = await fetch(photo).then((r) => r.arrayBuffer());
    const img = await pdf.embedJpg(bytes);

    const page = pdf.addPage([img.width, img.height]);
    page.drawImage(img, {
      x: 0,
      y: 0,
      width: img.width,
      height: img.height,
    });
  }

  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "scan.pdf";
  a.click();
}

// Start
startCamera();
