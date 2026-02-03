import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Box } from "@/components/ui/box";
import type { JobPosition } from "@/src/databases/schemas";
import { useManagerContext } from "../context/ManagerContext";

export default function ManagerCreateJobPositionView() {
  const { createJobPositionProps } = useManagerContext();
  const {
    message,
    error,
    onBack,
    jobPositionName,
    onJobPositionNameChange,
    jobPositionDescription,
    onJobPositionDescriptionChange,
    onSubmit,
    jobPositions,
    onDeleteJobPosition,
    onUpdateJobPosition,
  } = createJobPositionProps;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const safeJobPositions = jobPositions.filter((position) =>
    position?.isValid ? position.isValid() : true,
  );
  const sortedJobPositions = useMemo(
    () =>
      [...safeJobPositions].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? ""),
      ),
    [safeJobPositions],
  );

  const startEdit = (position: JobPosition) => {
    setEditingId(position.client_id);
    setEditName(position.name ?? "");
    setEditDescription(position.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  return (
    <>
      <Pressable
        className="bg-slate-900/60 border border-slate-800 px-3 py-2 rounded-xl mt-4 self-start"
        onPress={onBack}
      >
        <Box className="flex-row items-center">
          <Feather name="chevron-left" size={14} color="#e2e8f0" />
          <Text className="text-slate-200 text-xs font-semibold ml-2">
            Voltar
          </Text>
        </Box>
      </Pressable>

      <Text className="mt-4 text-xl font-semibold text-slate-50">
        Novo cargo
      </Text>
      <Text className="text-slate-400 text-xs mt-1">
        Cadastre um cargo para associar aos funcionários.
      </Text>

      <Box className="bg-slate-900/70 rounded-2xl p-4 mt-4 border border-slate-800">
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Nome do cargo"
          value={jobPositionName}
          maxLength={60}
          onChangeText={onJobPositionNameChange}
        />
        <TextInput
          className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
          placeholder="Descrição (opcional)"
          value={jobPositionDescription}
          maxLength={120}
          onChangeText={onJobPositionDescriptionChange}
        />

        <Pressable
          className="bg-sky-500/80 py-3 rounded-xl items-center"
          onPress={onSubmit}
        >
          <Text className="text-slate-50 font-semibold">Salvar cargo</Text>
        </Pressable>

        {message ? (
          <Box className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2">
            <Text className="text-sky-200 text-xs">{message}</Text>
          </Box>
        ) : null}
        {error ? (
          <Box className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2">
            <Text className="text-rose-200 text-xs">{error}</Text>
          </Box>
        ) : null}
      </Box>

      <Text className="mt-6 text-xs uppercase tracking-widest text-slate-500">
        Cargos cadastrados
      </Text>
      {sortedJobPositions.length === 0 ? (
        <Text className="text-slate-400 text-xs mt-2">
          Nenhum cargo cadastrado.
        </Text>
      ) : (
        sortedJobPositions.map((position) => (
          <Box
            key={position.client_id}
            className="bg-slate-900/70 rounded-2xl p-4 mt-3 border border-slate-800"
          >
            {editingId === position.client_id ? (
              <>
                <TextInput
                  className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
                  placeholder="Nome do cargo"
                  value={editName}
                  maxLength={60}
                  onChangeText={setEditName}
                />
                <TextInput
                  className="bg-slate-950 rounded-xl px-3 py-2 text-slate-50 mb-3 placeholder:text-slate-500 border border-slate-800"
                  placeholder="Descricao (opcional)"
                  value={editDescription}
                  maxLength={120}
                  onChangeText={setEditDescription}
                />
                <Box className="flex-row flex-wrap">
                  <Pressable
                    className="bg-emerald-500/80 px-3 py-2 rounded-lg border border-emerald-400/60 mr-2 mb-2"
                    onPress={() => {
                      onUpdateJobPosition(position, editName, editDescription);
                      cancelEdit();
                    }}
                  >
                    <Box className="flex-row items-center">
                      <Feather name="check" size={12} color="#fff" />
                      <Text className="text-white text-xs font-semibold ml-2">
                        Salvar
                      </Text>
                    </Box>
                  </Pressable>
                  <Pressable
                    className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 mb-2"
                    onPress={cancelEdit}
                  >
                    <Box className="flex-row items-center">
                      <Feather name="x" size={12} color="#e2e8f0" />
                      <Text className="text-slate-200 text-xs font-semibold ml-2">
                        Cancelar
                      </Text>
                    </Box>
                  </Pressable>
                </Box>
              </>
            ) : (
              <Box className="flex-row items-start justify-between">
                <Box className="flex-1 pr-3">
                  <Text className="text-slate-50 font-semibold">
                    {position.name}
                  </Text>
                  {position.description ? (
                    <Text className="text-slate-400 text-xs mt-1">
                      {position.description}
                    </Text>
                  ) : null}
                </Box>
                <Box className="flex-row items-center">
                  <Pressable
                    className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-700 mr-2"
                    onPress={() => startEdit(position)}
                  >
                    <Box className="flex-row items-center">
                      <Feather name="edit-2" size={12} color="#e2e8f0" />
                      <Text className="text-slate-200 text-xs font-semibold ml-2">
                        Editar
                      </Text>
                    </Box>
                  </Pressable>
                  <Pressable
                    className="bg-rose-500/80 px-3 py-2 rounded-lg border border-rose-400/60"
                    onPress={() =>
                      Alert.alert(
                        "Excluir cargo",
                        "Esse cargo será removido. Deseja continuar?",
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Excluir",
                            style: "destructive",
                            onPress: () => onDeleteJobPosition(position),
                          },
                        ],
                      )
                    }
                  >
                    <Box className="flex-row items-center">
                      <Feather name="trash-2" size={12} color="#fff" />
                      <Text className="text-white text-xs font-semibold ml-2">
                        Excluir
                      </Text>
                    </Box>
                  </Pressable>
                </Box>
              </Box>
            )}
          </Box>
        ))
      )}
    </>
  );
}
