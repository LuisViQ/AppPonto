import React, { useMemo, useState } from "react";
import { Alert, Text } from "react-native";

import SelectSheet from "@/components/SelectSheet";

export type QuickAction =
  | ""
  | "default-week"
  | "edit-person"
  | "user-account"
  | "today"
  | "delete-user";

type DetailQuickActionsProps = {
  canEditSchedule: boolean;
  canDeleteUser: boolean;
  onToggleDefaultForm: () => void;
  onToggleEditPerson: () => void;
  onToggleUserAccount: () => void;
  onToday: () => void;
  onDeleteUser: () => void;
};

export default function DetailQuickActions({
  canEditSchedule,
  canDeleteUser,
  onToggleDefaultForm,
  onToggleEditPerson,
  onToggleUserAccount,
  onToday,
  onDeleteUser,
}: DetailQuickActionsProps) {
  const [quickAction, setQuickAction] = useState<QuickAction>("");

  const quickActionOptions = useMemo(() => {
    const options: {
      value: QuickAction;
      label: string;
      description?: string;
      icon?: string;
      tone?: "danger";
    }[] = [];
    if (canEditSchedule) {
      options.push(
        {
          value: "default-week",
          label: "Horário padrão",
          description: "Aplica para a semana",
          icon: "repeat",
        },
      );
      options.push({
        value: "today",
        label: "Hoje",
        description: "Seleciona o dia atual",
        icon: "calendar",
      });
    }
    options.push(
      {
        value: "edit-person",
        label: "Editar dados",
        description: "Nome, CPF e cargo",
        icon: "user",
      },
      {
        value: "user-account",
        label: "Acesso login",
        description: "Usuário e senha",
        icon: "key",
      },
    );
    if (canDeleteUser) {
      options.push({
        value: "delete-user",
        label: "Excluir usuário",
        description: "Remove usuário e funcionário",
        icon: "trash-2",
        tone: "danger",
      });
    }
    return options;
  }, [canEditSchedule, canDeleteUser]);

  const handleQuickAction = (value: QuickAction) => {
    setQuickAction("");
    switch (value) {
      case "default-week":
        onToggleDefaultForm();
        return;
      case "edit-person":
        onToggleEditPerson();
        return;
      case "user-account":
        onToggleUserAccount();
        return;
      case "today":
        onToday();
        return;
      case "delete-user":
        Alert.alert(
          "Excluir usuário",
          "Isso remove usuário, acesso e funcionário. Deseja continuar?",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Excluir",
              style: "destructive",
              onPress: onDeleteUser,
            },
          ],
        );
        return;
      default:
        return;
    }
  };

  return (
    <>
      <Text className="mt-5 text-xs uppercase tracking-widest text-slate-400">
        Ações rapidas
      </Text>
      <SelectSheet
        label="Escolha uma ação"
        value={quickAction}
        options={quickActionOptions}
        onChange={handleQuickAction}
        placeholder="Abrir opções"
      />
    </>
  );
}
