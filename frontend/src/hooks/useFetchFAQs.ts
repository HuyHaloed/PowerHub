import { faqs, faqCategories } from "@/data/faqs";
import { FAQ, FAQCategory } from "@/types/faq.types";
import { useQuery } from "@tanstack/react-query";
import authorizedAxiosInstance from "@/lib/axios";

// Function to fetch all FAQs
const fetchFAQs = async (): Promise<FAQ[]> => {
  try {
    // Try to fetch from API first
    const response = await authorizedAxiosInstance.get<{ result: FAQ[] }>("/api/faqs");
    return response.data.result;
  } catch (error) {
    console.log("API fetch for FAQs failed, falling back to local data");
    // If API fails, fall back to local data
    return faqs;
  }
};

// Function to fetch FAQ categories with their FAQs
const fetchFAQCategories = async (): Promise<FAQCategory[]> => {
  try {
    // Try to fetch from API first
    const response = await authorizedAxiosInstance.get<{ result: FAQCategory[] }>("/api/faq-categories");
    return response.data.result;
  } catch (error) {
    console.log("API fetch for FAQ categories failed, falling back to local data");
    // If API fails, fall back to local data
    return faqCategories;
  }
};

// Function to fetch a single FAQ by ID
const fetchFAQById = async (id: string): Promise<FAQ | undefined> => {
  try {
    // Try to fetch from API first
    const response = await authorizedAxiosInstance.get<{ result: FAQ }>(`/api/faqs/${id}`);
    return response.data.result;
  } catch (error) {
    console.log(`API fetch for FAQ ID ${id} failed, falling back to local data`);
    // If API fails, fall back to local data
    return faqs.find(faq => faq.id.toString() === id.toString());
  }
};

// Function to fetch FAQs by category
const fetchFAQsByCategory = async (categoryId: string): Promise<FAQ[]> => {
  try {
    // Try to fetch from API first
    const response = await authorizedAxiosInstance.get<{ result: FAQ[] }>(`/api/faqs/category/${categoryId}`);
    return response.data.result;
  } catch (error) {
    console.log(`API fetch for FAQs by category ${categoryId} failed, falling back to local data`);
    // If API fails, fall back to local data
    return faqs.filter(faq => faq.category === categoryId);
  }
};

// Custom hook to fetch all FAQs
export const useFetchFAQs = () => {
  return useQuery({
    queryKey: ["faqs"],
    queryFn: fetchFAQs,
    initialData: faqs,
    retry: 1,
  });
};

// Custom hook to fetch all FAQ categories
export const useFetchFAQCategories = () => {
  return useQuery({
    queryKey: ["faqCategories"],
    queryFn: fetchFAQCategories,
    initialData: faqCategories,
    retry: 1,
  });
};

// Custom hook to fetch a single FAQ by ID
export const useFetchFAQById = (id: string) => {
  const localFAQ = faqs.find(faq => faq.id.toString() === id.toString());
  
  return useQuery({
    queryKey: ["faq", id],
    queryFn: () => fetchFAQById(id),
    initialData: localFAQ,
    enabled: id !== undefined && id !== null && id !== "",
    retry: 1,
  });
};

// Custom hook to fetch FAQs by category
export const useFetchFAQsByCategory = (categoryId: string) => {
  const localFAQs = faqs.filter(faq => faq.category === categoryId);
  
  return useQuery({
    queryKey: ["faqs", "category", categoryId],
    queryFn: () => fetchFAQsByCategory(categoryId),
    initialData: localFAQs,
    enabled: categoryId !== undefined && categoryId !== null && categoryId !== "",
    retry: 1,
  });
};