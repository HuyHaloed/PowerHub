import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BlogCardProps } from "@/types/blog.types";
import { useNavigate } from "react-router-dom";

export const BlogCard = ({ blog, variant = "small" }: BlogCardProps) => {
  const navigate = useNavigate();

  const handleReadMore = () => {
    navigate(`/blog/${blog.id}`);
  };

  if (variant === "large") {
    return (
      <div 
        className="relative bg-cover bg-center h-96 flex items-end p-8" 
        style={{ backgroundImage: `url(${blog.image})` }}
      >
        <div className="space-y-4 z-10">
          <div className="flex space-x-4 items-center">
            <span className="bg-[var(--primary-ground)] text-white px-4 py-2 rounded-md">{blog.category}</span>
            <span className="text-white">{blog.date}</span>
          </div>
          <h2 className="text-4xl font-bold text-white">{blog.title}</h2>
          <p className="text-white">{blog.excerpt}</p>
          <Button 
            onClick={handleReadMore} 
            className="bg-white text-[var(--primary-ground)] hover:bg-gray-200 mt-2"
          >
            Xem thêm
          </Button>
        </div>
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div 
        className="bg-cover bg-center h-80 relative flex items-end p-6" 
        style={{ backgroundImage: `url(${blog.image})` }}
      >
        <div className="space-y-3 z-10">
          <div className="flex space-x-4 items-center">
            <span className="bg-[var(--primary-ground)] text-white px-3 py-1 rounded-md text-sm">{blog.category}</span>
            <span className="text-white text-sm">{blog.date}</span>
          </div>
          <h3 className="text-2xl font-bold text-white">{blog.title}</h3>
          <p className="text-white text-sm">{blog.excerpt}</p>
          <Button 
            onClick={handleReadMore} 
            className="bg-white text-[var(--primary-ground)] hover:bg-gray-200 mt-2 text-sm"
          >
            Xem thêm
          </Button>
        </div>
        <div className="absolute inset-0 bg-black opacity-40"></div>
      </div>
    );
  }

  // Default small card
  return (
    <Card className="p-6 grid grid-cols-4 gap-6 border-[var(--primary-ground)]/10 hover:shadow-md transition-shadow">
      <div className="col-span-1">
        <img src={blog.image} alt={blog.title} className="w-full h-36 object-cover rounded-md" />
      </div>
      <div className="col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex justify-between">
            <span className="text-gray-600">{blog.date}</span>
          </div>
          <h3 className="text-2xl font-bold mt-2">{blog.title}</h3>
          <p className="mt-3">{blog.excerpt}</p>
        </div>
        <Button 
          onClick={handleReadMore} 
          className="bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/80 text-white w-32 mt-4"
        >
          Xem thêm
        </Button>
      </div>
    </Card>
  );
};

export default BlogCard;