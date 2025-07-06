import { logger } from '../logger';

import { AIProviders } from '../../common/constant';

interface AIServiceConfig {
  provider: AIProviders;
  model: string;
  apiKey: string;
  apiEndpoint?: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: {
    emotion?: string;
    expression?: string;
    motion?: string;
  };
}

interface AIResponse {
  content: string;
  emotion?: string;
  expression?: string;
  motion?: string;
  confidence?: number;
}

export default class AIService {
  private logger = logger.scope('AIService');
  private config: AIServiceConfig;
  private chatHistory: ChatMessage[] = [];
  private contextMemorySize: number = 10;

  constructor(config: AIServiceConfig) {
    this.config = config;
    this.logger.info('AI Service initialized with provider:', config.provider);
  }

  async sendMessage(message: string, options?: Partial<AIServiceConfig>): Promise<AIResponse> {
    try {
      const finalConfig = { ...this.config, ...options };

      // 添加用户消息到历史记录
      const userMessage: ChatMessage = {
        id: this.generateId(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
      };
      this.addToHistory(userMessage);

      let response: AIResponse;

      switch (finalConfig.provider) {
        case AIProviders.OpenAI:
          response = await this.sendOpenAIMessage(message, finalConfig);
          break;
        case AIProviders.Claude:
          response = await this.sendClaudeMessage(message, finalConfig);
          break;
        case AIProviders.LocalLLM:
          response = await this.sendLocalLLMMessage(message, finalConfig);
          break;
        default:
          throw new Error(`Unsupported AI provider: ${finalConfig.provider}`);
      }

      // 添加AI回复到历史记录
      const aiMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: response.content,
        timestamp: Date.now(),
        metadata: {
          emotion: response.emotion,
          expression: response.expression,
          motion: response.motion,
        },
      };
      this.addToHistory(aiMessage);

      return response;
    } catch (error) {
      this.logger.error('Error sending message:', error);
      throw error;
    }
  }

  private async sendOpenAIMessage(message: string, config: AIServiceConfig): Promise<AIResponse> {
    const messages = this.buildMessageContext(config.systemPrompt);
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      emotion: this.extractEmotion(content),
      expression: this.mapEmotionToExpression(content),
      motion: this.mapEmotionToMotion(content),
    };
  }

  private async sendClaudeMessage(message: string, config: AIServiceConfig): Promise<AIResponse> {
    const messages = this.buildMessageContext(config.systemPrompt);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },

      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: messages,
      }),
    });
    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';

    return {
      content,
      emotion: this.extractEmotion(content),
      expression: this.mapEmotionToExpression(content),
      motion: this.mapEmotionToMotion(content),
    };
  }

  private async sendLocalLLMMessage(message: string, config: AIServiceConfig): Promise<AIResponse> {
    const messages = this.buildMessageContext(config.systemPrompt);
    const endpoint = config.apiEndpoint || 'http://localhost:1234/v1/chat/completions';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
    if (!response.ok) {
      throw new Error(`Local LLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    return {
      content,
      emotion: this.extractEmotion(content),
      expression: this.mapEmotionToExpression(content),
      motion: this.mapEmotionToMotion(content),
    };
  }

  private buildMessageContext(systemPrompt: string): Array<{ role: string; content: string }> {
    const messages = [{ role: 'system', content: systemPrompt }];

    // 添加上下文记忆
    const recentHistory = this.chatHistory.slice(-this.contextMemorySize);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    return messages;
  }

  private extractEmotion(content: string): string {
    // 简单的情感分析逻辑，可以替换为更复杂的NLP模型
    const emotionKeywords = {
      happy: ['开心', '高兴', '快乐', '哈哈', '😊', '😄'],
      sad: ['难过', '伤心', '悲伤', '😢', '😭'],
      angry: ['生气', '愤怒', '😠', '😡'],
      surprised: ['惊讶', '意外', '😲', '😮'],
      neutral: ['好的', '明白', '知道了'],
    };
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((keyword) => content.includes(keyword))) {
        return emotion;
      }
    }
    return 'neutral';
  }

  private mapEmotionToExpression(content: string): string {
    const emotion = this.extractEmotion(content);
    const expressionMap: Record<string, string> = {
      happy: 'smile',
      sad: 'sad',
      angry: 'angry',
      surprised: 'surprised',
      neutral: 'default',
    };
    return expressionMap[emotion] || 'default';
  }

  private mapEmotionToMotion(content: string): string {
    const emotion = this.extractEmotion(content);
    const motionMap: Record<string, string> = {
      happy: 'wave',
      sad: 'down',
      angry: 'shake',
      surprised: 'jump',
      neutral: 'idle',
    };
    return motionMap[emotion] || 'idle';
  }

  private addToHistory(message: ChatMessage): void {
    this.chatHistory.push(message);

    // 限制历史记录长度
    if (this.chatHistory.length > this.contextMemorySize * 2) {
      this.chatHistory = this.chatHistory.slice(-this.contextMemorySize);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  public clearChatHistory(): void {
    this.chatHistory = [];
    this.logger.info('Chat history cleared');
  }

  public updateConfig(config: Partial<AIServiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('AI Service config updated');
  }

  public setContextMemorySize(size: number): void {
    this.contextMemorySize = size;
    this.logger.info('Context memory size set to:', size);
  }
}
