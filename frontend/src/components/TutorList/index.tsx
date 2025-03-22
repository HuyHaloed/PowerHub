import React, { useState } from "react";
import TutorCard from "../TutorCard";
import { Button } from "../ui/button";

const TutorList = ({ searchTerm, location } : any) => {
  const [currentPage, setCurrentPage] = useState(1);
  const tutorsPerPage = 4;

  // Dữ liệu giả lập
  const tutors = [
    {
      name: "PSG.TS Ngô Triều Dương",
      rating: "4.6",
      reviews: 413,
      specialty: "Y học cổ truyền",
      location: "Bệnh viện Quận khu 7",
      isFeatured: false,
    },
    {
      name: "PSG.TS Ngô Triều Dương",
      rating: "4.8",
      reviews: 413,
      specialty: "Y học cổ truyền",
      location: "Bệnh viện Quận khu 7",
      isFeatured: true,
    },
    {
      name: "PSG.TS Ngô Triều Dương",
      rating: "4.7",
      reviews: 413,
      specialty: "Y học cổ truyền",
      location: "Bệnh viện Quận khu 7",
      isFeatured: false,
    },
    {
      name: "PSG.TS Ngô Triều Dương",
      rating: "4.8",
      reviews: 413,
      specialty: "Y học cổ truyền",
      location: "Bệnh viện Quận khu 7",
      isFeatured: false,
    },
    {
      name: "PSG.TS Ngô Triều Dương",
      rating: "4.6",
      reviews: 413,
      specialty: "Y học cổ truyền",
      location: "Bệnh viện Quận khu 7",
      isFeatured: false,
    },
    {
      name: "PSG.TS Ngô Triều Dương",
      rating: "4.8",
      reviews: 413,
      specialty: "Y học cổ truyền",
      location: "Bệnh viện Quận khu 7",
      isFeatured: false,
    },
  ];

  // Lọc dữ liệu dựa trên tìm kiếm và địa điểm
  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch = tutor.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesLocation =
      location === "Địa điểm" || tutor.location === location;
    return matchesSearch && matchesLocation;
  });

  // Phân trang
  const indexOfLastTutor = currentPage * tutorsPerPage;
  const indexOfFirstTutor = indexOfLastTutor - tutorsPerPage;
  const currentTutors = filteredTutors.slice(indexOfFirstTutor, indexOfLastTutor);
  const totalPages = Math.ceil(filteredTutors.length / tutorsPerPage);

  return (
    <div>
      {/* Danh sách giáo viên */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {currentTutors.map((tutor, index) => (
          <TutorCard key={index} tutor={tutor} />
        ))}
      </div>
      {/* Phân trang */}
      <div className="flex justify-center items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            ></path>
          </svg>
        </Button>
        {[...Array(totalPages)].map((_, index) => (
          <Button
            key={index}
            variant={currentPage === index + 1 ? "default" : "outline"}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </Button>
        ))}
        <Button
          variant="outline"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default TutorList;