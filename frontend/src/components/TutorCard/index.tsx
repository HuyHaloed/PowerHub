import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { paths } from "@/utils/path";

const TutorCard = ({ tutor }: any) => {
  return (
    <Card className="relative flex flex-col items-center">
      <CardHeader className="w-full">
        {/* Hình ảnh giáo viên (placeholder) */}
        <Avatar className="w-20 h-20 mx-auto">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </CardHeader>
      <CardContent className="text-center">
        {/* Đánh giá */}
        <div className="flex items-center justify-center mb-2">
          <span className="text-yellow-500">★</span>
          <span className="ml-1 text-gray-600">
            {tutor.rating} ({tutor.reviews} reviews)
          </span>
        </div>
        {/* Thông tin giáo viên */}
        <h3 className="text-lg font-semibold">{tutor.name}</h3>
        <p className="text-gray-500">{tutor.specialty}</p>
        <p className="text-gray-500">{tutor.address}</p>
      </CardContent>
      <CardFooter className="w-full flex justify-between items-center">
        {/* Nút đặt lịch */}
        <Link to={`${paths.Booking}/${tutor.id}`}>
          <Button className="absolute top-4 right-4">Đặt lịch khám</Button>
        </Link>
        {/* Nhãn nổi bật (nếu có) */}
        {tutor.isFeatured && (
          <span className="bg-green-500 text-white px-2 py-1 rounded-lg text-sm">
            Xuất sắc
          </span>
        )}
      </CardFooter>
    </Card>
  );
};

export default TutorCard;
