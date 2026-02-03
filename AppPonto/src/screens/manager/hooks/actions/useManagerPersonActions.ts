import type Realm from "realm";

import type { Employee, JobPosition, Person, UserAccount } from "@/src/databases/schemas";
import { enqueue } from "@/src/services/outboxService";
import { uuid } from "@/src/utils/uuid";
import type { ManagerState } from "../useManagerState";
import type { createActionValidators } from "./actionValidators";

type ValidatorSet = ReturnType<typeof createActionValidators>;

export const useManagerPersonActions = (args: {
  realm: Realm;
  state: ManagerState;
  jobPositionByClientId: Map<string, JobPosition>;
  selectedEmployee: Employee | null;
  selectedPerson: Person | null;
  selectedUserAccount: UserAccount | null;
  validators: ValidatorSet;
  resetFeedback: () => void;
  isSelfSelected: () => boolean;
}) => {
  const {
    realm,
    state,
    jobPositionByClientId,
    selectedEmployee,
    selectedPerson,
    selectedUserAccount,
    validators,
    resetFeedback,
    isSelfSelected,
  } = args;
  const { personForm, selection, editForm, feedback } = state;

  const handleCreatePerson = () => {
    resetFeedback();
    const name = personForm.personName.trim();
    const cpf = personForm.personCpf.trim();
    const registration = personForm.registrationNumber.trim();
    const isAdmin = personForm.personIsAdmin;
    const adminUsername = personForm.personAdminUsername.trim();
    const adminPassword = personForm.personAdminPassword.trim();

    if (!validators.validateBasePerson(name, cpf)) {
      return;
    }
    if (
      !validators.validateEmployeePart(
        registration,
        selection.selectedJobPositionId,
      )
    ) {
      return;
    }
    if (!validators.validateAccount(adminUsername, adminPassword)) {
      return;
    }

    const jobPosition = selection.selectedJobPositionId
      ? (jobPositionByClientId.get(selection.selectedJobPositionId) ?? null)
      : null;

    realm.write(() => {
      const now = new Date();
      const personClientId = uuid();
      realm.create<Person>("Person", {
        client_id: personClientId,
        cpf,
        name,
        local_updated_at: now,
        sync_status: "DIRTY",
      });

      enqueue(realm, "PERSON_UPSERT", {
        client_id: personClientId,
        cpf,
        name,
      });

      const employeeClientId = uuid();
      realm.create<Employee>("Employee", {
        client_id: employeeClientId,
        person_client_id: personClientId,
        registration_number: registration,
        job_position_client_id: jobPosition?.client_id,
        job_position_server_id: jobPosition?.server_id,
        person_name_cache: name,
        job_position_name_cache: jobPosition?.name,
        local_updated_at: now,
        sync_status: "DIRTY",
      });
      enqueue(realm, "EMPLOYEE_UPSERT", {
        client_id: employeeClientId,
        person_client_id: personClientId,
        registration_number: registration,
        job_position_client_id: jobPosition?.client_id,
        job_position_server_id: jobPosition?.server_id,
        job_position_name: jobPosition?.name,
      });

      const accountType = isAdmin ? "BOTH" : "EMPLOYEE";
      const userClientId = uuid();
      realm.create<UserAccount>("UserAccount", {
        client_id: userClientId,
        person_client_id: personClientId,
        username: adminUsername,
        account_type: accountType,
        is_active: personForm.personAdminIsActive,
        local_updated_at: now,
        sync_status: "DIRTY",
      });
      enqueue(realm, "USER_ACCOUNT_UPSERT", {
        client_id: userClientId,
        person_client_id: personClientId,
        username: adminUsername,
        password: adminPassword,
        account_type: accountType,
        is_active: personForm.personAdminIsActive,
      });
    });

    personForm.setPersonName("");
    personForm.setPersonCpf("");
    personForm.setRegistrationNumber("");
    personForm.setPersonIsAdmin(false);
    personForm.setPersonAdminUsername("");
    personForm.setPersonAdminPassword("");
    personForm.setPersonAdminIsActive(true);
    feedback.setMessage("Pessoa criada");
  };

  const handleUpdatePersonAndEmployee = () => {
    resetFeedback();

    if (!selectedPerson) {
      feedback.setError("Selecione um usuário");
      return;
    }

    const name = editForm.editPersonName.trim();
    const cpf = editForm.editPersonCpf.trim();
    if (!validators.validateBasePerson(name, cpf, selectedPerson.client_id)) {
      return;
    }

    const jobPosition = editForm.editJobPositionId
      ? (jobPositionByClientId.get(editForm.editJobPositionId) ?? null)
      : null;
    const registration = editForm.editRegistrationNumber.trim();

    if (
      !validators.validateEmployeePart(
        registration,
        editForm.editJobPositionId,
        selectedEmployee?.client_id,
      )
    ) {
      return;
    }

    let createdEmployeeId: string | null = null;
    realm.write(() => {
      const now = new Date();
      selectedPerson.name = name;
      selectedPerson.cpf = cpf;
      selectedPerson.local_updated_at = now;
      selectedPerson.sync_status = "DIRTY" as never;

      enqueue(realm, "PERSON_UPSERT", {
        client_id: selectedPerson.client_id,
        server_id: selectedPerson.server_id,
        cpf,
        name,
      });

      if (selectedEmployee) {
        selectedEmployee.registration_number = registration;
        selectedEmployee.job_position_client_id = jobPosition?.client_id;
        selectedEmployee.job_position_server_id = jobPosition?.server_id;
        selectedEmployee.job_position_name_cache = jobPosition?.name;
        selectedEmployee.person_name_cache = name;
        selectedEmployee.local_updated_at = now;
        selectedEmployee.sync_status = "DIRTY" as never;
        enqueue(realm, "EMPLOYEE_UPSERT", {
          client_id: selectedEmployee.client_id,
          server_id: selectedEmployee.server_id,
          person_client_id:
            selectedEmployee.person_client_id ?? selectedPerson.client_id,
          person_server_id:
            selectedEmployee.person_server_id ?? selectedPerson.server_id,
          registration_number: registration,
          job_position_client_id: jobPosition?.client_id,
          job_position_server_id: jobPosition?.server_id,
          job_position_name: jobPosition?.name,
        });
      } else {
        const employeeClientId = uuid();
        createdEmployeeId = employeeClientId;
        realm.create<Employee>("Employee", {
          client_id: employeeClientId,
          person_client_id: selectedPerson.client_id,
          person_server_id: selectedPerson.server_id,
          registration_number: registration,
          job_position_client_id: jobPosition?.client_id,
          job_position_server_id: jobPosition?.server_id,
          person_name_cache: name,
          job_position_name_cache: jobPosition?.name,
          local_updated_at: now,
          sync_status: "DIRTY",
        });
        enqueue(realm, "EMPLOYEE_UPSERT", {
          client_id: employeeClientId,
          person_client_id: selectedPerson.client_id,
          person_server_id: selectedPerson.server_id,
          registration_number: registration,
          job_position_client_id: jobPosition?.client_id,
          job_position_server_id: jobPosition?.server_id,
          job_position_name: jobPosition?.name,
        });
      }
    });

    if (createdEmployeeId) {
      selection.setSelectedEmployeeClientId(createdEmployeeId);
    }
    feedback.setMessage("Dados atualizados");
  };

  const handleDeleteEmployee = () => {
    resetFeedback();
    if (!selectedEmployee) {
      feedback.setError("Selecione um funcionário");
      return;
    }
    if (isSelfSelected()) {
      feedback.setError("Você não pode se excluir");
      return;
    }

    realm.write(() => {
      selectedEmployee.sync_status = "DELETED" as never;
      selectedEmployee.local_updated_at = new Date();
      enqueue(realm, "EMPLOYEE_DELETE", {
        client_id: selectedEmployee.client_id,
        server_id: selectedEmployee.server_id,
        employee_client_id: selectedEmployee.client_id,
        employee_server_id: selectedEmployee.server_id,
        person_client_id: selectedEmployee.person_client_id,
        person_server_id: selectedEmployee.person_server_id,
      });
    });

    selection.setSelectedEmployeeClientId(null);
    selection.setSelectedPersonClientId(null);
    feedback.setMessage("Funcionário removido");
  };

  const handleDeletePerson = () => {
    resetFeedback();
    if (!selectedPerson) {
      feedback.setError("Selecione um usuário");
      return;
    }
    if (isSelfSelected()) {
      feedback.setError("Você não pode se excluir");
      return;
    }

    realm.write(() => {
      if (selectedUserAccount) {
        selectedUserAccount.sync_status = "DELETED" as never;
        selectedUserAccount.local_updated_at = new Date();
        enqueue(realm, "USER_ACCOUNT_DELETE", {
          client_id: selectedUserAccount.client_id,
          server_id: selectedUserAccount.server_id,
          person_client_id: selectedUserAccount.person_client_id,
          person_server_id: selectedUserAccount.person_server_id,
        });
      }

      if (selectedEmployee) {
        selectedEmployee.sync_status = "DELETED" as never;
        selectedEmployee.local_updated_at = new Date();
        enqueue(realm, "EMPLOYEE_DELETE", {
          client_id: selectedEmployee.client_id,
          server_id: selectedEmployee.server_id,
          person_client_id: selectedEmployee.person_client_id,
          person_server_id: selectedEmployee.person_server_id,
        });
      }

      selectedPerson.sync_status = "DELETED" as never;
      selectedPerson.local_updated_at = new Date();
      enqueue(realm, "PERSON_DELETE", {
        client_id: selectedPerson.client_id,
        server_id: selectedPerson.server_id,
        person_client_id: selectedPerson.client_id,
        person_server_id: selectedPerson.server_id,
        cpf: selectedPerson.cpf,
      });
    });

    selection.setSelectedEmployeeClientId(null);
    selection.setSelectedPersonClientId(null);
    feedback.setMessage("Usuário removido");
  };

  return {
    handleCreatePerson,
    handleUpdatePersonAndEmployee,
    handleDeleteEmployee,
    handleDeletePerson,
  };
};
