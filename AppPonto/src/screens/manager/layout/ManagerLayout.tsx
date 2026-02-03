import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from "react-native";
import { Box } from "@/components/ui/box";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import ManagerDetailView from "../views/ManagerDetailView";
import ManagerCreateJobPositionView from "../views/ManagerCreateJobPositionView";
import ManagerCreatePersonView from "../views/ManagerCreatePersonView";
import ManagerDashboardView from "../views/ManagerDashboardView";
import ManagerHomeView from "../views/ManagerHomeView";
import ManagerHeader from "./ManagerHeader";
import ManagerSearchView from "../views/ManagerSearchView";
import ManagerUsersBulkView from "../views/ManagerUsersBulkView";
import ManagerUsersListView from "../views/ManagerUsersListView";
import { useKeyboardInset } from "@/src/utils/useKeyboardInset";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerLayout() {
  const { layout } = useManagerContext();
  const { viewMode, activeTab, message, error, showDetail, onTabChange } = layout;
  const isHome = activeTab === "home";
  const isCreate = activeTab === "create";
  const isUsers = activeTab === "users";
  const keyboardHeight = useKeyboardInset();
  const showSearch = viewMode === "search";
  const showCreatePerson = viewMode === "create-person";
  const showCreateJobPosition = viewMode === "create-job-position";
  const showUsersList =
    isUsers &&
    !showDetail &&
    !showSearch &&
    !showCreatePerson &&
    !showCreateJobPosition;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={["top", "bottom"]}>
      <Box className="flex-1">
        {showUsersList ? (
          <KeyboardAvoidingView
            className="flex-1"
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 64}
          >
            <ManagerUsersListView />
          </KeyboardAvoidingView>
        ) : (
          <KeyboardAvoidingView
            className="flex-1"
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 64}
          >
            <ScrollView
              contentContainerClassName="px-4 pt-4"
              contentContainerStyle={{
                paddingBottom: 160 + keyboardHeight,
              }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              <ManagerHeader />

              {message ? (
                <Box className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2">
                  <Box className="flex-row items-start">
                    <Feather name="info" size={12} color="#7dd3fc" />
                    <Text className="text-sky-200 text-xs ml-2 flex-1">
                      {message}
                    </Text>
                  </Box>
                </Box>
              ) : null}
              {error ? (
                <Box className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
                  <Box className="flex-row items-start">
                    <Feather name="alert-triangle" size={12} color="#fca5a5" />
                    <Text className="text-rose-200 text-xs ml-2 flex-1">
                      {error}
                    </Text>
                  </Box>
                </Box>
              ) : null}

              {showCreatePerson ? (
                <ManagerCreatePersonView />
              ) : showCreateJobPosition ? (
                <ManagerCreateJobPositionView />
              ) : showSearch ? (
                <ManagerSearchView />
              ) : isHome ? (
                <ManagerDashboardView />
              ) : isCreate ? (
                <>
                  <ManagerHomeView />
                  <ManagerUsersBulkView />
                </>
              ) : (
                <>
                  {showDetail ? (
                    <ManagerDetailView />
                  ) : (
                    <ManagerUsersListView />
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}

        <Box className="border-t border-slate-800 bg-slate-950/95 px-4 py-2 flex-row">
          <Pressable
            className={`flex-1 items-center rounded-xl py-2 ${
              isHome ? "bg-slate-900/70" : ""
            }`}
            onPress={() => onTabChange("home")}
          >
            <Feather
              name="home"
              size={18}
              color={isHome ? "#38bdf8" : "#94a3b8"}
            />
            <Text
              className={`text-[10px] mt-1 ${
                isHome ? "text-sky-400" : "text-slate-400"
              }`}
            >
              Home
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center rounded-xl py-2 ${
              isCreate ? "bg-slate-900/70" : ""
            }`}
            onPress={() => onTabChange("create")}
          >
            <Feather
              name="plus-square"
              size={18}
              color={isCreate ? "#38bdf8" : "#94a3b8"}
            />
            <Text
              className={`text-[10px] mt-1 ${
                isCreate ? "text-sky-400" : "text-slate-400"
              }`}
            >
              Criar
            </Text>
          </Pressable>
          <Pressable
            className={`flex-1 items-center rounded-xl py-2 ${
              isUsers ? "bg-slate-900/70" : ""
            }`}
            onPress={() => onTabChange("users")}
          >
            <Feather
              name="users"
              size={18}
              color={isUsers ? "#38bdf8" : "#94a3b8"}
            />
            <Text
              className={`text-[10px] mt-1 ${
                isUsers ? "text-sky-400" : "text-slate-400"
              }`}
            >
              Usuários
            </Text>
          </Pressable>
        </Box>
      </Box>
    </SafeAreaView>
  );
}
