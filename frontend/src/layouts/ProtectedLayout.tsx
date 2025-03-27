import Header from "@/components/Header";
import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
