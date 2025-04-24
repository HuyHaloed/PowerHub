import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  HelpCircle 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useDevices, useDeviceControl } from '@/hooks/useDeviceAPI';
import { toast } from 'react-toastify';

const VoiceMicro: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const micButtonRef = useRef<HTMLButtonElement>(null);

  const { devices } = useDevices();
  const { toggleDevice } = useDeviceControl();
  const buttonVariants = {
    default: "rounded-full p-6 shadow-2xl transition-all duration-300 ease-in-out w-20 h-20 flex items-center justify-center",
    listening: "rounded-full p-6 shadow-2xl animate-pulse bg-blue-600 text-white w-20 h-20 flex items-center justify-center",
    processing: "rounded-full p-6 shadow-2xl animate-pulse bg-green-600 text-white w-20 h-20 flex items-center justify-center"
  };

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'vi-VN';
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = (event: any) => {
        setIsProcessing(true);
        const transcript = event.results[0][0].transcript.toLowerCase().trim();
        setLastCommand(transcript);
        processVoiceCommand(transcript);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast.error('Lỗi nhận diện giọng nói: ' + event.error);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        setIsProcessing(false);
      };

      setRecognition(recognitionInstance);
    } else {
      toast.error('Trình duyệt của bạn không hỗ trợ điều khiển giọng nói');
    }
  }, []);

  const removeVietnameseTones = (str: string) => {
    return str
      .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
      .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e')
      .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
      .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
      .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
      .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
      .replace(/đ/g, 'd')
      .replace(/[^\w\s]/gi, '')
      .toLowerCase();
  };

  const processVoiceCommand = (transcript: string) => {
    const processedTranscript = removeVietnameseTones(transcript);
    const matchDevice = devices.find(device => 
      processedTranscript.includes(removeVietnameseTones(device.name.toLowerCase()))
    );

    if (matchDevice) {
      let newStatus: 'on' | 'off' | null = null;
      if (processedTranscript.includes('bat') || processedTranscript.includes('mo')) {
        newStatus = 'on';
      } else if (processedTranscript.includes('tat')) {
        newStatus = 'off';
      }

      if (newStatus) {
        try {
          toggleDevice(Number(matchDevice.id), newStatus);
          toast.success(`Đã ${newStatus === 'on' ? 'bật' : 'tắt'} thiết bị ${matchDevice.name}`);
        } catch (error) {
          toast.error(`Không thể ${newStatus === 'on' ? 'bật' : 'tắt'} thiết bị ${matchDevice.name}`);
        }
      } else {
        toast.info(`Không rõ lệnh cho thiết bị ${matchDevice.name}`);
      }
    } else {
      toast.info('Không tìm thấy thiết bị phù hợp');
    }
  };

  const startListening = () => {
    if (recognition) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-6">
      {(isListening || lastCommand) && (
        <div className="bg-white shadow-2xl rounded-2xl px-6 py-3 flex items-center space-x-4 animate-in slide-in-from-right max-w-sm">
          {isProcessing ? (
            <Sparkles className="h-8 w-8 text-green-600 animate-spin" />
          ) : (
            <Volume2 className="h-8 w-8 text-blue-600" />
          )}
          <span className="text-lg font-semibold text-gray-800 truncate">
            {isListening ? "PowerBot đang nghe..." : lastCommand}
          </span>
        </div>
      )}
      <div className="relative">
        <Button 
          ref={micButtonRef}
          variant={isListening ? "destructive" : "default"} 
          size="icon" 
          onClick={isListening ? stopListening : startListening}
          className={`${isProcessing ? buttonVariants.processing : (isListening ? buttonVariants.listening : buttonVariants.default)} 
            relative group`}
        >
          {isListening ? (
            <MicOff className="h-20 w-12" />
          ) : (
            <Mic className="h-12 w-12" />
          )}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute -top-3 -right-3 bg-white rounded-full p-2 hover:bg-gray-100 shadow-md border-2 border-gray-200"
            >
              <HelpCircle className="h-6 w-6 text-gray-600" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Điều khiển bằng giọng nói</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Cách sử dụng</h3>
                <ul className="list-disc pl-5 space-y-2 text-base">
                  <li>Nhấn nút <Mic className="inline-block h-5 w-5 mx-1 text-blue-600" /> để bắt đầu</li>
                  <li>Nói tên thiết bị và trạng thái mong muốn</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Ví dụ</h3>
                <div className="space-y-2">
                  <Badge className="text-base px-3 py-1 bg-[#123458]">
                    "Bật đèn phòng khách"
                  </Badge>
                  <Badge className="text-base px-3 py-1 ml-2 bg-[#123458]">
                    "Tắt quạt tầng 2"
                  </Badge>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Lưu ý</h3>
                <p className="text-base text-gray-700">
                  Nói rõ ràng và chính xác tên thiết bị. 
                  Hệ thống hỗ trợ tiếng Việt có dấu.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VoiceMicro;