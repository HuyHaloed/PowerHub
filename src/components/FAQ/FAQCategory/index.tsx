import { useState } from 'react';
import { FAQCategoryProps } from '@/types/faq.types';
import FAQList from '../FAQList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FAQCategory = ({ category, defaultOpen = false }: FAQCategoryProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="mb-6 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">{category.name}</CardTitle>
            {category.description && (
              <CardDescription className="mt-1 text-gray-500">
                {category.description}
              </CardDescription>
            )}
          </div>
          <div className="text-gray-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <FAQList faqs={category.faqs} category={category.name} />
        </CardContent>
      )}
    </Card>
  );
};

export default FAQCategory;