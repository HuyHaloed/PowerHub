import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFetchBlog, useFetchAllBlogs } from "@/hooks/useFetchBlog";
import BlogDetailComponent from "@/components/Blog/BlogDetail";
import { Blog } from "@/types/blog.types";
import { Button } from "@/components/ui/button";
import { blogs } from "@/data/blogs"; // Import the local blogs data directly

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // First try to get the blog from local data directly to avoid issues with API call
  const blogFromLocalData = id ? blogs.find(blog => blog.id.toString() === id.toString()) : null;
  
  // Still use the hook for consistency in the rest of the app
  const { data: blogFromAPI, isLoading } = useFetchBlog(id || "1");
  const { data: allBlogs = blogs } = useFetchAllBlogs();
  
  // Use the blog from local data if API fails
  const blog = blogFromAPI || blogFromLocalData;
  
  const [relatedPosts, setRelatedPosts] = useState<Blog[]>([]);

  // Find related posts based on category
  useEffect(() => {
    if (blog && allBlogs) {
      // Find posts with the same category, excluding the current post
      const sameCategoryPosts = allBlogs.filter(
        (post) => post.category === blog.category && post.id.toString() !== blog.id.toString()
      );
      
      // If we have less than 2 posts with the same category, add some random posts
      let related = [...sameCategoryPosts];
      
      if (related.length < 2) {
        const otherPosts = allBlogs.filter(
          (post) => post.id.toString() !== blog.id.toString() && 
                   !sameCategoryPosts.some(p => p.id.toString() === post.id.toString())
        );
        
        // Slice to get enough posts to have 2 total
        const randomPosts = otherPosts.slice(0, 2 - related.length);
        related = [...related, ...randomPosts];
      } else {
        // Limit to 2 related posts
        related = related.slice(0, 2);
      }
      
      setRelatedPosts(related);
    }
  }, [blog, allBlogs]);

  // Debug logging (remove in production)
  useEffect(() => {
    console.log("URL ID parameter:", id);
    console.log("Blog from local data:", blogFromLocalData);
    console.log("Blog from API:", blogFromAPI);
    console.log("Final blog used:", blog);
  }, [id, blogFromLocalData, blogFromAPI, blog]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-ground)]"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Blog không tồn tại</h2>
          <p className="text-gray-600 mt-2">ID: {id}</p>
          <p className="text-gray-600 mt-2">Có {blogs.length} blog trong cơ sở dữ liệu</p>
          <Button 
            className="mt-4 bg-[var(--primary-ground)] text-white" 
            onClick={() => navigate("/blogs")}
          >
            Quay lại danh sách blog
          </Button>
        </div>
      </div>
    );
  }

  return <BlogDetailComponent blog={blog} relatedPosts={relatedPosts} />;
};

export default BlogDetailPage;