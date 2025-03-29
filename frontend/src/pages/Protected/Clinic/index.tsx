import { useState } from "react";
import { tutors } from "@/data/doctors";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

export function ClinicPage() {
  const navigate = useNavigate();
  
  // Nhóm bác sĩ theo chuyên khoa
  const specialtyGroups = tutors.reduce((groups: any, doctor) => {
    const specialty = doctor.specialty;
    if (!groups[specialty]) {
      groups[specialty] = [];
    }
    groups[specialty].push(doctor);
    return groups;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Các chuyên khoa
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Khám phá các chuyên khoa với đội ngũ bác sĩ giàu kinh nghiệm, 
            được đánh giá cao và tin tưởng bởi hàng nghìn bệnh nhân
          </p>
        </div>

        {/* Specialties Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {Object.entries(specialtyGroups).map(([specialty, doctors]: [string, any[]]) => (
            <AccordionItem
              key={specialty}
              value={specialty}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {getSpecialtyIcon(specialty)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {specialty}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {doctors.length} bác sĩ
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4">
                <div className="space-y-4">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      onClick={() => navigate(`/booking/${doctor.id}`)}
                      className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-gray-50 cursor-pointer transition-all"
                    >
                      <img
                        src={doctor.avatar}
                        alt={doctor.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {doctor.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {doctor.hospital}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center text-yellow-500">
                            <svg
                              className="w-4 h-4 fill-current"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            <span className="ml-1 text-sm">{doctor.rating}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {doctor.reviews} đánh giá
                          </div>
                        </div>
                      </div>
                      <div className="text-primary">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

// Helper function to get specialty icon
function getSpecialtyIcon(specialty: string) {
  const iconClass = "w-6 h-6 text-primary";
  
  switch (specialty) {
    case "Tim mạch":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    case "Da liễu":
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      );
    // Thêm các icon khác cho các chuyên khoa
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
  }
}