import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Overlay } from '@gluestack-ui/core/overlay/creator';

import { Box } from '@/components/ui/box';

export type SelectOption<T extends string | number> = {
  label: string;
  value: T;
  description?: string;
  tone?: 'danger';
  icon?: keyof typeof Feather.glyphMap;
};

type SelectSheetProps<T extends string | number> = {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
};

export default function SelectSheet<T extends string | number>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecionar',
}: SelectSheetProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const selectedLabel = selectedOption?.label ?? placeholder;
  const selectedIcon = selectedOption?.icon;

  return (
    <>
      <Box className="mb-3">
        {label ? (
          <Text className="text-slate-400 text-xs mb-2">{label}</Text>
        ) : null}
        <Pressable
          className="bg-slate-900 rounded-lg px-3 py-2 flex-row items-center justify-between"
          onPress={() => setOpen(true)}
        >
          <Box className="flex-row items-center">
            {selectedIcon ? (
              <Feather name={selectedIcon} size={14} color="#e2e8f0" />
            ) : null}
            <Text
              className={`text-slate-50 text-sm ${
                selectedIcon ? 'ml-2' : ''
              }`}
            >
              {selectedLabel}
            </Text>
          </Box>
          <Feather name="chevron-down" size={16} color="#94a3b8" />
        </Pressable>
      </Box>

      <Overlay isOpen={open} onRequestClose={() => setOpen(false)} useRNModal>
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="bg-slate-950 rounded-t-2xl px-4 pt-4 pb-6"
            onPress={() => {}}
          >
            <Box className="h-1 w-10 rounded-full bg-slate-700 self-center mb-3" />
            {label ? (
              <Text className="text-slate-100 font-semibold mb-3">
                {label}
              </Text>
            ) : null}
            <ScrollView className="max-h-[50vh]">
              {options.map((option) => {
                const isActive = option.value === value;
                const isDanger = option.tone === 'danger';
                const containerClass = isActive
                  ? isDanger
                    ? 'bg-rose-500/80 border-rose-400/70'
                    : 'bg-blue-600 border-blue-500'
                  : isDanger
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : 'bg-slate-900 border-slate-800';
                const labelClass = isActive
                  ? 'text-slate-50'
                  : isDanger
                    ? 'text-rose-100'
                    : 'text-slate-200';
                const iconColor = isActive
                  ? '#f8fafc'
                  : isDanger
                    ? '#fecdd3'
                    : '#e2e8f0';
                const descriptionClass = isDanger
                  ? 'text-rose-200/80'
                  : 'text-slate-400';
                return (
                  <Pressable
                    key={option.value}
                    className={`rounded-lg px-3 py-3 mb-2 border ${containerClass}`}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <Box className="flex-row items-center">
                      {option.icon ? (
                        <Feather name={option.icon} size={14} color={iconColor} />
                      ) : null}
                      <Text
                        className={`text-sm font-semibold ${labelClass} ${
                          option.icon ? 'ml-2' : ''
                        }`}
                      >
                        {option.label}
                      </Text>
                    </Box>
                    {option.description ? (
                      <Text className={`text-xs mt-1 ${descriptionClass}`}>
                        {option.description}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Overlay>
    </>
  );
}
