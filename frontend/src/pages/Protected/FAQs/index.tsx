import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useFetchFAQCategories, useFetchFAQs } from "@/hooks/useFetchFAQs";
import FAQCategory from "@/components/FAQ/FAQCategory";
import FAQList from "@/components/FAQ/FAQList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FAQ } from "@/types/faq.types";

const FAQsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search") || "";
  
  const { data: categories = [], isLoading: categoriesLoading } = useFetchFAQCategories();
  const { data: allFaqs = [], isLoading: faqsLoading } = useFetchFAQs();
  
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [activeCategory, setActiveCategory] = useState(categoryParam || "all");
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  
  // Update filtered FAQs when search query, active category, or data changes
  useEffect(() => {
    let filtered = [...allFaqs];
    
    // Filter by category if not "all"
    if (activeCategory !== "all") {
      filtered = filtered.filter(faq => faq.category === activeCategory);
    }
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        faq => 
          faq.question.toLowerCase().includes(query) || 
          faq.answer.toLowerCase().includes(query)
      );
    }
    
    setFilteredFaqs(filtered);
  }, [searchQuery, activeCategory, allFaqs]);
  
  // Update URL params when active category or search query changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    setSearchParams(params, { replace: true });
  }, [activeCategory, searchQuery, setSearchParams]);
  
  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search is already updated via the input onChange
  };
  
  // Handle search input change
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setSearchQuery("");
  };
  
  const isLoading = categoriesLoading || faqsLoading;
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--primary-ground)] mb-4">
            Câu hỏi thường gặp
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Có câu hỏi? Dưới đây bạn sẽ tìm thấy câu trả lời được đánh giá cao nhất từ đội ngũ 
            kỹ thuật của chúng tôi, cùng với quyền truy cập vào hướng dẫn từng bước và hỗ trợ.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Tìm kiếm câu hỏi..."
              className="pl-10 h-12 shadow-sm"
              value={searchQuery}
              onChange={handleSearchInputChange}
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                className="absolute inset-y-0 right-0 px-3"
                onClick={handleClearSearch}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </Button>
            )}
          </form>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary-ground)]"></div>
          </div>
        ) : (
          <>
            {/* Category Buttons */}
            <div className="flex justify-center flex-wrap gap-2 mb-8">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                onClick={() => handleCategoryChange("all")}
                className={activeCategory === "all" ? "bg-[var(--primary-ground)]" : ""}
              >
                Tất cả
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  onClick={() => handleCategoryChange(category.id)}
                  className={activeCategory === category.id ? "bg-[var(--primary-ground)]" : ""}
                >
                  {category.name}
                </Button>
              ))}
            </div>
            
            {/* Content based on active category */}
            <div className="mt-6">
              {activeCategory === "all" ? (
                searchQuery ? (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Kết quả tìm kiếm cho: "{searchQuery}"
                    </h2>
                    {filteredFaqs.length > 0 ? (
                      <FAQList faqs={filteredFaqs} />
                    ) : (
                      <p className="text-center py-6 text-gray-500">
                        Không tìm thấy kết quả nào cho "{searchQuery}". Vui lòng thử từ khóa khác.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {categories.map((category) => (
                      <FAQCategory 
                        key={category.id} 
                        category={category} 
                        defaultOpen={categories.indexOf(category) === 0}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  {/* Get the active category */}
                  {(() => {
                    const category = categories.find(cat => cat.id === activeCategory);
                    if (!category) return null;
                    
                    return (
                      <>
                        <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                        {category.description && (
                          <p className="text-gray-600 mb-6">{category.description}</p>
                        )}
                        {searchQuery ? (
                          <>
                            <h3 className="text-lg font-medium mb-4">
                              Kết quả tìm kiếm cho: "{searchQuery}"
                            </h3>
                            {filteredFaqs.length > 0 ? (
                              <FAQList faqs={filteredFaqs} category={category.name} />
                            ) : (
                              <p className="text-center py-6 text-gray-500">
                                Không tìm thấy kết quả nào cho "{searchQuery}" trong mục {category.name}. Vui lòng thử từ khóa khác.
                              </p>
                            )}
                          </>
                        ) : (
                          <FAQList faqs={category.faqs} category={category.name} />
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            {/* Still Need Help Section */}
            <div className="mt-16 bg-[var(--primary-ground)]/5 rounded-lg p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Vẫn cần hỗ trợ?</h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Nếu bạn không tìm thấy câu trả lời cho câu hỏi của mình, đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ.
                Vui lòng liên hệ với chúng tôi qua các kênh bên dưới.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-[var(--primary-ground)] hover:bg-[var(--primary-ground)]/90 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Gửi email hỗ trợ
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                  </svg>
                  Live chat
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FAQsPage;