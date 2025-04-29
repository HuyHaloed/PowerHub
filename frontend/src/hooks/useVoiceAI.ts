import { useState, useCallback } from 'react';
import authorizedAxiosInstance from '@/lib/axios';
import { VoiceCommandResponse, ChatResponse, UseVoiceAIReturn } from '@/types/AI';  


const useVoiceAI = (): UseVoiceAIReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const interpretCommand = useCallback(async (command: string): Promise<VoiceCommandResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authorizedAxiosInstance.post<VoiceCommandResponse>(
        '/voice-ai/interpret',
        { command }
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendChatMessage = useCallback(async (message: string, sessionId?: string): Promise<ChatResponse> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authorizedAxiosInstance.post<ChatResponse>(
        '/voice-ai/chat',
        { 
          message,
          sessionId
        }
      );
      return response.data;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    interpretCommand,
    sendChatMessage,
    isLoading,
    error
  };
};

export default useVoiceAI;