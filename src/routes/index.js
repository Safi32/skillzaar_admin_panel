import { lazy } from "react";

export const routes = [
  {
    path: "/",
    element: lazy(() => import("../pages/Dashboard"))
  },
  {
    path: "/jobs",
    element: lazy(() => import("../pages/Jobs"))
  },
  {
    path: "/workers",
    element: lazy(() => import("../pages/Workers"))
  },
  {
    path: "/create-worker",
    element: lazy(() => import("../pages/CreateWorker"))
  },
  {
    path: "/payments",
    element: lazy(() => import("../pages/Payments"))
  },
  {
    path: "/map",
    element: lazy(() => import("../pages/Map"))
  },
  {
    path: "/privacy",
    element: lazy(() => import("../pages/Privacy"))
  },
  {
    path: "/delete",
    element: lazy(() => import("../pages/Delete"))
  }
];


