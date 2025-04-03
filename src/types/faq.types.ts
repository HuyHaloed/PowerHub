export interface FAQ {
    id: string | number;
    question: string;
    answer: string;
    category: string;
  }
  
  export interface FAQCategory {
    id: string;
    name: string;
    description?: string;
    faqs: FAQ[];
  }
  
  export interface FAQItemProps {
    faq: FAQ;
    isOpen?: boolean;
    onToggle?: () => void;
  }
  
  export interface FAQListProps {
    faqs: FAQ[];
    category?: string;
  }
  
  export interface FAQCategoryProps {
    category: FAQCategory;
    defaultOpen?: boolean;
  }