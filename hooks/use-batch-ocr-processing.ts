// hooks/use-batch-ocr-processing.ts
import { useState, useEffect, useCallback, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';
import { BatchEssayItem, OcrQueueItem } from "@/types/create"; // Import types
import { runOcrProcess } from "@/lib/ocr"; // Import OCR utility
import { toast } from "sonner";

const MAX_CONCURRENT_OCR = 2; // Define concurrency limit

export function useBatchOcrProcessing() {
    const [batchEssays, setBatchEssays] = useState<BatchEssayItem[]>([]);
    const [ocrProcessingQueue, setOcrProcessingQueue] = useState<OcrQueueItem[]>([]);
    const [activeOcrCount, setActiveOcrCount] = useState(0);

    const batchEssaysRef = useRef<BatchEssayItem[]>(batchEssays); // For unmount cleanup

    useEffect(() => {
        batchEssaysRef.current = batchEssays;
    }, [batchEssays]);

    // Unmount cleanup for batch essay previews
    useEffect(() => {
        return () => {
            batchEssaysRef.current.forEach(item => {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            });
        };
    }, []); // Empty dependency array for unmount only

    // Batch OCR Processing Effect
    useEffect(() => {
        const canProcessCount = MAX_CONCURRENT_OCR - activeOcrCount;
        if (canProcessCount > 0 && ocrProcessingQueue.length > 0) {
            const itemsToProcessNow = ocrProcessingQueue.slice(0, canProcessCount);
            const remainingQueue = ocrProcessingQueue.slice(canProcessCount);

            setOcrProcessingQueue(remainingQueue); // Update queue state first
            setActiveOcrCount(prev => prev + itemsToProcessNow.length);

            itemsToProcessNow.forEach(item => {
                setBatchEssays(prevEssays =>
                    prevEssays.map(be =>
                        be.id === item.batchItemId ? { ...be, ocrStatus: 'loading' } : be
                    )
                );

                runOcrProcess(
                    item.file,
                    (text) => {
                        setBatchEssays(prevEssays =>
                            prevEssays.map(be =>
                                be.id === item.batchItemId ? { ...be, ocrText: text, ocrStatus: 'success', errorMessage: undefined } : be
                            )
                        );
                        setActiveOcrCount(c => c - 1);
                        toast.success(`图片识别成功: ${item.file.name}`);
                    },
                    (message) => {
                        setBatchEssays(prevEssays =>
                            prevEssays.map(be =>
                                be.id === item.batchItemId ? { ...be, ocrStatus: 'error', errorMessage: message, ocrText: "" } : be
                            )
                        );
                        setActiveOcrCount(c => c - 1);
                         toast.error(`图片识别失败 (${item.file.name}): ${message}`);
                    }
                );
            });
        }
    }, [activeOcrCount, ocrProcessingQueue]); // runOcrProcess is stable via useCallback in lib/ocr.ts (or should be if moved there)

    const addFilesToBatch = useCallback((files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newItems: BatchEssayItem[] = [];
        const newQueueItems: OcrQueueItem[] = [];

        Array.from(files).forEach(file => {
            const id = uuidv4();
            const previewUrl = URL.createObjectURL(file);
            newItems.push({ id, file, previewUrl, ocrText: "", ocrStatus: 'idle' });
            newQueueItems.push({ batchItemId: id, file });
        });

        setBatchEssays(prev => [...prev, ...newItems]);
        setOcrProcessingQueue(prev => [...prev, ...newQueueItems]);
    }, []);

    const removeItemFromBatch = useCallback((idToRemove: string) => {
        const itemToRemove = batchEssays.find(item => item.id === idToRemove);
        if (itemToRemove?.previewUrl) {
            URL.revokeObjectURL(itemToRemove.previewUrl);
        }
        setBatchEssays(prev => prev.filter(item => item.id !== idToRemove));
        setOcrProcessingQueue(prev => prev.filter(item => item.batchItemId !== idToRemove));
        // Note: If the item was 'loading', activeOcrCount will decrement when its OCR process finishes.
    }, [batchEssays]); // Include batchEssays to get the latest state for URL cleanup

    const updateBatchItemText = useCallback((id: string, text: string) => {
        setBatchEssays(prev => prev.map(item => item.id === id ? { ...item, ocrText: text } : item));
    }, []);

     // Drag and drop handlers for reordering
    const draggedItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
        draggedItem.current = index;
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
        e.preventDefault();
        dragOverItem.current = index;
        e.dataTransfer.dropEffect = "move";
    }, []);

    const handleDrop = useCallback(() => {
        if (draggedItem.current === null || dragOverItem.current === null || draggedItem.current === dragOverItem.current) {
            return;
        }
        setBatchEssays(prev => {
            const newItems = [...prev];
            const [dragged] = newItems.splice(draggedItem.current!, 1);
            newItems.splice(dragOverItem.current!, 0, dragged);
            return newItems;
        });
        draggedItem.current = null;
        dragOverItem.current = null;
    }, []);


    // Calculate if any batch OCR is currently loading
    const isBatchOcrLoading = activeOcrCount > 0 || ocrProcessingQueue.length > 0;

    return {
        batchEssays,
        ocrProcessingQueue,
        activeOcrCount,
        isBatchOcrLoading,
        addFilesToBatch,
        removeItemFromBatch,
        updateBatchItemText,
        handleDragStart,
        handleDragOver,
        handleDrop,
        MAX_CONCURRENT_OCR // Export if needed for UI hints
    };
}
