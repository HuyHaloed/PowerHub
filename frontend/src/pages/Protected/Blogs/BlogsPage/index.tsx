import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BlogCard } from "@/components/Blog/BlogCard";
import { useFetchAllBlogs } from "@/hooks/useFetchBlog";
import { toast } from "react-toastify";

export function BlogsPage() {
  const navigate = useNavigate();
  const [questionInput, setQuestionInput] = useState("");
  const { data: blogs, isLoading } = useFetchAllBlogs();

  const featuredPost = blogs?.[0] || { id: '', title: 'Loading...', category: '', date: '', image: '', excerpt: '' };
  const highlightedPost = blogs?.[1] || { id: '', title: 'Loading...', category: '', date: '', image: '', excerpt: '' };
  const restOfPosts = blogs?.slice(2) || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionInput.trim()) {
      toast.success("Cảm ơn bạn đã gửi blog. Chúng tôi sẽ xem xét và phản hồi sớm nhất!");
      setQuestionInput("");
    } else {
      toast.error("Vui lòng nhập nội dung trước khi gửi");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full flex">
        <div className="w-1/3 bg-[var(--primary-ground)] text-white p-12 flex flex-col justify-between min-h-screen">
          <div className="space-y-6">
            <div>
              <div className="text-lg font-medium">
                BLOG NỔI BẬT:
              </div>
              <div className="mt-12">
                <div className="text-7xl font-bold">POWER HUB</div>
                <div className="text-7xl font-bold">Daily BLOGS</div>
              </div>
              <div className="mt-8 text-xl">
                Những bài đăng được cung cấp từ các khách hàng đồng hành cùng Power Hub
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-2xl font-bold">HÃY NÓI CHÚNG TÔI NGHE ĐIỀU BẠN MUỐN NÓI</div>
            <div className="text-xl">Gửi đi Blog của tôi</div>
            
            <div className="pt-4">
              <Textarea
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                className="w-full h-24 border border-white bg-transparent p-2 text-white resize-none"
                placeholder="Nhập nội dung blog của bạn tại đây..."
              />
              
              <Button 
                onClick={handleSubmit}
                variant="outline"
                className="w-full mt-4 h-12 border border-white text-black hover:bg-white hover:text-[var(--primary-ground)] transition-colors"
              >
                Gửi
              </Button>
            </div>
          </div>
        </div>

        <div className="w-2/3 bg-gray-100">
          <div className="flex justify-between items-center px-6 py-4 bg-white border-b">
            <Button variant="ghost" className="text-2xl h-10 w-10 p-0 rounded-full">&lt;</Button>
            <div className="text-center text-lg font-medium">{featuredPost.title}</div>
            <Button variant="ghost" className="text-2xl h-10 w-10 p-0 rounded-full">&gt;</Button>
          </div>
          
          {isLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-ground)]"></div>
            </div>
          ) : (
            <>
              {/* Featured post */}
              <BlogCard blog={highlightedPost} variant="large" />

              {/* Grid posts */}
              <div className="grid grid-cols-2 gap-6 p-6">
                {restOfPosts.slice(0, 2).map((post) => (
                  <BlogCard key={post.id} blog={post} variant="grid" />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="py-12 bg-white">
        <div className="flex items-center justify-center mb-12">
          <Separator className="w-24 bg-[var(--primary-ground)] h-px" />
          <h2 className="text-3xl font-bold text-[var(--primary-ground)] text-center px-6">THE NEWEST</h2>
          <Separator className="w-24 bg-[var(--primary-ground)] h-px" />
        </div>
        
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-ground)]"></div>
            </div>
          ) : (
            restOfPosts.slice(2).map((post) => (
              <BlogCard key={post.id} blog={post} variant="small" />
            ))
          )}
        </div>
      </div>

      {/* Social media links */}
      <div className="fixed right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
        <a href="#" className="text-gray-800 hover:text-gray-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path></svg>
        </a>
        <a href="#" className="text-gray-800 hover:text-gray-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path></svg>
        </a>
        <a href="#" className="text-gray-800 hover:text-gray-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"></path></svg>
        </a>
        <a href="#" className="text-gray-800 hover:text-gray-600">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path></svg>
        </a>
      </div>
    </div>
  );
}

export default BlogsPage;