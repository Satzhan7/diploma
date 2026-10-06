import React from 'react';
import { Box, Button, HStack, StackProps } from '@chakra-ui/react';

export interface Segment<T extends string> {
  value: T;
  label: React.ReactNode;
  /** Accessible name when `label` is short (e.g. "KZ"). */
  ariaLabel?: string;
  lang?: string;
}

interface SegmentedControlProps<T extends string> extends Omit<StackProps, 'onChange'> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md';
}

/** iOS-style segmented control; the selected segment is raised. */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  label,
  size = 'md',
  ...props
}: SegmentedControlProps<T>) {
  return (
    <HStack
      role="group"
      aria-label={label}
      spacing={0}
      bg="bg.subtle"
      borderRadius="md"
      p={0.5}
      w="fit-content"
      maxW="full"
      {...props}
    >
      {segments.map((s) => {
        const on = s.value === value;
        return (
          <Button
            key={s.value}
            type="button"
            lang={s.lang}
            aria-label={s.ariaLabel}
            aria-pressed={on}
            onClick={() => onChange(s.value)}
            size={size === 'sm' ? 'xs' : 'sm'}
            // 28 / 36 + 2 px track padding = control.sm 32 / control.md 40;
            // inner radius = track radius (md 12) − padding.
            h={size === 'sm' ? 7 : 9}
            px={size === 'sm' ? 2.5 : 4}
            borderRadius="10px"
            flexShrink={0}
            variant="unstyled"
            fontWeight="600"
            fontSize={size === 'sm' ? 'xs' : 'sm'}
            bg={on ? 'bg.surface' : 'transparent'}
            color={on ? 'fg.default' : 'fg.muted'}
            boxShadow={on ? 'sm' : 'none'}
            _hover={{ color: 'fg.default' }}
          >
            <Box as="span">{s.label}</Box>
          </Button>
        );
      })}
    </HStack>
  );
}
