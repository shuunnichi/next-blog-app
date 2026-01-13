"use client";

import React from "react";
import { useRouteGuard } from "@/app/_hooks/useRouteGuard";

interface Props {
  children: React.ReactNode;
}
const AdminLayout = ({ children }: Props) => {
  const isAuth = useRouteGuard();

  if (!isAuth) {
    return null;
  }
  return <>{children}</>;
};

export default AdminLayout;