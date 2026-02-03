import { useEffect, useState } from 'react';
import type Realm from 'realm';

import type {
  Employee,
  JobPosition,
  Person,
  UserAccount,
  Schedule,
  ScheduleHour,
} from '@/src/databases/schemas';

export function useRealmCollections(realm: Realm) {
  const [persons, setPersons] = useState<Person[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleHours, setScheduleHours] = useState<ScheduleHour[]>([]);

  const filterActive = <T extends { sync_status?: string; isValid?: () => boolean }>(
    items: T[],
  ) =>
    items.filter((item) => {
      if (item?.isValid && !item.isValid()) {
        return false;
      }
      return item.sync_status !== 'DELETED';
    });

  useEffect(() => {
    const results = realm.objects<Person>('Person').sorted('name');
    const update = () => setPersons(filterActive(Array.from(results)));
    update();
    results.addListener(update);
    return () => results.removeListener(update);
  }, [realm]);

  useEffect(() => {
    const results = realm.objects<JobPosition>('JobPosition').sorted('name');
    const update = () => setJobPositions(filterActive(Array.from(results)));
    update();
    results.addListener(update);
    return () => results.removeListener(update);
  }, [realm]);

  useEffect(() => {
    const results = realm.objects<UserAccount>('UserAccount').sorted('username');
    const update = () => setUserAccounts(filterActive(Array.from(results)));
    update();
    results.addListener(update);
    return () => results.removeListener(update);
  }, [realm]);

  useEffect(() => {
    const results = realm.objects<Employee>('Employee');
    const update = () => setEmployees(filterActive(Array.from(results)));
    update();
    results.addListener(update);
    return () => results.removeListener(update);
  }, [realm]);

  useEffect(() => {
    const results = realm.objects<Schedule>('Schedule');
    const update = () => setSchedules(filterActive(Array.from(results)));
    update();
    results.addListener(update);
    return () => results.removeListener(update);
  }, [realm]);

  useEffect(() => {
    const results = realm.objects<ScheduleHour>('ScheduleHour');
    const update = () => setScheduleHours(filterActive(Array.from(results)));
    update();
    results.addListener(update);
    return () => results.removeListener(update);
  }, [realm]);

  return {
    persons,
    jobPositions,
    userAccounts,
    employees,
    schedules,
    scheduleHours,
  };
}
