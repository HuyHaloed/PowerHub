import { Layouts } from "./layouts";
import { paths } from "./utils/path";
import { AuthPages } from "./pages/Auth";
import { PublicPages } from "./pages/Public";
import { AdminPages } from "./pages/Admin";
import { ProtectedPages } from "./pages/Protected";


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
    {
      path: paths.Dashboard,
      element: ProtectedPages.DashboardPage, 
      children: [
        {
          path: `${paths.Dashboard}/analytics`,
          element: ProtectedPages.AnalyticsView,
        },
        {
          path: `${paths.Dashboard}/devices`,
          element: ProtectedPages.DevicesView,
        },
        {
          path: `${paths.Dashboard}/settings`,
          element: ProtectedPages.SettingsView,
        }
      ],
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
