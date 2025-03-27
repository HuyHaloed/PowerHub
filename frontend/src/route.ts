import { Layouts } from "./layouts";
import { paths } from "./utils/path";
import LoginPage from "./pages/Auth/Login";
import HomePage from "./pages/Home";
import DashboardPage from "./pages/Admin/Dashboard";
import { ProtectedPages } from "./pages/Protected";

export const AuthRoutes = {
  layout: Layouts.AuthLayout,
  routes: [
    {
      path: paths.Login,
      element: LoginPage,
    },
  ],
};

export const PublicRoutes = {
  layout: Layouts.PublicLayout,
  routes: [
    {
      path: paths.Home,
      element: HomePage,
    },
  ],
};

export const ProtectedRoutes = {
  layout: Layouts.ProtectedLayout,
  routes: [
    {
      path: paths.Profile,
      element: ProtectedPages.ProfilePage,
    },
    {
      path: paths.DoctorSearch,
      element: ProtectedPages.DoctorSearchPage,
    },
    {
      path: paths.Booking + "/:id",
      element: ProtectedPages.BookingPage
    }
  ],
};

export const AdminRoutes = {
  layout: Layouts.AdminLayout,
  routes: [
    {
      path: paths.AdminDashboard,
      element: DashboardPage,
    },
  ],
};
