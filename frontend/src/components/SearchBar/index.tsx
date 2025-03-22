import { Input } from "../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

const SearchBar = ({ searchTerm, setSearchTerm, location, setLocation } : any) => {
    return (
        <div className="flex items-center space-x-4 mb-6">
            {/* Thanh tìm kiếm */}
            <Input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
            />
            {/* Bộ lọc địa điểm */}
            <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Địa điểm" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Địa điểm">Địa điểm</SelectItem>
                    <SelectItem value="Bến viền Quận khu 7">Bến viền Quận khu 7</SelectItem>
                    <SelectItem value="Quận 1">Quận 1</SelectItem>
                    <SelectItem value="Quận 3">Quận 3</SelectItem>
                </SelectContent>
            </Select>
            {/* Nút tìm kiếm */}
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
    );
};

export default SearchBar;