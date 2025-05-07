
import { createOpenAI } from '@ai-sdk/openai';

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

