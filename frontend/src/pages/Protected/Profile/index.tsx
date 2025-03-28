import { useAccount } from "@/hooks/useAccount";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Avatar } from "@/components/ui/avatar";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: user, isLoading, refetch } = useAccount();

  const handleRefresh = () => {
    refetch();
    toast.info("Đang cập nhật thông tin...");
  };
  useEffect(() => {
    refetch();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8">
          <div className="flex flex-col md:flex-row items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20 rounded-full border-4 border-white shadow-lg">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
            </div>
            <div className="md:ml-4 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
              <p className="text-blue-100">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">
                  Số điện thoại
                </h3>
                <p className="text-lg text-gray-900">
                  {user.phone_number || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">ID</h3>
                <p className="text-lg text-gray-900">{user?.id}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">
                  Trạng thái
                </h3>
                <p className="text-lg text-green-600">Đang hoạt động</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleRefresh}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Cập nhật thông tin</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
