import { tutors } from "@/data/doctors";
import { useQuery } from "@tanstack/react-query";

// Function to fetch tutors from the API
const fetchTutors = async (id: number) => {
  const response = await fetch(`https://api.example.com/tutor/${id}`); // Replace with your API endpoint
  if (!response.ok) {
    throw new Error("Failed to fetch tutors");
  }
  return response.json();
};

// Custom hook to fetch tutors using useQuery
export const useFetchDoctor = (id: number) => {
  return useQuery({
    queryKey: ["tutors", id],
    queryFn: () => fetchTutors(id),
    // Use initialData as fallback if the query fails or while loading
    initialData: tutors.find((tutor) => tutor.id === id),
    // Optionally, you can configure retry behavior
    retry: 1, // Retry once before falling back
  });
};
