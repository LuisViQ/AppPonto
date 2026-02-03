import type Realm from "realm";

import type { JobPosition } from "@/src/databases/schemas";
import { enqueue } from "@/src/services/outboxService";
import { uuid } from "@/src/utils/uuid";
import type { ManagerState } from "../useManagerState";
import type { createActionValidators } from "./actionValidators";

type ValidatorSet = ReturnType<typeof createActionValidators>;

export const useManagerJobPositionActions = (args: {
  realm: Realm;
  state: ManagerState;
  jobPositionByClientId: Map<string, JobPosition>;
  validators: ValidatorSet;
  resetFeedback: () => void;
}) => {
  const { realm, state, validators, resetFeedback } = args;
  const { jobPositionForm, selection, feedback } = state;

  const handleCreateJobPosition = () => {
    resetFeedback();
    const name = jobPositionForm.jobPositionName.trim();
    const description = jobPositionForm.jobPositionDescription.trim();

    if (!name) {
      feedback.setError("Informe o nome do cargo");
      return;
    }
    if (name.length < 2) {
      feedback.setError("Nome do cargo muito curto");
      return;
    }
    if (validators.hasDuplicateJobPositionName(name)) {
      feedback.setError("Cargo já cadastrado");
      return;
    }

    let createdId: string | null = null;

    realm.write(() => {
      const now = new Date();
      const jobClientId = uuid();
      createdId = jobClientId;
      realm.create<JobPosition>("JobPosition", {
        client_id: jobClientId,
        name,
        description: description || undefined,
        local_updated_at: now,
        sync_status: "DIRTY",
      });
      enqueue(realm, "JOB_POSITION_UPSERT", {
        client_id: jobClientId,
        name,
        description: description || undefined,
      });
    });

    jobPositionForm.setJobPositionName("");
    jobPositionForm.setJobPositionDescription("");
    if (createdId) {
      selection.setSelectedJobPositionId(createdId);
    }
    feedback.setMessage("Cargo criado");
  };

  const handleUpdateJobPosition = (
    position: JobPosition,
    nextName: string,
    nextDescription: string,
  ) => {
    resetFeedback();

    const name = nextName.trim();
    const description = nextDescription.trim();

    if (!name) {
      feedback.setError("Informe o nome do cargo");
      return;
    }
    if (name.length < 2) {
      feedback.setError("Nome do cargo muito curto");
      return;
    }
    if (validators.hasDuplicateJobPositionName(name, position.client_id)) {
      feedback.setError("Cargo ja cadastrado");
      return;
    }

    realm.write(() => {
      const now = new Date();
      position.name = name;
      position.description = description || undefined;
      position.local_updated_at = now;
      position.sync_status = "DIRTY" as never;
      enqueue(realm, "JOB_POSITION_UPSERT", {
        client_id: position.client_id,
        server_id: position.server_id,
        name,
        description: description || undefined,
      });
    });

    feedback.setMessage("Cargo atualizado");
  };

  const isJobPositionInUse = (position: JobPosition) => {
    const byClient = realm
      .objects("Employee")
      .filtered(
        'job_position_client_id == $0 AND sync_status != "DELETED"',
        position.client_id,
      );
    if (byClient.length > 0) {
      return true;
    }
    if (typeof position.server_id === "number") {
      const byServer = realm
        .objects("Employee")
        .filtered(
          'job_position_server_id == $0 AND sync_status != "DELETED"',
          position.server_id,
        );
      if (byServer.length > 0) {
        return true;
      }
    }
    return false;
  };

  const handleDeleteJobPosition = (position: JobPosition) => {
    resetFeedback();

    if (isJobPositionInUse(position)) {
      feedback.setError("Cargo em uso por funcionario");
      return;
    }

    realm.write(() => {
      position.sync_status = "DELETED" as never;
      position.local_updated_at = new Date();
      enqueue(realm, "JOB_POSITION_DELETE", {
        client_id: position.client_id,
        job_position_client_id: position.client_id,
        server_id: position.server_id,
        name: position.name,
        job_position_name: position.name,
      });
    });

    if (selection.selectedJobPositionId === position.client_id) {
      selection.setSelectedJobPositionId(null);
    }

    feedback.setMessage("Cargo removido");
  };

  return {
    handleCreateJobPosition,
    handleUpdateJobPosition,
    handleDeleteJobPosition,
  };
};
