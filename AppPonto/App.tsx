import { useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { RealmProvider, useRealm } from '@/src/databases/RealmProvider';
import { AppMeta } from '@/src/databases/schemas';
import { getMetaValue, META_KEYS } from '@/src/services/appMetaService';
import { useSyncWorker } from '@/src/services/syncWorker';
import LoginScreen from '@/src/screens/LoginScreen';
import ManagerScreen from '@/src/screens/ManagerScreen';
import '@/global.css';

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

function AppContent() {
  const realm = useRealm();
  const [hasToken, setHasToken] = useState<boolean>(() =>
    Boolean(getMetaValue(realm, META_KEYS.authToken)),
  );

  useEffect(() => {
    const results = realm
      .objects<AppMeta>('AppMeta')
      .filtered('key == $0', META_KEYS.authToken);

    const update = () => {
      const token = getMetaValue(realm, META_KEYS.authToken);
      setHasToken(Boolean(token));
    };

    update();
    results.addListener(update);

    return () => {
      results.removeListener(update);
    };
  }, [realm]);

  useSyncWorker(realm, { enabled: hasToken, intervalMs: 60000 });

  return hasToken ? <ManagerScreen /> : <LoginScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="dark">
        <RealmProvider>
          <StatusBar style="light" />
          <AppContent />
        </RealmProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
