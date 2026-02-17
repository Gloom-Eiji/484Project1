// script.js
// Saves meet date and uploaded photos to localStorage (browser only).
// Builds a stacked "deck" preview and opens a modal to show all saved images.

(function () {
  const STORAGE_KEYS = {
    meetDate: "frs_meet_date_v1",
    notify: "frs_meet_notify_v1",
    uploads: "frs_gallery_uploads_v1"
  };

  // Starter images that ship with your site (includes former "bonus screenshots").
  // These are file paths, not stored in localStorage.
  const DEFAULT_MEDIA = [
    "media/IMG_0480.jpg",
    "media/IMG_1431.jpg",
    "media/IMG_4487.jpg",
    "media/IMG_8228.jpg",
    "media/IMG_8215.jpg",
    "media/IMG_7025.jpg",
    "media/IMG_7179.jpg",
    "media/IMG_8792.jpg",
    "media/IMG_5635.png",
    "media/IMG_7615.png",
    "media/IMG_8324.png"
  ];

  // Elements
  const meetForm = document.getElementById("meetForm");
  const meetDate = document.getElementById("meet-date");
  const notify = document.getElementById("notify");
  const photoUpload = document.getElementById("photo-upload");
  const clearUploadsBtn = document.getElementById("clearUploads");
  const statusMsg = document.getElementById("statusMsg");

  const deckButton = document.getElementById("deckButton");
  const deckThumb = document.getElementById("deckThumb");
  const photoCount = document.getElementById("photoCount");

  const galleryModal = document.getElementById("galleryModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalClose = document.getElementById("modalClose");
  const modalGrid = document.getElementById("modalGrid");

  const lightbox = document.getElementById("lightbox");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxImg = document.getElementById("lightboxImg");

  // Helpers
  function getUploads() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.uploads);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setUploads(list) {
    localStorage.setItem(STORAGE_KEYS.uploads, JSON.stringify(list));
  }

  function allPhotos() {
    // Uploaded photos are stored as { dataUrl, name, addedAt }
    const uploads = getUploads();
    const uploadUrls = uploads.map(x => x.dataUrl);
    return [...DEFAULT_MEDIA, ...uploadUrls];
  }

  function setStatus(text) {
    if (!statusMsg) return;
    statusMsg.textContent = text;
  }

  function openModal() {
    if (!galleryModal) return;
    galleryModal.classList.add("is-open");
    galleryModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!galleryModal) return;
    galleryModal.classList.remove("is-open");
    galleryModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    if (lightboxImg) lightboxImg.src = "";
  }

  function rebuildDeck() {
    const photos = allPhotos();
    photoCount.textContent = String(photos.length);

    // Preview image is the most recent upload, otherwise first default.
    const uploads = getUploads();
    const thumbSrc = uploads.length > 0 ? uploads[uploads.length - 1].dataUrl : (DEFAULT_MEDIA[0] || "");
    deckThumb.style.backgroundImage = thumbSrc ? `url('${thumbSrc}')` : "none";
  }

  function rebuildModalGrid() {
    const photos = allPhotos();
    modalGrid.innerHTML = "";

    photos.forEach((src, idx) => {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "modal-tile";
      tile.setAttribute("aria-label", `Open photo ${idx + 1}`);

      const img = document.createElement("img");
      img.src = src;
      img.alt = "Gallery photo";
      img.loading = "lazy";

      tile.appendChild(img);
      tile.addEventListener("click", () => openLightbox(src));
      modalGrid.appendChild(tile);
    });
  }

  function loadMeetData() {
    const savedDate = localStorage.getItem(STORAGE_KEYS.meetDate);
    const savedNotify = localStorage.getItem(STORAGE_KEYS.notify);

    if (savedDate && meetDate) meetDate.value = savedDate;
    if (savedNotify && notify) notify.checked = savedNotify === "true";
  }

  function saveMeetData() {
    if (meetDate) localStorage.setItem(STORAGE_KEYS.meetDate, meetDate.value || "");
    if (notify) localStorage.setItem(STORAGE_KEYS.notify, notify.checked ? "true" : "false");

    if (notify && notify.checked && meetDate && meetDate.value) {
      setStatus(`Saved. Reminder is enabled for ${meetDate.value}.`);
    } else {
      setStatus("Saved.");
    }
  }

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function handleUploads(files) {
    const list = Array.from(files || []).filter(f => f.type.startsWith("image/"));
    if (list.length === 0) {
      setStatus("No image files selected.");
      return;
    }

    // Keep uploads reasonable so localStorage does not explode.
    // This is not perfect, but it prevents accidental giant uploads.
    const MAX_FILES_PER_BATCH = 10;
    const batch = list.slice(0, MAX_FILES_PER_BATCH);

    const uploads = getUploads();
    let added = 0;

    for (const file of batch) {
      try {
        const dataUrl = await fileToDataUrl(file);
        uploads.push({
          dataUrl,
          name: file.name,
          addedAt: Date.now()
        });
        added += 1;
      } catch {
        // Skip bad files
      }
    }

    setUploads(uploads);
    rebuildDeck();
    setStatus(`Added ${added} photo(s) to your gallery.`);
  }

  function clearUploads() {
    setUploads([]);
    rebuildDeck();
    setStatus("Cleared uploaded photos. Default photos remain.");
    rebuildModalGrid();
  }

  // Events
  if (meetForm) {
    meetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveMeetData();
    });
  }

  if (photoUpload) {
    photoUpload.addEventListener("change", async (e) => {
      const input = e.currentTarget;
      await handleUploads(input.files);
      input.value = ""; // reset so you can re-upload same file if you want
    });
  }

  if (clearUploadsBtn) {
    clearUploadsBtn.addEventListener("click", clearUploads);
  }

  if (deckButton) {
    deckButton.addEventListener("click", () => {
      rebuildModalGrid();
      openModal();
    });
  }

  if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);

  if (lightboxBackdrop) lightboxBackdrop.addEventListener("click", closeLightbox);
  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeModal();
    }
  });

  // Init
  loadMeetData();
  rebuildDeck();
})();
