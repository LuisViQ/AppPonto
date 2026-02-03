import React, { createContext, useContext, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type Realm from 'realm';

import { getRealm } from './realm';

const RealmContext = createContext<Realm | null>(null);

type RealmProviderProps = {
  children: React.ReactNode;
};

export function RealmProvider({ children }: RealmProviderProps) {
  const [realm, setRealm] = useState<Realm | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getRealm()
      .then((instance) => {
        if (isMounted) {
          setRealm(instance);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      realm?.close();
    };
  }, [realm]);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-4">
        <Text className="text-base font-semibold text-slate-50 mb-2">
          Realm error
        </Text>
        <Text className="text-slate-300 text-center">{error}</Text>
      </View>
    );
  }

  if (!realm) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900 p-4">
        <Text className="text-slate-300 text-center">Loading database...</Text>
      </View>
    );
  }

  return (
    <RealmContext.Provider value={realm}>{children}</RealmContext.Provider>
  );
}

export function useRealm() {
  const realm = useContext(RealmContext);
  if (!realm) {
    throw new Error('RealmProvider is missing');
  }
  return realm;
}
