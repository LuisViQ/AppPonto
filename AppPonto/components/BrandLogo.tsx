import React from 'react';
import { Text } from 'react-native';

import { Box } from '@/components/ui/box';

type BrandLogoProps = {
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  align?: 'left' | 'center';
};

const SIZE_CLASSES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export default function BrandLogo({
  size = 'md',
  subtitle,
  align = 'left',
}: BrandLogoProps) {
  const alignment = align === 'center' ? 'items-center' : 'items-start';

  return (
    <Box className={alignment}>
      <Text className={`${SIZE_CLASSES[size]} font-semibold text-slate-50`}>
        <Text className="text-cyan-400">Ponto</Text>
        <Text className="text-amber-300">Gestor</Text>
      </Text>
      {subtitle ? (
        <Text className="text-slate-400 text-xs mt-1">{subtitle}</Text>
      ) : null}
    </Box>
  );
}
