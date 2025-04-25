
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User } from "@/types/dashboard.types";
import { Crown, Calendar } from "lucide-react";
import SettingsView from '@/pages/Customer/Dashboard/SettingsView';



interface UserInfoCardProps {
  user: User;
}

export default function UserInfoCard({ user }: UserInfoCardProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlemanegeAccount = () => {
    return <SettingsView />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">Thông tin người dùng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="relative">
            <img 
              src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
              alt="Avatar" 
              className="w-20 h-20 rounded-full"
            />
            {user.subscription?.plan === "Premium" && (
              <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full p-1">
                <Crown className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
          
          <h3 className="mt-3 font-medium text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          
          {user.subscription && (
            <div className="mt-4 w-full">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Gói dịch vụ</span>
                <span className="text-xs font-medium">
                  {user.subscription.plan === "Premium" ? (
                    <span className="text-yellow-500 font-semibold">Premium</span>
                  ) : (
                    user.subscription.plan
                  )}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  Hiệu lực đến
                </span>
                <span className="text-xs font-medium">
                  {formatDate(user.subscription.validUntil)}
                </span>
              </div>
            </div>
          )}
          
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handlemanegeAccount}>
            Quản lý tài khoản
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}