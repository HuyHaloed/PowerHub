import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "../ui/card";
import { Button } from "../ui/button";

const TutorCard = ({ tutor } : any) => {
  return (
    <Card className="relative flex flex-col items-center">
      <CardHeader>
        {/* Hình ảnh giáo viên (placeholder) */}
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto"></div>
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
        <p className="text-gray-500">{tutor.location}</p>
      </CardContent>
      <CardFooter className="w-full flex justify-between items-center">
        {/* Nút đặt lịch */}
        <Button className="absolute top-4 right-4">Đặt lịch khám</Button>
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