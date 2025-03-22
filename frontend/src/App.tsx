import { Routes, Route, useLocation } from "react-router-dom";
import NotFoundPage from "./components/404";
import nprogress from "nprogress";
import { useEffect, JSX } from "react";
import {
  AuthRoutes,
  AdminRoutes,
  ProtectedRoutes,
  PublicRoutes,
} from "./route";

interface _Routes {
  path: string;
  element: () => JSX.Element;
}
export default function App() {
  let location = useLocation();

  useEffect(() => {
    nprogress.start();
    nprogress.done();
  }, [location.pathname]);
  return (
    <Routes>
      <Route element={<AdminRoutes.layout />}>
        {AdminRoutes.routes.map((item: _Routes) => (
          <Route key={item.path} path={item.path} element={<item.element />} />
        ))}
      </Route>
      <Route element={<PublicRoutes.layout />}>
        {PublicRoutes.routes.map((item: _Routes) => (
          <Route key={item.path} path={item.path} element={<item.element />} />
        ))}
      </Route>
      <Route element={<AuthRoutes.layout />}>
        {AuthRoutes.routes.map((item: _Routes) => (
          <Route key={item.path} path={item.path} element={<item.element />} />
        ))}
      </Route>
      <Route element={<ProtectedRoutes.layout />}>
        {ProtectedRoutes.routes.map((item: _Routes) => (
          <Route key={item.path} path={item.path} element={<item.element />} />
        ))}
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
