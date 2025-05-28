// types/correction.ts

// Type for the top-level Correction record
export interface Correction {
    uuid: string;
    title: string;
    icon: string;
    model: string;
    content: string; // JSON string or plain markdown
    score: number; // Overall score (average for batch)
    user_email: string;
    created_at: string;
    updated_at: string;
    type: string; // e.g., "gaokao-english-continuation" or "gaokao-english-continuation-batch"
}

// Type for individual essay item in batch mode
export interface EssayItem {
    answer: string;
    score_dimensions: any; // Structure depends on specific correction type
    score: number; // Individual essay score
    upgradation?: any; // Structure depends on specific correction type
    pureUpgradation?: Array<{ sentence: string; upgradation: string; comment?: string; }>;
    strengthenFoundation?: Array<{ sentence: string; correction: string; comment?: string; }>; // Added
}

// Type for the main JSON content structure (can be for single or batch)
export interface CorrectionJson {
    question: string;
    referenceAnswer?: string;
    interpretation?: any; // Shared interpretation structure
    // For single essay
    answer?: string;
    score_dimensions?: any;
    // 'score' for single essay is at the top-level Correction interface
    upgradation?: any;
    pureUpgradation?: Array<{ sentence: string; upgradation: string; comment?: string; }>;
    strengthenFoundation?: Array<{ sentence: string; correction: string; comment?: string; }>; // Added
    // For batch essays
    essays?: EssayItem[];
}

// Constant for score dimension labels
export const SCORE_LABELS: { [key: string]: string } = {
    relevance_and_accuracy: "相关性与准确性",
    plot_plausibility_completeness: "情节合理与完整",
    vocabulary_richness: "词汇丰富度",
    grammatical_accuracy: "语法准确性",
    sentence_variety: "句式多样性",
    cohesion_coherence: "衔接与连贯",
    originality_logicality: "创新与逻辑性",
    style_voice_consistency: "风格与视角一致",
    literary_competence_teacher_evaluation: "文学素养与教师评价",
};
