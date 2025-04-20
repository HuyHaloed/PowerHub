
import { Card } from "@/components/ui/card";
import { QuickStat } from "@/types/dashboard.types";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

interface QuickStatCardProps {
  stat: QuickStat;
}

export default function QuickStatCard({ stat }: QuickStatCardProps) {
  const formatNumber = (value: number) => {
    return value.toFixed(2);
  };
  if (stat.title === "Estimated Cost") {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">Ngày hiện tại</p>
            <h3 className="text-2xl font-bold mt-1 text-gray-900">
              {new Date().toLocaleDateString('vi-VN')}
            </h3>
            
            <div className="flex items-center mt-2">
              <Calendar className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-xs text-gray-600">
                {new Date().toLocaleTimeString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{stat.title}</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900">
            {formatNumber(stat.value)}
            {stat.unit && <span className="text-sm ml-1 font-normal text-gray-600">{stat.unit}</span>}
          </h3>
          
          {stat.change !== undefined && (
            <div className="flex items-center mt-2">
              {stat.changeType === 'increase' ? (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={`text-xs ${stat.changeType === 'increase' ? 'text-red-500' : 'text-green-500'}`}>
                {formatNumber(stat.change)}% so với trước đó
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}