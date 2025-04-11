import { Blog } from "@/types/blog.types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

interface BlogDetailProps {
  blog: Blog;
  relatedPosts?: Blog[];
}

const BlogDetail = ({ blog, relatedPosts = [] }: BlogDetailProps) => {
  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Blog không tồn tại</h2>
          <Link to="/blogs">
            <Button className="mt-4 bg-[var(--primary-ground)] text-white">Quay lại danh sách blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-[var(--primary-ground)] text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{blog.title}</h1>
          <div className="flex items-center space-x-4 text-sm">
            <span>Tác giả: {blog.author || "Power Hub Team"}</span>
            <Separator orientation="vertical" className="h-4 bg-white/30" />
            <span>Ngày đăng: {blog.date ? new Date(blog.date).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Article Content - 2/3 width on large screens */}
          <div className="lg:col-span-2">
            <article className="prose prose-lg max-w-none">
              {/* If there's a leading image, display it */}
              {blog.image && (
                <img 
                  src={blog.image} 
                  alt={blog.title} 
                  className="w-full h-80 object-cover rounded-lg mb-8"
                />
              )}
              
              {/* Break the content into paragraphs */}
              {blog.content?.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </article>

            {/* Share section */}
            <div className="mt-12 border-t border-gray-200 pt-6">
              <h3 className="text-xl font-semibold mb-4">Chia sẻ bài viết</h3>
              <div className="flex space-x-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"></path>
                  </svg>
                  <span>Facebook</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                  <span>Twitter</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"></path>
                  </svg>
                  <span>YouTube</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar - 1/3 width on large screens */}
          <div className="lg:col-span-1">
            {/* Author info */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8">
              <h3 className="text-xl font-semibold mb-4">Về tác giả</h3>
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--primary-ground)] flex items-center justify-center text-white">
                  <span className="text-xl font-bold">{(blog.author || "Power Hub").charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium">{blog.author || "Power Hub Team"}</p>
                  <p className="text-sm text-gray-500">Chuyên gia công nghệ</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm">
                Chúng tôi luôn tìm kiếm và chia sẻ những thông tin mới nhất về công nghệ và xu hướng 
                trong lĩnh vực năng lượng.
              </p>
            </div>

            {/* Related articles */}
            {relatedPosts.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Bài viết liên quan</h3>
                <div className="space-y-6">
                  {relatedPosts.map((post) => (
                    <div key={post.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <h4 className="font-medium hover:text-[var(--primary-ground)] transition-colors">
                        <Link to={`/blog/${post.id}`}>{post.title}</Link>
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
                      <p className="text-xs text-gray-400 mt-2">{post.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags cloud */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                <Link to="/blogs?tag=power-hub">
                  <span className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm">Power Hub</span>
                </Link>
                <Link to="/blogs?tag=energy">
                  <span className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm">Năng lượng</span>
                </Link>
                <Link to="/blogs?tag=technology">
                  <span className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm">Công nghệ</span>
                </Link>
                <Link to="/blogs?tag=app">
                  <span className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm">Ứng dụng</span>
                </Link>
                <Link to="/blogs?tag=devices">
                  <span className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm">Thiết bị</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call-to-action section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Khám phá thêm về Power Hub</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Hãy sử dụng Power Hub giúp bạn kiểm soát và quản lý năng lượng của gia đình của bạn một cách dễ dàng.
          </p>
          <div className="flex justify-center">
            <Link to="/blogs">
              <Button className="bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/90 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Trở về trang Blog
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;