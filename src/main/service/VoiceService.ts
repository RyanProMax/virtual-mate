import { logger } from '../logger';

interface VoiceConfig {
  enableRecognition: boolean;
  recognitionLanguage: string;
  enableTTS: boolean;
  ttsVoice: string;
  ttsRate: number;
  ttsPitch: number;
  ttsVolume: number;
  azureApiKey?: string;
  azureRegion?: string;
}

interface RecognitionResult {
  text: string;
  confidence: number;
  isFinal: boolean;
}

interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export default class VoiceService {
  private logger = logger.scope('VoiceService');
  private config: VoiceConfig;
  private recognition: any = null;
  private synthesis: any = null;
  private isRecognizing: boolean = false;
  private isSpeaking: boolean = false;
  private currentUtterance: any = null;

  constructor(config: VoiceConfig) {
    this.config = config;
    this.logger.info('Voice Service initialized');
    this.initializeServices();
  }

  private initializeServices(): void {
    // 初始化语音识别

    if (this.config.enableRecognition && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.config.recognitionLanguage;
        this.recognition.onresult = this.handleRecognitionResult.bind(this);
        this.recognition.onerror = this.handleRecognitionError.bind(this);
        this.recognition.onend = this.handleRecognitionEnd.bind(this);
        this.logger.info('Speech recognition initialized');
      } else {
        this.logger.warn('Speech recognition not supported');
      }
    }

    // 初始化语音合成
    if (this.config.enableTTS && typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;

      if (this.synthesis) {
        this.logger.info('Speech synthesis initialized');
      } else {
        this.logger.warn('Speech synthesis not supported');
      }
    }
  }

  async startRecognition(): Promise<void> {
    try {
      if (!this.recognition) {
        throw new Error('Speech recognition not available');
      }
      if (this.isRecognizing) {
        this.logger.warn('Recognition already in progress');

        return;
      }
      this.isRecognizing = true;
      this.recognition.start();
      this.logger.info('Speech recognition started');
    } catch (error) {
      this.logger.error('Error starting recognition:', error);
      throw error;
    }
  }

  async stopRecognition(): Promise<void> {
    try {
      if (!this.recognition || !this.isRecognizing) {
        return;
      }
      this.recognition.stop();
      this.isRecognizing = false;
      this.logger.info('Speech recognition stopped');
    } catch (error) {
      this.logger.error('Error stopping recognition:', error);
      throw error;
    }
  }

  async speak(text: string, options?: TTSOptions): Promise<void> {
    try {
      if (!this.synthesis) {
        throw new Error('Speech synthesis not available');
      }

      // 停止当前播放
      if (this.isSpeaking) {
        await this.stopSpeaking();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      // 设置语音参数
      utterance.voice = this.getVoice(options?.voice || this.config.ttsVoice);
      utterance.rate = options?.rate || this.config.ttsRate;
      utterance.pitch = options?.pitch || this.config.ttsPitch;
      utterance.volume = options?.volume || this.config.ttsVolume;

      // 事件监听

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.logger.info('TTS started');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.logger.info('TTS finished');
      };

      utterance.onerror = (event) => {
        this.logger.error('TTS error:', event.error);
        this.isSpeaking = false;
        this.currentUtterance = null;
      };
      this.currentUtterance = utterance;
      this.synthesis.speak(utterance);
      this.logger.info('TTS speaking:', text.substring(0, 50) + '...');
    } catch (error) {
      this.logger.error('Error speaking:', error);

      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      if (!this.synthesis) {
        return;
      }
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.logger.info('TTS stopped');
    } catch (error) {
      this.logger.error('Error stopping TTS:', error);
      throw error;
    }
  }

  private getVoice(voiceName: string): SpeechSynthesisVoice | null {
    const voices = this.synthesis.getVoices();

    return (
      voices.find(
        (voice: SpeechSynthesisVoice) =>
          voice.name === voiceName || voice.lang.startsWith(voiceName)
      ) ||
      voices[0] ||
      null
    );
  }

  private handleRecognitionResult(event: any): void {
    try {
      const results = event.results;
      let transcript = '';
      let confidence = 0;
      let isFinal = false;

      for (let i = event.resultIndex; i < results.length; i++) {
        transcript += results[i][0].transcript;
        confidence = Math.max(confidence, results[i][0].confidence);
        isFinal = results[i].isFinal;
      }

      const result: RecognitionResult = {
        text: transcript,
        confidence: confidence,
        isFinal: isFinal,
      };
      this.logger.debug('Recognition result:', result);

      // 这里应该触发事件或回调

      // 目前只是记录结果
      if (isFinal && transcript.trim()) {
        this.logger.info('Final recognition result:', transcript);
      }
    } catch (error) {
      this.logger.error('Error handling recognition result:', error);
    }
  }

  private handleRecognitionError(event: any): void {
    this.logger.error('Recognition error:', event.error);
    this.isRecognizing = false;
  }

  private handleRecognitionEnd(): void {
    this.logger.info('Recognition ended');
    this.isRecognizing = false;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) {
      return [];
    }
    return this.synthesis.getVoices();
  }

  public isRecognitionActive(): boolean {
    return this.isRecognizing;
  }

  public isTTSActive(): boolean {
    return this.isSpeaking;
  }

  public updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('Voice service config updated');

    // 重新初始化服务
    this.initializeServices();
  }

  public dispose(): void {
    this.stopRecognition();
    this.stopSpeaking();
    this.recognition = null;
    this.synthesis = null;
    this.logger.info('Voice Service disposed');
  }
}
