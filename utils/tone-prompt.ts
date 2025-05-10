// utils/tone-prompt.ts

// Define the supported tones
const SUPPORTED_TONES = ['serious', 'humorous', 'sharp', 'default'];

/**
 * Checks if a given tone is supported.
 * @param tone The tone string to check.
 * @returns True if the tone is supported, false otherwise.
 */
export function checkToneAvaliability(tone: string): boolean {
  return SUPPORTED_TONES.includes(tone);
}

/**
 * Gets the AI prompt string corresponding to the given tone.
 * @param tone The tone string ('serious', 'humorous', 'sharp', or others).
 * @returns The tone-specific prompt string, or an empty string if the tone is not supported.
 */
export function getTonePrompt(tone: string): string {
  switch (tone) {
    case 'serious':
      return "特别要求：你的评论批改语气需要一本正经，像一个经验丰富而严厉的老师。";
    case 'humorous':
      return "特别要求：你的评论批改语气需要幽默风趣，可以用上网络梗，可以多用emoji表情包，可以多搞笑。";
    case 'sharp':
      return "特别要求：你的评论批改语气需要尖锐、锐评、一针见血。";
    default:
      return ""; // Return empty string for unsupported or default tones
  }
}
