export enum Pages {
  Home = 'home',
  About = 'about',
  Update = 'update',
  Character = 'character',
  Settings = 'settings',
  Chat = 'chat',
}

export enum Channels {
  // main events
  Close = 'Close',
  Quit = 'Quit',
  Minimize = 'Minimize',
  Maximize = 'Maximize',
  GetPackageJson = 'GetPackageJson',
  OpenExternal = 'OpenExternal',
  Broadcast = 'Broadcast',
  ToggleTheme = 'ToggleTheme',
  Render = 'Render',

  // app updater
  AppUpdaterConfirm = 'AppUpdaterConfirm',
  AppUpdaterProgress = 'AppUpdaterProgress',
  AppUpdaterAbort = 'AppUpdaterAbort',

  // store
  GetUserStore = 'GetUserStore',
  SetUserStore = 'SetUserStore',

  // sub window
  AboutMe = 'AboutMe',

  // Live2D相关
  LoadCharacter = 'LoadCharacter',
  ChangeExpression = 'ChangeExpression',
  PlayMotion = 'PlayMotion',
  SetCharacterParameter = 'SetCharacterParameter',

  // AI Chat相关
  SendMessage = 'SendMessage',
  ReceiveMessage = 'ReceiveMessage',
  GetChatHistory = 'GetChatHistory',
  ClearChatHistory = 'ClearChatHistory',

  // 语音相关
  StartVoiceRecognition = 'StartVoiceRecognition',
  StopVoiceRecognition = 'StopVoiceRecognition',
  PlayTTS = 'PlayTTS',
  StopTTS = 'StopTTS',

  // 窗口管理
  SetWindowMode = 'SetWindowMode',
  SetWindowTransparency = 'SetWindowTransparency',
  SetWindowAlwaysOnTop = 'SetWindowAlwaysOnTop',

  // 设置相关
  GetSettings = 'GetSettings',
  UpdateSettings = 'UpdateSettings',
  GetCharacterList = 'GetCharacterList',
  GetAIProviders = 'GetAIProviders',
}

// 新增AI相关常量
export enum AIProviders {
  OpenAI = 'openai',
  Claude = 'claude',
  LocalLLM = 'local',
  Custom = 'custom',
}

export enum WindowModes {
  Normal = 'normal',
  Floating = 'floating',
  Desktop = 'desktop',
}

export enum CharacterStates {
  Idle = 'idle',
  Talking = 'talking',
  Listening = 'listening',
  Thinking = 'thinking',
  Happy = 'happy',
  Sad = 'sad',
  Surprised = 'surprised',
}

export enum MessageTypes {
  Text = 'text',
  Voice = 'voice',
  System = 'system',
  Error = 'error',
}
