import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User,
  Settings, 
  X,
  VolumeX,
  Volume2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from 'react-toastify';
import authorizedAxiosInstance from '@/lib/axios';
import { useDeviceControl } from '@/hooks/useDeviceAPI';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface CommandPayload {
  status: string;
  payload: {
    method: string;
    params: {
      [key: string]: boolean;
    };
  } | null;
}

interface ChatResponse {
  response: string;
  sessionId: string;
  isCommand: boolean;
  commandPayload?: CommandPayload;
}

const VoiceAIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggleDevice } = useDeviceControl();

  // Get a unique session ID when component mounts
  useEffect(() => {
    setSessionId(generateSessionId());
    initializeSpeechRecognition();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'vi-VN';
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        setInputText(transcript);
        handleSendMessage(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Lỗi nhận diện giọng nói: ' + event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói');
    }
  };

  // Generate a unique session ID
  const generateSessionId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Handle toggling speech recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Start listening for speech
  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  // Stop listening for speech
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  // Handle sending a message (either typed or from speech recognition)
  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim()) return;
    
    // Add user message to UI
    const userMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      sender: 'user',
      text: text,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send message to backend
      const response = await authorizedAxiosInstance.post<ChatResponse>(
        '/voice-ai/chat',
        {
          message: text,
          sessionId: sessionId
        }
      );

      // Handle command if the response is a command
      if (response.data.isCommand && response.data.commandPayload) {
        await handleCommand(response.data.commandPayload);
      }

      // Add AI response to UI
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        sender: 'ai',
        text: response.data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak the response if auto-speak is enabled
      if (autoSpeak && !isMuted) {
        speakText(response.data.response);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Create a user-friendly error message
      let errorMessage = 'Lỗi khi gửi tin nhắn, vui lòng thử lại';
      
      // Show more specific error if available
      if (error.response) {
        // Server responded with a status outside 2xx range
        errorMessage = `Lỗi máy chủ: ${error.response.status}`;
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        errorMessage = 'Không thể kết nối đến máy chủ, vui lòng kiểm tra kết nối mạng';
      }
      
      // Add error message as AI response
      const errorResponseMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        sender: 'ai',
        text: `Xin lỗi, tôi đang gặp sự cố kết nối. ${errorMessage}`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorResponseMessage]);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle command payloads from the AI
  const handleCommand = async (commandPayload: CommandPayload) => {
    if (commandPayload.status === 'OK' && commandPayload.payload) {
      const { method, params } = commandPayload.payload;
      
      if (method === 'setValue') {
        const device = Object.keys(params)[0];
        const value = params[device];
        
        try {
          // Use your existing device control hook
          await toggleDevice(device, value ? 'on' : 'off');
          toast.success(`Đã ${value ? 'bật' : 'tắt'} thiết bị ${device}`);
        } catch (err) {
          toast.error(`Không thể điều khiển thiết bị ${device}`);
          console.error(err);
        }
      }
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Speak text using the Web Speech API
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.volume = volume;
      
      // Find a Vietnamese voice if available
      const voices = window.speechSynthesis.getVoices();
      const vietnameseVoice = voices.find(voice => voice.lang.includes('vi'));
      if (vietnameseVoice) {
        utterance.voice = vietnameseVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Add welcome message when chat first opens
  const handleOpenChat = () => {
    setIsOpen(true);
    
    // Add welcome message if no messages exist
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: 'Xin chào! Tôi là trợ lý AI của bạn. Bạn có thể nói hoặc nhắn tin để điều khiển thiết bị hoặc hỏi thông tin.',
          timestamp: new Date()
        }
      ]);
    }
    
    // Focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Clear chat history
  const clearChat = () => {
    setMessages([]);
    setSessionId(generateSessionId());
    
    // Add a new welcome message
    setMessages([
      {
        id: 'welcome-new',
        sender: 'ai',
        text: 'Trò chuyện đã được làm mới. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date()
      }
    ]);
  };

  // Format timestamp for messages
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={handleOpenChat}
        className="fixed bottom-6 right-6 rounded-full p-4 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="icon"
      >
        <Bot size={24} />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-xl flex flex-col overflow-hidden z-50">
      <CardHeader className="bg-blue-600 text-white px-4 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center">
          <Bot className="mr-2 h-5 w-5" />
          <CardTitle className="text-lg">Trợ lý AI</CardTitle>
        </div>
        <div className="flex items-center space-x-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-blue-700 rounded-full"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white hover:bg-blue-700 rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <X size={18} />
          </Button>
        </div>
      </CardHeader>

      {showSettings && (
        <div className="bg-gray-50 p-3 border-b">
          <h4 className="text-sm font-medium mb-2">Cài đặt</h4>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Switch id="auto-speak" checked={autoSpeak} onCheckedChange={setAutoSpeak} />
              <Label htmlFor="auto-speak">Tự động đọc phản hồi</Label>
            </div>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              Xóa trò chuyện
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              value={volume} 
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              disabled={isMuted}
              className="w-full"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={chatContainerRef}>
        <div className="flex flex-col space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.sender === 'ai' ? (
                    <Bot size={16} className="mr-1" />
                  ) : (
                    <User size={16} className="mr-1" />
                  )}
                  <span className="text-xs opacity-75">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <p>{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-800">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardFooter className="p-3 pt-2 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2 w-full">
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleSpeechRecognition}
            className="shrink-0"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>
          <Input
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập tin nhắn hoặc nhấn mic để nói..."
            disabled={isListening || isLoading}
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="default" 
            disabled={!inputText.trim() || isLoading}
            className="shrink-0"
          >
            <Send size={18} />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default VoiceAIChat;