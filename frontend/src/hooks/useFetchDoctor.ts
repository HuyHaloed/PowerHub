import { blogs } from "@/data/blogs";
import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";


const fetchBlogs = async (id: string) => {
  try {
    const response = await authorizedAxiosInstance.get<any>(
      "/api/blog/" + id,
    );
    return response.data.result;
  } catch (error) {
    const fakeDoctor = blogs.find((blog) => blog.id === id);
    if (!fakeDoctor) {
      throw new Error("blogs not found");
    }
    return fakeDoctor;
  }
};
export const useFetchBlog = (id: string) => {
  return useQuery({
    queryKey: ["blogs", id],
    queryFn: () => fetchBlogs(id),
    initialData: blogs.find((blog) => blog.id === id),
    retry: 1, 
  });
};
