import { Layouts } from "./layouts";
import { paths } from "./utils/path";
import LoginPage from "./pages/Auth/Login";
import HomePage from "./pages/Home";
import DashboardPage from "./pages/Admin/Dashboard";
import ProfilePage from "./pages/Protected/Profile";
import DoctorSearchPage from "./pages/Protected/Search/Doctor";

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
      element: ProfilePage,
    },
    {
      path: paths.DoctorSearch,
      element: DoctorSearchPage
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
