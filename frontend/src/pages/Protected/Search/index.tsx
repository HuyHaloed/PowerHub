import React, { useState, useEffect } from "react";
import TutorList from "@/components/TutorList";
import SearchBar from "@/components/SearchBar";
import { tutors } from "@/data/doctors";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import useFetchDoctors from "@/hooks/useFetchDoctors";

// Hàm chuyển đổi dữ liệu từ API sang định dạng mong muốn
const transformDoctorData = (apiData: any[]) => {
  if (!Array.isArray(apiData)) return [];

  return apiData
    .map((doctor) => {
      try {
        return {
          id: doctor?.id || Math.random().toString(),
          name: doctor?.user?.name || "Chưa cập nhật",
          rating: "4.7",
          reviews: Math.floor(Math.random() * (500 - 200 + 1)) + 200,
          specialty: doctor?.specialization || "Chưa cập nhật",
          specializedTreatment:
            `${doctor?.bio?.slice(0, 50)}...` || "Chưa cập nhật",
          symptoms: [],
          schedule: "Thứ 2 - Thứ 6, 8:00 - 17:00",
          overviews: doctor?.bio || "Chưa cập nhật",
          hospital: doctor?.hospital?.name || "Chưa cập nhật",
          room: `${String.fromCharCode(65 + Math.floor(Math.random() * 6))}-${Math.floor(Math.random() * 900) + 100}`,
          address: doctor?.hospital?.location || "Chưa cập nhật",
          isFeatured: doctor?.availableOnline || false,
          avatar: `https://ui.shadcn.com/avatars/0${Math.floor(Math.random() * 5) + 1}.png`,
        };
      } catch (error) {
        console.error("Error transforming doctor data:", error);
        return null;
      }
    })
    .filter(Boolean); // Lọc bỏ các giá trị null
};

function DoctorSearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("Tất cả");
  const [sortBy, setSortBy] = useState("rating-desc");
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xử lý kết quả tìm kiếm từ AdvancedSearch
  const handleSearchResults = (results: any[]) => {
    setDoctors(sortDoctors(results, sortBy));
    if (results.length === 0) {
      toast.info("Không tìm thấy bác sĩ phù hợp");
    }
  };

  // Hàm sắp xếp bác sĩ
  const sortDoctors = (doctorList: any[], sortType: string) => {
    const sorted = [...doctorList];
    switch (sortType) {
      case "rating-desc":
        return sorted.sort(
          (a, b) => parseFloat(b.rating) - parseFloat(a.rating),
        );
      case "rating-asc":
        return sorted.sort(
          (a, b) => parseFloat(a.rating) - parseFloat(b.rating),
        );
      case "reviews-desc":
        return sorted.sort((a, b) => b.reviews - a.reviews);
      case "reviews-asc":
        return sorted.sort((a, b) => a.reviews - b.reviews);
      default:
        return sorted;
    }
  };

  // Hàm lọc bác sĩ
  const filterDoctors = (doctorList: any[]) => {
    return doctorList.filter((doctor) => {
      const matchesSearch = searchTerm
        ? doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase())
        : true;

      const matchesLocation =
        location !== "Tất cả"
          ? doctor.address.toLowerCase().includes(location.toLowerCase()) ||
            doctor.hospital.toLowerCase().includes(location.toLowerCase())
          : true;

      return matchesSearch && matchesLocation;
    });
  };

  const { data } = useFetchDoctors();

  // useEffect chính để xử lý data khi component mount và khi data thay đổi
  useEffect(() => {
    const initializeDoctors = async () => {
      setIsLoading(true);
      try {
        if (data) {
          const transformedDoctors = transformDoctorData(data);
          const sortedDoctors = sortDoctors(transformedDoctors, sortBy);
          setDoctors(sortedDoctors);
        } else {
          // Fallback to local data if API fails
          setDoctors(sortDoctors(tutors, sortBy));
        }
      } catch (error) {
        console.error("Error initializing doctors:", error);
        toast.error("Có lỗi xảy ra khi tải dữ liệu");
        setDoctors(sortDoctors(tutors, sortBy)); // Fallback to local data
      } finally {
        setIsLoading(false);
      }
    };

    initializeDoctors();
  }, [data]); // Chỉ phụ thuộc vào data

  // Tách riêng useEffect cho việc sort
  useEffect(() => {
    if (doctors.length > 0) {
      setDoctors(sortDoctors(doctors, sortBy));
    }
  }, [sortBy]);

  // Sửa lại handleSearch để sử dụng data hiện tại
  const handleSearch = () => {
    setIsLoading(true);
    setTimeout(() => {
      const currentDoctors = data ? transformDoctorData(data) : tutors;
      const filteredDoctors = filterDoctors(currentDoctors);
      const sortedDoctors = sortDoctors(filteredDoctors, sortBy);
      setDoctors(sortedDoctors);
      setIsLoading(false);

      if (sortedDoctors.length === 0) {
        toast.info("Không tìm thấy bác sĩ phù hợp với tiêu chí tìm kiếm");
      }
    }, 300);
  };

  // Sửa lại handleReset để sử dụng data hiện tại
  const handleReset = () => {
    setSearchTerm("");
    setLocation("Tất cả");
    setSortBy("rating-desc");
    const currentDoctors = data ? transformDoctorData(data) : tutors;
    setDoctors(sortDoctors(currentDoctors, "rating-desc"));
    toast.success("Đã reset về danh sách mặc định");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      {/* <p>{JSON.stringify(data)}</p> */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white mb-2">
            Tìm kiếm bác sĩ
          </h1>
          <p className="text-blue-100">
            Tìm kiếm bác sĩ phù hợp với nhu cầu của bạn
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Bộ lọc tìm kiếm
            </h2>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </Button>
          </div>

          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            location={location}
            setLocation={setLocation}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSearch={handleSearch}
            onSearchResults={handleSearchResults}
          />
        </div>

        {/* Results Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-gray-600">
            Tìm thấy <span className="font-semibold">{doctors.length}</span> bác
            sĩ
          </div>
        </div>

        {/* Doctor List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <TutorList doctors={doctors} />
        )}
      </div>
    </div>
  );
}

export default DoctorSearchPage;
