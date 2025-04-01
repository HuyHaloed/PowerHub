import { blogs } from "@/data/blogs";
import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";

// Function to fetch tutors from the API
const fetchBlogs = async (id: string) => {
  try {
    const response = await authorizedAxiosInstance.get<any>(
      "/api/blog/" + id,
    );
    return response.data.result;
  } catch (error) {
    // Khi có lỗi, trả về fake data
    const fakeDoctor = blogs.find((blog) => blog.id === id);
    if (!fakeDoctor) {
      throw new Error("blogs not found");
    }
    return fakeDoctor;
  }
};

// Custom hook to fetch tutors using useQuery
export const useFetchBlog = (id: string) => {
  return useQuery({
    queryKey: ["blogs", id],
    queryFn: () => fetchBlogs(id),
    // Use initialData as fallback if the query fails or while loading
    initialData: blogs.find((blog) => blog.id === id),
    // Optionally, you can configure retry behavior
    retry: 1, // Retry once before falling back
  });
};
