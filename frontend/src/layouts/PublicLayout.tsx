import Header from "@/components/Header";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
}
