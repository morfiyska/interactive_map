let selectedFile = null;

export function initImportUI() {
    const btn = document.getElementById('importBtn');
    const modal = document.getElementById('importModal');
    const closeBtn = document.getElementById('closeImport');
    const cancelBtn = document.getElementById('cancelImport');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const uploadBtn = document.getElementById('uploadBtn');

    // 📂 загрузка иконки
    fetch('/icons')
        .then(r => r.json())
        .then(icons => {
            if (icons.length) {
                document.getElementById('importIcon').src = `/icons/map.svg`;
            }
        });

    // открыть
    btn.onclick = () => modal.classList.remove('hidden');

    // закрыть
    function resetAndClose() {
        modal.classList.add('hidden');
        selectedFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        uploadBtn.disabled = true;
    }

    closeBtn.onclick = resetAndClose;
    cancelBtn.onclick = resetAndClose;

    // клик вне
    modal.onclick = (e) => {
        if (e.target === modal) resetAndClose();
    };

    // клик по зоне
    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = () => {
        handleFile(fileInput.files[0]);
    };

    // drag & drop
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };

    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };

    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    function handleFile(file) {
        if (!file || !file.name.endsWith('.zip')) {
            alert('Только ZIP');
            return;
        }

        selectedFile = file;

        fileInfo.textContent = `Файл: ${file.name}`;
        fileInfo.classList.remove('hidden');

        uploadBtn.disabled = false;
    }

    // 🚀 отправка
    uploadBtn.onclick = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        await fetch('/import_data', {
            method: 'POST',
            body: formData
        });

        location.reload();
    };
}