let selectedFiles = [];

export function initIconsUpload() {
    const btn = document.getElementById('uploadIconsBtn');
    const modal = document.getElementById('iconsModal');

    const closeBtn = document.getElementById('closeIcons');
    const cancelBtn = document.getElementById('cancelIcons');

    const dropZone = document.getElementById('iconsDropZone');
    const input = document.getElementById('iconsInput');
    const list = document.getElementById('iconsList');
    const confirmBtn = document.getElementById('uploadIconsConfirm');

    // иконка кнопки
    fetch('/icons')
        .then(r => r.json())
        .then(icons => {
            if (icons.length) {
                document.getElementById('iconsIcon').src = `/icons/ico.svg`;
            }
        });

    // открыть
    btn.onclick = () => modal.classList.remove('hidden');

    function reset() {
        selectedFiles = [];
        input.value = '';
        list.innerHTML = '';
        confirmBtn.disabled = true;
        modal.classList.add('hidden');
    }

    closeBtn.onclick = reset;
    cancelBtn.onclick = reset;

    modal.onclick = (e) => {
        if (e.target === modal) reset();
    };

    // выбор файла
    dropZone.onclick = () => input.click();

    input.onchange = () => handleFiles(input.files);

    // drag
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
        handleFiles(e.dataTransfer.files);
    };

    function handleFiles(files) {
        selectedFiles = [...files].filter(f => f.name.endsWith('.svg'));

        list.innerHTML = selectedFiles.map(f => `<div>${f.name}</div>`).join('');

        confirmBtn.disabled = selectedFiles.length === 0;
    }

    // 🚀 upload
    confirmBtn.onclick = async () => {
        const formData = new FormData();

        selectedFiles.forEach(f => formData.append('files', f));

        await fetch('/upload_icons', {
            method: 'POST',
            body: formData
        });

        reset();

        // обновить список иконок в UI
        document.dispatchEvent(new Event('iconsUpdated'));
    };
}