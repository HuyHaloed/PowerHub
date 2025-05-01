import { useQuery } from "@tanstack/react-query";
import { tutors } from "@/data/doctors";
import authorizedAxiosInstance from "@/lib/axios";

const fetchTutors = async () => {
  const response = await authorizedAxiosInstance.get<any>("/api/doctors");
  return response.data.result;
};

const useFetchDoctors = () => {
  return useQuery({
    queryKey: ["tutors"],
    queryFn: fetchTutors,

    initialData: tutors,

    retry: 1, 
  });
};

export default useFetchDoctors;
