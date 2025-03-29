import { useState } from "react";
import TutorCard from "../TutorCard";
import { Button } from "../ui/button";
import useFetchDoctors from "@/hooks/useFetchDoctors";
import type { Doctor } from "@/types/doctor";

interface TutorListProps {
  doctors: Doctor[];
}

const TutorList = ({ doctors }: TutorListProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tutorsPerPage = 6; // Số bác sĩ trên mỗi trang

  // Tính toán các chỉ số cho phân trang
  const indexOfLastTutor = currentPage * tutorsPerPage;
  const indexOfFirstTutor = indexOfLastTutor - tutorsPerPage;
  const currentDoctors = doctors.slice(indexOfFirstTutor, indexOfLastTutor);
  const totalPages = Math.ceil(doctors.length / tutorsPerPage);

  // Xử lý chuyển trang
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tạo mảng số trang để hiển thị
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Số trang hiển thị tối đa

    if (totalPages <= maxVisiblePages) {
      // Nếu tổng số trang ít hơn số trang hiển thị tối đa
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Nếu đang ở gần đầu
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
      // Nếu đang ở gần cuối
      else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      }
      // Nếu đang ở giữa
      else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="space-y-8">
      {/* Danh sách bác sĩ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentDoctors.map((doctor) => (
          <TutorCard key={doctor.id} tutor={doctor} />
        ))}
        
        {doctors.length === 0 && (
          <div className="col-span-full text-center py-10">
            <div className="text-gray-500 text-lg">
              Không tìm thấy bác sĩ phù hợp
            </div>
          </div>
        )}
      </div>

      {/* Phân trang */}
      {doctors.length > 0 && (
        <div className="flex flex-col items-center gap-4 mt-8">
          {/* Các nút điều hướng */}
          <div className="flex items-center gap-2">
            {/* Nút Previous */}
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-md border border-gray-200 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Button>

            {/* Các nút số trang */}
            <div className="flex items-center gap-2">
              {getPageNumbers().map((number, index) => (
                <Button
                  key={index}
                  onClick={() => typeof number === 'number' && handlePageChange(number)}
                  disabled={number === '...'}
                  variant={currentPage === number ? "default" : "outline"}
                  className={`w-9 h-9 p-0 text-sm font-medium rounded-md ${
                    number === '...' 
                      ? 'border-none hover:bg-transparent cursor-default'
                      : currentPage === number
                      ? 'bg-blue-500 text-white hover:bg-blue-600 border-blue-500'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {number}
                </Button>
              ))}
            </div>

            {/* Nút Next */}
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="icon"
              className="w-9 h-9 rounded-md border border-gray-200 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* Hiển thị thông tin trang */}
          <div className="text-sm text-gray-500">
            Hiển thị {indexOfFirstTutor + 1}-{Math.min(indexOfLastTutor, doctors.length)} 
            trong tổng số {doctors.length} bác sĩ
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorList;
