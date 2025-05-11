import { generateText } from "ai";
import { fastModel } from "./models";

/**
 * Generates a title for the essay continuation based on the original text.
 * @param originalText The original text prompt.
 * @returns The generated title string.
 */
export async function generateTitle(
    originalText: string
  ): Promise<string> {
    try {
      const { text: titleResponse } = await generateText({
        model: fastModel,
        messages: [
          {
            role: 'system',
            content: `用户将提供给你一道作文题，请你分析题目内容，并总结出一个标题，输出时仅包含一行该标题，不允许出现其他字符或注释。`,
          },
          {
            role: 'user',
            content: `作文题：\n${originalText}`,
          }
        ],
        temperature: 0.5 // Allow some creativity for title
      });
  
      return titleResponse.trim(); // Return the generated title, trimmed
  
    } catch (error) {
      console.error("Error generating title:", error);
      throw error; // Re-throw
    }
  }
  
  /**
   * Generates an emoji icon for the essay continuation based on the original text.
   * @param originalText The original text prompt.
   * @returns The generated emoji icon string.
   */
  export async function generateIcon(
    originalText: string
  ): Promise<string> {
    try {
      const { text: icon } = await generateText({
        model: fastModel,
        messages: [
          {
            role: 'system',
            content: `用户将提供给你一道作文题，请你分析题目内容，并输出一个你认为与之相关的emoji字符（只能一个字符，例如📝），并且在输出时不允许出现其他字符或注释。`,
          },
          {
            role: 'user',
            content: `作文题：\n${originalText}`,
          }
        ],
        temperature: 0.3 // Keep it focused
      });
  
      // Basic validation for a single character emoji
      const trimmedIcon = icon.trim();
      // Improved emoji check using unicode property escape and length check
      if (trimmedIcon && (trimmedIcon.length === 1 || /\p{Emoji}/u.test(trimmedIcon))) {
        // Return the first grapheme cluster if multiple emojis are returned accidentally
        const firstEmoji = [...trimmedIcon][0];
        return firstEmoji;
      } else {
        // If AI didn't return a single emoji, provide a default or log a warning
        console.warn(`AI did not return a single valid emoji for icon (received: '${icon}'), returning default.`);
        return "📄"; // Default icon
      }
  
    } catch (error) {
      console.error("Error generating icon:", error);
      // Return a default icon on error
      return "📄";
    }
  }
  