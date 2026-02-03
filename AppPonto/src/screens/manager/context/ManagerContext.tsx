import React, { createContext, useContext } from "react";

import type { ManagerState } from "../hooks/useManagerState";
import {
  buildCreateJobPositionProps,
  buildCreatePersonProps,
  buildDashboardProps,
  buildDetailProps,
  buildHeaderProps,
  buildHomeProps,
  buildSearchProps,
  buildUsersBulkProps,
  buildUsersListProps,
} from "../utils/managerContainerHelpers";

type ManagerLayoutState = {
  viewMode: ManagerState["view"]["viewMode"];
  activeTab: "home" | "create" | "users";
  message: string | null;
  error: string | null;
  showDetail: boolean;
  onTabChange: (tab: "home" | "create" | "users") => void;
};

export type ManagerContextValue = {
  layout: ManagerLayoutState;
  headerProps: ReturnType<typeof buildHeaderProps>;
  homeProps: ReturnType<typeof buildHomeProps>;
  dashboardProps: ReturnType<typeof buildDashboardProps>;
  searchProps: ReturnType<typeof buildSearchProps>;
  usersListProps: ReturnType<typeof buildUsersListProps>;
  usersBulkProps: ReturnType<typeof buildUsersBulkProps>;
  detailProps: ReturnType<typeof buildDetailProps>;
  createPersonProps: ReturnType<typeof buildCreatePersonProps>;
  createJobPositionProps: ReturnType<typeof buildCreateJobPositionProps>;
};

const ManagerContext = createContext<ManagerContextValue | null>(null);

export function ManagerProvider({
  value,
  children,
}: {
  value: ManagerContextValue;
  children: React.ReactNode;
}) {
  return <ManagerContext.Provider value={value}>{children}</ManagerContext.Provider>;
}

export function useManagerContext() {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error("useManagerContext must be used inside ManagerProvider");
  }
  return context;
}
