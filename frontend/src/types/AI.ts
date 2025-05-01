export interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: Date;
  }
  
export  interface CommandPayload {
    status: string;
    payload: {
      method: string;
      params: {
        [key: string]: boolean;
      };
    } | null;
  }
  
export interface ChatResponse {
    response: string;
    sessionId: string;
    isCommand: boolean;
    commandPayload?: CommandPayload;
  }

export interface VoiceCommandResponse {
    status: string;
    payload: CommandPayload | null;
    message: string;
  }

export interface UseVoiceAIReturn {
    interpretCommand: (command: string) => Promise<VoiceCommandResponse>;
    sendChatMessage: (message: string, sessionId?: string) => Promise<ChatResponse>;
    isLoading: boolean;
    error: Error | null;
  }