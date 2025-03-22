import React, { useState } from "react";
import TutorList from "@/components/TutorList";
import SearchBar from "@/components/SearchBar";

function DoctorSearchPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [location, setLocation] = useState("Địa điểm");

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Thanh tìm kiếm và bộ lọc */}
                <SearchBar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    location={location}
                    setLocation={setLocation}
                />
                {/* Danh sách giáo viên */}
                <TutorList searchTerm={searchTerm} location={location} />
            </div>
        </div>
    );
}

export default DoctorSearchPage;