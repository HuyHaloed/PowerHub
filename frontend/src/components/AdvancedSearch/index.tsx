import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useRef, useState } from "react";
import { useSearchDoctorBySymptoms } from "@/hooks/useSearchDoctorBySymptoms";
import { toast } from "react-toastify";

interface AdvancedSearchProps {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  onSearchResults: (doctors: any[]) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  showAdvanced,
  setShowAdvanced,
  onSearchResults
}) => {
  const advancedPanelRef = useRef<HTMLDivElement>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");

  // Danh sách triệu chứng phổ biến
  const commonSymptoms = [
    "Đau đầu",
    "Sốt",
    "Ho",
    "Đau bụng",
    "Mệt mỏi",
    "Khó thở",
    "Đau cơ",
    "Chóng mặt",
    "Buồn nôn",
    "Phát ban",
    "Đau họng",
    "Sổ mũi"
  ];

  const { data: doctors, refetch } = useSearchDoctorBySymptoms(selectedSymptoms);

  useEffect(() => {
    if (doctors) {
      onSearchResults(doctors);
    }
  }, [doctors]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleAddCustomSymptom = () => {
    if (customSymptom.trim()) {
      if (!selectedSymptoms.includes(customSymptom.trim())) {
        setSelectedSymptoms(prev => [...prev, customSymptom.trim()]);
        setCustomSymptom("");
      } else {
        toast.warning("Triệu chứng này đã được thêm!");
      }
    }
  };

  const handleSearch = async () => {
    if (selectedSymptoms.length === 0) {
      toast.error("Vui lòng chọn ít nhất một triệu chứng!");
      return;
    }
    await refetch();
    setShowAdvanced(false);
  };

  return (
    <>
      {showAdvanced && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center overflow-y-auto">
          <div className="min-h-screen w-full flex items-center justify-center p-4">
            <div
              ref={advancedPanelRef}
              className="relative bg-white rounded-2xl shadow-2xl w-[1200px] max-w-[95%] my-8"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 sticky top-0 z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">Tìm kiếm theo triệu chứng</h3>
                  <Button
                    variant="ghost"
                    className="rounded-full h-12 w-12 p-0 hover:bg-white/20 text-white"
                    onClick={() => setShowAdvanced(false)}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="space-y-6">
                  {/* Custom Symptom Input */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700">Thêm triệu chứng mới</h4>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="text"
                        value={customSymptom}
                        onChange={(e) => setCustomSymptom(e.target.value)}
                        placeholder="Nhập triệu chứng của bạn..."
                        className="flex-1 rounded-lg py-2 border-2 focus:border-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCustomSymptom();
                          }
                        }}
                      />
                      <Button
                        onClick={handleAddCustomSymptom}
                        className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-2 rounded-lg transition-colors"
                      >
                        Thêm
                      </Button>
                    </div>
                  </div>

                  {/* Common Symptoms */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <h4 className="text-lg font-semibold mb-4 text-gray-700">Triệu chứng phổ biến</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {commonSymptoms.map((symptom, index) => {
                        const isSelected = selectedSymptoms.includes(symptom);
                        return (
                          <div
                            key={index}
                            onClick={() => handleSymptomToggle(symptom)}
                            className={`
                              cursor-pointer rounded-lg p-3 transition-all duration-200
                              flex items-center justify-between
                              ${isSelected 
                                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                : 'bg-white hover:bg-gray-100'
                              }
                            `}
                          >
                            <span className="text-sm font-medium">{symptom}</span>
                            {isSelected && (
                              <svg 
                                className="w-4 h-4 flex-shrink-0 ml-2" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth="2" 
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Symptoms */}
                  {selectedSymptoms.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-xl">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800 flex items-center justify-between">
                        <span>Triệu chứng đã chọn</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {selectedSymptoms.length} triệu chứng
                        </span>
                      </h4>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2 pr-2">
                          {selectedSymptoms.map((symptom, index) => (
                            <div
                              key={index}
                              className="group bg-white text-blue-700 px-4 py-2 rounded-full 
                                       flex items-center gap-2 shadow-sm hover:shadow-md 
                                       transition-all duration-200"
                            >
                              <span className="text-sm">{symptom}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSymptomToggle(symptom);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity 
                                         duration-200 hover:bg-blue-100 rounded-full p-1"
                              >
                                <svg 
                                  className="w-3 h-3 text-blue-600" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                >
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-between mt-8 pt-6 border-t sticky bottom-0 bg-white">
                  <Button
                    onClick={() => setShowAdvanced(false)}
                    variant="outline"
                    className="px-6"
                  >
                    Đóng
                  </Button>
                  <Button
                    onClick={handleSearch}
                    className="px-8 bg-blue-500 hover:bg-blue-600 text-white"
                    disabled={selectedSymptoms.length === 0}
                  >
                    Tìm kiếm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdvancedSearch;
