import { Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { routes } from ".";
import RequireAuth from "./RequireAuth";
import Login from "../pages/Login";

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          {routes.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={
                <Suspense fallback={<div style={{padding:16}}>Loading…</div>}>
                  <r.element />
                </Suspense>
              }
            />
          ))}
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRouter;


