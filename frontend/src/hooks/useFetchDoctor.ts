import { tutors } from "@/data/doctors";
import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";

// Function to fetch tutors from the API
const fetchTutors = async (id: string) => {
  try {
    const response = await authorizedAxiosInstance.get<any>("/api/doctors/" + id);
    return response.data.result;
  } catch (error) {
    // Khi có lỗi, trả về fake data
    const fakeDoctor = tutors.find((tutor) => tutor.id === id);
    if (!fakeDoctor) {
      throw new Error("Doctor not found");
    }
    return fakeDoctor;
  }
};

// Custom hook to fetch tutors using useQuery
export const useFetchDoctor = (id: string) => {
  return useQuery({
    queryKey: ["tutors", id],
    queryFn: () => fetchTutors(id),
    // Use initialData as fallback if the query fails or while loading
    initialData: tutors.find((tutor) => tutor.id === id),
    // Optionally, you can configure retry behavior
    retry: 1, // Retry once before falling back
  });
};
