import { useQuery } from "@tanstack/react-query";
import { tutors } from "@/data/doctors";
import authorizedAxiosInstance from "@/lib/axios";

// Function to fetch tutors from the API
const fetchTutors = async () => {
  const response = await authorizedAxiosInstance.get<any>("/api/doctors");
  return response.data.result;
};

// Custom hook to fetch tutors using useQuery
const useFetchDoctors = () => {
  return useQuery({
    queryKey: ["tutors"],
    queryFn: fetchTutors,
    // Use initialData as fallback if the query fails or while loading
    initialData: tutors,
    // Optionally, you can configure retry behavior
    retry: 1, // Retry once before falling back
  });
};

export default useFetchDoctors;
