import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useEffect, useRef } from "react";

interface AdvancedSearchProps {
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  showAdvanced,
  setShowAdvanced,
}) => {
  const advancedPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAdvanced && advancedPanelRef.current) {
      advancedPanelRef.current.style.transform = "translateX(100%)";
      setTimeout(() => {
        if (advancedPanelRef.current) {
          advancedPanelRef.current.style.transform = "translateX(0)";
        }
      }, 10);
    }
  }, [showAdvanced]);

  const techOptions = [
    "Phát triển Phần mềm",
    "Khoa học Dữ liệu và AI",
    "An ninh mạng",
    "Quản trị Hệ thống và Mạng",
    "Phát triển Web",
    "DevOps và Quản lý Hạ tầng",
    "Kiểm thử Phần mềm",
    "Phân tích và Tư vấn Kinh doanh",
    "Quản lý Dự án",
    "Thiết kế Trải nghiệm và Giao diện",
    "Thực tế ảo và Tăng cường",
    "IoT và Kỹ thuật Điều khiển",
  ];

  return (
    <>
      {showAdvanced && (
        <div className="fixed inset-0 bg-transparent z-40 flex items-center justify-center">
          <div
            ref={advancedPanelRef}
            className="relative bg-white rounded-xl shadow-xl w-[1200px] max-w-[95%] transition-transform duration-300 ease-out z-50"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold">Tìm kiếm nâng cao</h3>
                <Button
                  variant="ghost"
                  className="rounded-full h-12 w-12 p-0 hover:bg-gray-100"
                  onClick={() => setShowAdvanced(false)}
                >
                  <svg
                    width="28"
                    height="28"
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

              <div className="mb-8">
                <div className="flex items-center space-x-6 mb-6">
                  <label className="text-xl font-bold whitespace-nowrap">
                    Triệu chứng:
                  </label>
                  <Input
                    type="text"
                    placeholder="Danh sách triệu chứng"
                    className="flex-1 rounded-full py-3 px-6 text-lg"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {techOptions.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <input
                          type="checkbox"
                          id={`option-${index}`}
                          className="h-6 w-6 rounded"
                        />
                      </div>
                      <label
                        htmlFor={`option-${index}`}
                        className="ml-3 text-base font-medium text-gray-800"
                      >
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-10">
                <Button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-8 py-3 rounded-lg text-lg"
                  onClick={() => setShowAdvanced(false)}
                >
                  Đóng
                </Button>
                <Button className="bg-[#70D3FA] text-white hover:bg-blue-500 rounded-lg w-12 h-12 flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdvancedSearch;
