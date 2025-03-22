import { Outlet } from "react-router-dom";

export default function ProtectedLayout() {
  return (
    <div>
      <h1>Protected page</h1>
      <Outlet />
    </div>
  );
}
