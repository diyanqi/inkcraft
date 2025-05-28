// lib/ocr.ts
import imageCompression from 'browser-image-compression';

export const runOcrProcess = async (
    file: File,
    onSuccess: (text: string) => void,
    onError: (message: string) => void
) => {
    try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const formData = new FormData();
        formData.append('file', compressedFile, compressedFile.name);

        const response = await fetch('/api/ocr', { method: 'POST', body: formData });
        const result = await response.json();

        if (result.success) {
            onSuccess(result.text);
        } else {
            onError(result.message || "文字识别失败。");
        }
    } catch (error) {
        console.error('OCR Error:', error);
        const message = error instanceof Error ? error.message : "处理图片或识别文字时发生错误。";
        onError(message);
    }
};

// Generic drag over handler
export const handleDragOverGeneric = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
};
