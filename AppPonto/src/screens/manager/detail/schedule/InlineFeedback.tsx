import React from "react";
import { Text } from "react-native";

import { Box } from "@/components/ui/box";

export function InlineFeedback({
  message,
  error,
}: {
  message?: string | null;
  error?: string | null;
}) {
  return (
    <>
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
    </>
  );
}
