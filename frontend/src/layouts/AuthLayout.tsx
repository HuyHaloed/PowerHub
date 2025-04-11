import { Outlet } from "react-router-dom";
import AuthHeader from "@/components/Header/auth";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <AuthHeader />
      <Outlet />
    </div>
  );
}
