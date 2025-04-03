import { Layouts } from "./layouts";
import { paths } from "./utils/path";
import { AuthPages } from "./pages/Auth";
import { PublicPages } from "./pages/Public";
import { AdminPages } from "./pages/Admin";
import { ProtectedPages } from "./pages/Protected";
import { CustomerPages } from "./pages/Customer";

export const AuthRoutes = {
  layout: Layouts.AuthLayout,
  routes: [
    {
      path: paths.Login,
      element: AuthPages.LoginPage,
    },
    {
      path: paths.Signup,
      element: AuthPages.SignupPage,
    },
  ],
};

export const PublicRoutes = {
  layout: Layouts.PublicLayout,
  routes: [
    {
      path: paths.Home,
      element: PublicPages.HomePage,
    },
    {
      path: paths.Contact,
      element: PublicPages.ContactPage,
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
      path: paths.FAQs,
      element: ProtectedPages.FAQSPage,
    },
    {
      path: paths.Booking + "/:id",
      element: ProtectedPages.BookingPage,
    },
    {
      path: paths.Blogs,
      element: ProtectedPages.BlogsPage,
    },
    {
      path: paths.Blog,
      element: ProtectedPages.BlogDetailPage,
    },
    


  ],
};

export const AdminRoutes = {
  layout: Layouts.AdminLayout,
  routes: [
    {
      path: paths.AdminDashboard,
      element: AdminPages.DashboardPage,
    },
    {
      path: paths.AdminDoctors,
      element: AdminPages.DoctorsPage,
    },
    {
      path: paths.AdminAppointments,
      element: AdminPages.AppointmentsPage,
    },
    {
      path: paths.AdminSettings,
      element: AdminPages.SettingsPage,
    },
  ],
};

export const CustomerRoutes = {
  layout: Layouts.CustomerLayout,
  routes: [
    {
      path: paths.Dashboard,
      element: CustomerPages.DashboardPage, 
      children: [
        {
          path: `${paths.Dashboard}/analytics`,
          element: CustomerPages.AnalyticsView,
        },
        {
          path: `${paths.Dashboard}/devices`,
          element: CustomerPages.DevicesView,
        },
        {
          path: `${paths.Dashboard}/settings`,
          element: CustomerPages.SettingsView,
        }
      ],
    },
  ],
};