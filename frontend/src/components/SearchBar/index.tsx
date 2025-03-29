import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AdvancedSearch from "@/components/AdvancedSearch";

// Cập nhật danh sách locations dựa trên địa chỉ thực tế của bác sĩ
const locations = [
  "Tất cả",
  "Quận 1",
  "Quận 3",
  "Quận 5",
  "Quận 10",
  "Bệnh viện Chợ Rẫy",
  "Bệnh viện Từ Dũ",
  "Bệnh viện Y học Cổ truyền",
  "Bệnh viện Nhi Đồng 1",
  "Bệnh viện Đại học Y Dược",
];

// Thêm options sắp xếp
const sortOptions = [
  { value: "rating-desc", label: "Đánh giá cao nhất" },
  { value: "rating-asc", label: "Đánh giá thấp nhất" },
  { value: "reviews-desc", label: "Lượt đánh giá nhiều nhất" },
  { value: "reviews-asc", label: "Lượt đánh giá ít nhất" },
];

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  location: string;
  setLocation: (location: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onSearch: () => void;
  onSearchResults: (results: any[]) => void;
}

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  location,
  setLocation,
  sortBy,
  setSortBy,
  onSearch,
  onSearchResults
}: SearchBarProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      {/* Hàng 1: Tìm kiếm cơ bản */}
      <div className="flex items-center gap-4">
        <Button
          className="bg-[#70D3FA] text-white hover:bg-blue-500 whitespace-nowrap"
          onClick={() => setShowAdvanced(true)}
        >
          Tìm kiếm nâng cao
        </Button>
        <Input
          type="text"
          placeholder="Tìm kiếm theo tên bác sĩ, chuyên khoa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Button onClick={onSearch}>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </Button>
      </div>

      {/* Hàng 2: Bộ lọc và sắp xếp */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Địa điểm:</span>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn địa điểm" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-600">Sắp xếp:</span>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Chọn cách sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <AdvancedSearch
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
        onSearchResults={onSearchResults}
      />
    </div>
  );
};

export default SearchBar;
