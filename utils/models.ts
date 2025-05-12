import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Define AI model instances - these are shared
export const openai = createOpenAI({
  baseURL: process.env.OPENAI_API_BASEURL || '',
  apiKey: process.env.OPENAI_API_APIKEY || '',
  compatibility: 'compatible',
});

export const deepseek = createOpenAI({
  baseURL: process.env.DEEPSEEK_API_BASEURL || '',
  apiKey: process.env.DEEPSEEK_API_APIKEY || '',
  compatibility: 'compatible',
});

export const siliconflow = createOpenAI({
  baseURL: process.env.SILICONFLOW_API_BASEURL || '',
  apiKey: process.env.SILICONFLOW_API_APIKEY || '',
  compatibility: 'compatible',
});

export const gpt = createOpenAI({
  baseURL: process.env.GPT_API_BASEURL || '',
  apiKey: process.env.GPT_API_APIKEY || '',
  compatibility: 'compatible',
});

export const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_APIKEY || '',
});

const modelMapping = {
  'llama': openai('@cf/meta/llama-4-scout-17b-16e-instruct'),
  'deepseek': deepseek('deepseek-chat'),
  'qwen': siliconflow('Qwen/Qwen3-8B'),
  'glm': siliconflow('THUDM/GLM-Z1-9B-0414'),
  'gpt4': siliconflow('gpt-3.5-turbo'),
  // 'glm': glm('glm-4-flash-250414'),
  'gemini': gemini('gemini-2.0-flash'),
}

export function checkModelAvaliability(modelName: string) {
  return modelName in modelMapping;
}

export function getModelByName(modelName: string) {
  if (checkModelAvaliability(modelName)) {
    return modelMapping[modelName as keyof typeof modelMapping];
  } else {
    return openai('@cf/qwen/qwen1.5-14b-chat-awq'); // Default model
  }
}

export const fastModel = openai('@cf/meta/llama-3.1-8b-instruct-fast');