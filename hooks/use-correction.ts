// hooks/use-correction.ts
import { useEffect, useState, useMemo } from "react";
import { Correction, CorrectionJson } from "@/types/correction"; // Import types

interface UseCorrectionResult {
    loading: boolean;
    error: string;
    correction: Correction | null;
    parsedFullJsonContent: CorrectionJson | null;
    isBatchCorrection: boolean;
    selectedEssayIndex: number;
    setSelectedEssayIndex: (index: number) => void;
    currentDisplayJson: CorrectionJson | null;
}

export function useCorrection(uuid: string | undefined): UseCorrectionResult {
    const [loading, setLoading] = useState(true);
    const [correction, setCorrection] = useState<Correction | null>(null);
    const [error, setError] = useState("");
    const [isBatchCorrection, setIsBatchCorrection] = useState(false);
    const [selectedEssayIndex, setSelectedEssayIndex] = useState<number>(0); // Default to first essay for batch
    const [parsedFullJsonContent, setParsedFullJsonContent] = useState<CorrectionJson | null>(null);

    useEffect(() => {
        async function fetchCorrection() {
            if (!uuid) {
                setError("无效的批改记录ID");
                setLoading(false);
                return;
            }
            setLoading(true);
            setError("");
            try {
                const res = await fetch(`/api/correction/${uuid}`);
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: "获取批改记录失败" }));
                    throw new Error(errorData.message || `服务器错误: ${res.status}`);
                }
                const data = await res.json();
                if (!data.success) {
                    setError(data.message || "获取批改记录失败");
                } else {
                    const fetchedCorrection: Correction = data.data;
                    setCorrection(fetchedCorrection);
                    const isBatch = fetchedCorrection.type?.endsWith("-batch") || false;
                    setIsBatchCorrection(isBatch);

                    try {
                        const parsed: CorrectionJson = JSON.parse(fetchedCorrection.content);
                        setParsedFullJsonContent(parsed);
                        if (isBatch && parsed.essays && parsed.essays.length > 0) {
                            setSelectedEssayIndex(0); // Default to first essay
                        }
                    } catch (e) {
                        setParsedFullJsonContent(null); // Indicates plain markdown or error
                        console.warn("Correction content is not valid JSON or malformed:", e);
                        if (isBatch) setError("批量批改数据格式错误，无法解析习作列表。");
                    }
                }
            } catch (e: unknown) {
                setError(e instanceof Error ? `请求出错: ${e.message}` : "发生未知错误");
                console.error("Fetch correction error:", e);
            } finally {
                setLoading(false);
            }
        }
        fetchCorrection();
    }, [uuid]);

    // Memoized current display JSON (for single or selected batch essay)
    const currentDisplayJson = useMemo((): CorrectionJson | null => {
        if (!parsedFullJsonContent) return null;

        if (isBatchCorrection) {
            if (parsedFullJsonContent.essays && parsedFullJsonContent.essays.length > selectedEssayIndex && selectedEssayIndex >= 0) {
                const selectedEssayData = parsedFullJsonContent.essays[selectedEssayIndex];
                return {
                    question: parsedFullJsonContent.question,
                    referenceAnswer: parsedFullJsonContent.referenceAnswer,
                    interpretation: parsedFullJsonContent.interpretation, // Shared
                    answer: selectedEssayData.answer,
                    score_dimensions: selectedEssayData.score_dimensions,
                    upgradation: selectedEssayData.upgradation,
                    pureUpgradation: selectedEssayData.pureUpgradation,
                    strengthenFoundation: selectedEssayData.strengthenFoundation, // Include strengthenFoundation
                };
            }
            return null; // Or some default if no essay selected / out of bounds
        } else {
            // For single correction, parsedFullJsonContent is already the display JSON
            return parsedFullJsonContent;
        }
    }, [parsedFullJsonContent, isBatchCorrection, selectedEssayIndex]);

    return {
        loading,
        error,
        correction,
        parsedFullJsonContent,
        isBatchCorrection,
        selectedEssayIndex,
        setSelectedEssayIndex,
        currentDisplayJson,
    };
}
