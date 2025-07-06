import AIService from './AIService';
import Live2DService from './Live2DService';
import VoiceService from './VoiceService';

import Core from '../core';
import { AIProviders } from '../../common/constant';
import { logger } from '../logger';

export default class Service {
  logger = logger.scope('Service');

  private core: Core;

  live2dService: Live2DService | null = null;
  aiService: AIService | null = null;
  voiceService: VoiceService | null = null;

  constructor(core: Core) {
    this.core = core;
  }

  async init() {
    try {
      // 初始化Live2D服务
      this.live2dService = new Live2DService();
      this.logger.info('Live2D Service initialized');

      // 初始化AI服务
      // const aiConfig = await this.getAIConfig();
      // this.aiService = new AIService(aiConfig);
      // this.logger.info('AI Service initialized');

      // 初始化语音服务
      // const voiceConfig = await this.getVoiceConfig();
      // this.voiceService = new VoiceService(voiceConfig);
      // this.logger.info('Voice Service initialized');
    } catch (error) {
      this.logger.error('Error initializing services:', error);
    }
  }

  async getAIConfig() {
    const settings = (this.core.store?.userStore?.get('settings') as Record<string, unknown>) || {};
    return {
      provider: (settings.aiProvider as AIProviders) || AIProviders.OpenAI,
      model: (settings.aiModel as string) || 'gpt-3.5-turbo',
      apiKey: (settings.apiKey as string) || '',
      apiEndpoint: settings.apiEndpoint as string,
      systemPrompt:
        (settings.systemPrompt as string) ||
        '你是一个可爱的AI看板娘，请用友好温暖的语气与用户交流。',
      temperature: (settings.temperature as number) || 0.7,
      maxTokens: (settings.maxTokens as number) || 1000,
    };
  }

  async getVoiceConfig() {
    const settings = (this.core.store?.userStore?.get('settings') as Record<string, unknown>) || {};
    return {
      enableRecognition: (settings.enableVoiceRecognition as boolean) || false,
      recognitionLanguage: (settings.voiceRecognitionLanguage as string) || 'zh-CN',
      enableTTS: (settings.enableTTS as boolean) || false,
      ttsVoice: (settings.ttsVoice as string) || 'zh-CN',
      ttsRate: (settings.ttsRate as number) || 1.0,
      ttsPitch: (settings.ttsPitch as number) || 1.0,
      ttsVolume: (settings.ttsVolume as number) || 1.0,
    };
  }
}
