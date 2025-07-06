import path from 'path';
import fs from 'fs';

import { logger } from '../logger';
import { CharacterStates } from '../../common/constant';

interface Live2DModel {
  id: string;
  name: string;
  modelPath: string;
  configPath: string;
  expressions: Expression[];
  motions: Motion[];
  parameters: Parameter[];
  hitAreas: HitArea[];
}

interface Expression {
  id: string;
  name: string;
  file: string;
  fadeInTime: number;
  fadeOutTime: number;
}

interface Motion {
  id: string;
  name: string;
  file: string;
  sound?: string;
  fadeInTime: number;
  fadeOutTime: number;
}

interface Parameter {
  id: string;
  name: string;
  type: 'float' | 'boolean';
  min?: number;
  max?: number;
  default?: number;
  current?: number;
}

interface HitArea {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Live2DConfig {
  version: string;
  fileReferences: {
    moc: string;
    textures: string[];
    physics?: string;
    expressions?: Expression[];
    motions?: { [key: string]: Motion[] };
    hit_areas?: HitArea[];
  };
  groups?: { [key: string]: { ids: string[]; name: string } };
  layout?: {
    center_x: number;
    center_y: number;
    width: number;
    height: number;
  };
}

export default class Live2DService {
  private logger = logger.scope('Live2DService');

  private currentModel: Live2DModel | null = null;
  private currentState: CharacterStates = CharacterStates.Idle;
  private currentExpression: string = 'default';
  private currentMotion: string = 'idle';
  private isPlaying: boolean = false;
  private modelCache: Map<string, Live2DModel> = new Map();
  private animationFrame: number | null = null;

  constructor() {
    this.logger.info('Live2D Service initialized');
  }

  async loadModel(modelPath: string): Promise<Live2DModel> {
    try {
      this.logger.info('Loading Live2D model:', modelPath);

      // 检查缓存
      const cachedModel = this.modelCache.get(modelPath);
      if (cachedModel) {
        this.currentModel = cachedModel;
        return cachedModel;
      }

      // 验证模型文件
      if (!fs.existsSync(modelPath)) {
        throw new Error(`Model file not found: ${modelPath}`);
      }

      const modelConfig = await this.loadModelConfig(modelPath);
      const model = await this.parseModelConfig(modelPath, modelConfig);

      // 缓存模型
      this.modelCache.set(modelPath, model);
      this.currentModel = model;
      this.logger.info('Model loaded successfully:', model.name);

      return model;
    } catch (error) {
      this.logger.error('Error loading model:', error);
      throw error;
    }
  }

  private async loadModelConfig(modelPath: string): Promise<Live2DConfig> {
    const configData = await fs.promises.readFile(modelPath, 'utf-8');
    return JSON.parse(configData);
  }

  private async parseModelConfig(modelPath: string, config: Live2DConfig): Promise<Live2DModel> {
    const modelDir = path.dirname(modelPath);
    const modelName = path.basename(modelPath, '.model3.json');

    const model: Live2DModel = {
      id: modelName,
      name: modelName,
      modelPath: modelPath,
      configPath: modelPath,
      expressions: [],
      motions: [],
      parameters: [],
      hitAreas: [],
    };

    // 解析表情
    if (config.fileReferences.expressions) {
      model.expressions = config.fileReferences.expressions.map((expr) => ({
        id: expr.id || path.basename(expr.file, '.exp3.json'),
        name: expr.name || expr.id || path.basename(expr.file, '.exp3.json'),
        file: path.resolve(modelDir, expr.file),
        fadeInTime: expr.fadeInTime || 0.5,
        fadeOutTime: expr.fadeOutTime || 0.5,
      }));
    }

    // 解析动作
    if (config.fileReferences.motions) {
      for (const [group, motions] of Object.entries(config.fileReferences.motions)) {
        model.motions.push(
          ...motions.map((motion) => ({
            id: motion.id || `${group}_${path.basename(motion.file, '.motion3.json')}`,
            name: motion.name || motion.id || path.basename(motion.file, '.motion3.json'),
            file: path.resolve(modelDir, motion.file),
            sound: motion.sound ? path.resolve(modelDir, motion.sound) : undefined,
            fadeInTime: motion.fadeInTime || 0.5,
            fadeOutTime: motion.fadeOutTime || 0.5,
          }))
        );
      }
    }

    // 解析命中区域

    if (config.fileReferences.hit_areas) {
      model.hitAreas = config.fileReferences.hit_areas.map((area) => ({
        id: area.id,
        name: area.name,
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      }));
    }

    return model;
  }

  async changeExpression(expressionId: string): Promise<void> {
    try {
      if (!this.currentModel) {
        throw new Error('No model loaded');
      }

      const expression = this.currentModel.expressions.find((expr) => expr.id === expressionId);
      if (!expression) {
        throw new Error(`Expression not found: ${expressionId}`);
      }

      this.currentExpression = expressionId;
      this.logger.info('Changed expression to:', expressionId);

      // 这里应该调用实际的Live2D渲染引擎

      // 目前只是更新状态

      await this.updateModelState();
    } catch (error) {
      this.logger.error('Error changing expression:', error);

      throw error;
    }
  }

  async playMotion(motionId: string, priority: number = 1): Promise<void> {
    try {
      if (!this.currentModel) {
        throw new Error('No model loaded');
      }

      const motion = this.currentModel.motions.find((m) => m.id === motionId);

      if (!motion) {
        throw new Error(`Motion not found: ${motionId}`);
      }

      this.currentMotion = motionId;
      this.isPlaying = true;
      this.logger.info('Playing motion:', motionId);

      // 这里应该调用实际的Live2D渲染引擎

      // 目前只是模拟动作播放
      await this.updateModelState();

      // 模拟动作播放完成
      setTimeout(() => {
        this.isPlaying = false;

        this.currentMotion = 'idle';

        this.updateModelState();
      }, 3000);
    } catch (error) {
      this.logger.error('Error playing motion:', error);

      throw error;
    }
  }

  async setParameter(parameterId: string, value: number): Promise<void> {
    try {
      if (!this.currentModel) {
        throw new Error('No model loaded');
      }

      const parameter = this.currentModel.parameters.find((p) => p.id === parameterId);

      if (!parameter) {
        throw new Error(`Parameter not found: ${parameterId}`);
      }

      // 验证参数范围

      if (parameter.min !== undefined && value < parameter.min) {
        value = parameter.min;
      }

      if (parameter.max !== undefined && value > parameter.max) {
        value = parameter.max;
      }

      parameter.current = value;

      this.logger.info(`Set parameter ${parameterId} to:`, value);

      await this.updateModelState();
    } catch (error) {
      this.logger.error('Error setting parameter:', error);

      throw error;
    }
  }

  async setState(state: CharacterStates): Promise<void> {
    try {
      this.currentState = state;

      this.logger.info('Changed character state to:', state);

      // 根据状态自动切换表情和动作

      switch (state) {
        case CharacterStates.Happy:
          await this.changeExpression('smile');

          await this.playMotion('wave');

          break;

        case CharacterStates.Sad:
          await this.changeExpression('sad');

          await this.playMotion('down');

          break;

        case CharacterStates.Talking:
          await this.changeExpression('talk');

          await this.playMotion('talk');

          break;

        case CharacterStates.Listening:
          await this.changeExpression('focus');

          await this.playMotion('listen');

          break;

        case CharacterStates.Thinking:
          await this.changeExpression('think');

          await this.playMotion('think');

          break;

        case CharacterStates.Surprised:
          await this.changeExpression('surprised');

          await this.playMotion('jump');

          break;

        case CharacterStates.Idle:
        default:
          await this.changeExpression('default');
          await this.playMotion('idle');
          break;
      }
    } catch (error) {
      this.logger.error('Error setting state:', error);
      throw error;
    }
  }

  async handleClick(x: number, y: number): Promise<void> {
    try {
      if (!this.currentModel) {
        return;
      }

      // 检查点击区域
      const hitArea = this.currentModel.hitAreas.find(
        (area) =>
          x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height
      );

      if (hitArea) {
        this.logger.info('Clicked on hit area:', hitArea.name);

        // 根据点击区域播放相应的动作
        switch (hitArea.name.toLowerCase()) {
          case 'head':
            await this.playMotion('head_touch');
            break;
          case 'body':
            await this.playMotion('body_touch');
            break;
          case 'hand':
            await this.playMotion('hand_touch');
            break;
          default:
            await this.playMotion('touch');
            break;
        }
      }
    } catch (error) {
      this.logger.error('Error handling click:', error);
    }
  }

  async handleDrag(
    startX: number,

    startY: number,

    currentX: number,

    currentY: number
  ): Promise<void> {
    try {
      if (!this.currentModel) {
        return;
      }
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      // 简单的拖拽跟随逻辑
      const angleX = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      const angleY = Math.atan2(deltaX, deltaY) * (180 / Math.PI);

      // 设置眼球跟随参数
      await this.setParameter('ParamAngleX', angleX / 30);
      await this.setParameter('ParamAngleY', angleY / 30);
      await this.setParameter('ParamEyeBallX', deltaX / 100);
      await this.setParameter('ParamEyeBallY', deltaY / 100);

      this.logger.debug('Drag event:', { deltaX, deltaY, angleX, angleY });
    } catch (error) {
      this.logger.error('Error handling drag:', error);
    }
  }

  private async updateModelState(): Promise<void> {
    // 这里应该更新实际的Live2D渲染状态

    // 目前只是记录状态变化
    this.logger.debug('Model state updated:', {
      state: this.currentState,
      expression: this.currentExpression,
      motion: this.currentMotion,
      isPlaying: this.isPlaying,
    });
  }

  public getCurrentModel(): Live2DModel | null {
    return this.currentModel;
  }

  public getCurrentState(): CharacterStates {
    return this.currentState;
  }

  public getCurrentExpression(): string {
    return this.currentExpression;
  }

  public getCurrentMotion(): string {
    return this.currentMotion;
  }

  public isMotionPlaying(): boolean {
    return this.isPlaying;
  }

  public async getAvailableModels(modelsDir: string): Promise<string[]> {
    try {
      const files = await fs.promises.readdir(modelsDir);

      return files.filter((file) => file.endsWith('.model3.json'));
    } catch (error) {
      this.logger.error('Error getting available models:', error);

      return [];
    }
  }

  public dispose(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.modelCache.clear();
    this.currentModel = null;
    this.logger.info('Live2D Service disposed');
  }
}
