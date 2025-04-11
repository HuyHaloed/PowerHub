import { blogs } from "@/data/blogs";
import { Blog } from "@/types/blog.types";
import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";

// Function to fetch blogs from the API
const fetchBlog = async (id: string): Promise<Blog> => {
  try {
    // Try to fetch from API first
    const response = await authorizedAxiosInstance.get<{ result: Blog }>(
      `/api/blog/${id}`,
    );
    return response.data.result;
  } catch (error) {
    // If API fails, fall back to local data
    const localBlog = blogs.find((blog) => blog.id.toString() === id);
    if (!localBlog) {
      throw new Error("Blog not found");
    }
    return localBlog;
  }
};

// Custom hook to fetch a blog using useQuery
export const useFetchBlog = (id: string) => {
  return useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlog(id),
    initialData: blogs.find((blog) => blog.id.toString() === id),
    retry: 1, // Only retry once before falling back to local data
  });
};

// Function to fetch all blogs
const fetchAllBlogs = async (): Promise<Blog[]> => {
  try {
    // Try to fetch from API first
    const response = await authorizedAxiosInstance.get<{ result: Blog[] }>(
      "/api/blogs",
    );
    return response.data.result;
  } catch (error) {
    // If API fails, fall back to local data
    return blogs;
  }
};

// Custom hook to fetch all blogs using useQuery
export const useFetchAllBlogs = () => {
  return useQuery({
    queryKey: ["blogs"],
    queryFn: fetchAllBlogs,
    initialData: blogs,
    retry: 1,
  });
};