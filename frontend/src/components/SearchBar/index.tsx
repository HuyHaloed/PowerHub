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

const SearchBar = ({
  searchTerm,
  setSearchTerm,
  location,
  setLocation,
}: any) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="mb-6">
      <div className="flex items-center space-x-4 mb-4">
        <Button
          className="bg-[#70D3FA] text-white hover:bg-blue-500 px-4 py-2 rounded-lg whitespace-nowrap"
          onClick={() => setShowAdvanced(true)}
        >
          Tìm kiếm nâng cao
        </Button>
        <Input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={location} onValueChange={setLocation}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Địa điểm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Địa điểm">Địa điểm</SelectItem>
            <SelectItem value="Bệnh viện Quận khu 7">
              Bệnh viện Quận khu 7
            </SelectItem>
            <SelectItem value="Quận 1">Quận 1</SelectItem>
            <SelectItem value="Quận 3">Quận 3</SelectItem>
          </SelectContent>
        </Select>
        <Button>
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </Button>
      </div>

      <AdvancedSearch
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
      />
    </div>
  );
};

export default SearchBar;
