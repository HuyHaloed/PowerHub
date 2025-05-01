import { blogs } from "@/data/blogs";
import { Blog } from "@/types/blog.types";
import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";

const fetchBlog = async (id: string): Promise<Blog> => {
  try {
    const response = await authorizedAxiosInstance.get<{ result: Blog }>(
      `/api/blog/${id}`,
    );
    return response.data.result;
  } catch (error) {
    const localBlog = blogs.find((blog) => blog.id.toString() === id);
    if (!localBlog) {
      throw new Error("Blog not found");
    }
    return localBlog;
  }
};

export const useFetchBlog = (id: string) => {
  return useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlog(id),
    initialData: blogs.find((blog) => blog.id.toString() === id),
    retry: 1,
  });
};

const fetchAllBlogs = async (): Promise<Blog[]> => {
  try {
    const response = await authorizedAxiosInstance.get<{ result: Blog[] }>(
      "/api/blogs",
    );
    return response.data.result;
  } catch (error) {
    return blogs;
  }
};

export const useFetchAllBlogs = () => {
  return useQuery({
    queryKey: ["blogs"],
    queryFn: fetchAllBlogs,
    initialData: blogs,
    retry: 1,
  });
};