import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";
import { tutors } from "@/data/doctors";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  specializedTreatment: string;
  symptoms: string[];
  rating: string;
  reviews: number;
  schedule: string;
  hospital: string;
  room: string;
  address: string;
  avatar: string;
}

const searchDoctorsBySymptoms = async (symptoms: string[]): Promise<Doctor[]> => {
  try {
    const response = await authorizedAxiosInstance.post("/doctors/search", {
      symptoms
    });
    return response.data;
  } catch (error) {
    // Nếu API fail, tìm trong fake data
    return tutors.filter(doctor => 
      symptoms.some(symptom => 
        doctor.symptoms.some(docSymptom => 
          docSymptom.toLowerCase().includes(symptom.toLowerCase())
        ) ||
        doctor.specialty.toLowerCase().includes(symptom.toLowerCase()) ||
        doctor.specializedTreatment.toLowerCase().includes(symptom.toLowerCase())
      )
    );
  }
};

// Hook để quản lý thông tin user
export const useSearchDoctorBySymptoms = (symptoms: string[]) => {
  return useQuery({
    queryKey: ["doctors", "symptoms", symptoms],
    queryFn: () => searchDoctorsBySymptoms(symptoms),
    enabled: symptoms.length > 0,
    staleTime: 5 * 60 * 1000, // Cache trong 5 phút
  });
};
