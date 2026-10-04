import React from 'react';
import { Box, List, ListItem, Text } from '@chakra-ui/react';

export interface Step {
  label: string;
  /** Date or hint under the label. */
  caption?: string;
}

interface StepperProps {
  steps: Step[];
  /** Index of the current step; it and every earlier step are filled. */
  current: number;
  label: string;
}

/** Horizontal progress bars with labels (the Deal page stepper). */
export const Stepper: React.FC<StepperProps> = ({ steps, current, label }) => (
  <List aria-label={label} display="grid" gridTemplateColumns={`repeat(${steps.length}, minmax(0, 1fr))`} columnGap={2}>
    {steps.map((step, i) => {
      const done = i <= current;
      return (
        <ListItem key={step.label} aria-current={i === current ? 'step' : undefined} minW={0}>
          <Box h="6px" borderRadius="full" bg={done ? 'success' : 'bg.subtle'} mb={2} />
          <Text
            fontSize="sm"
            fontWeight={i === current ? 700 : 500}
            color={done ? 'fg.default' : 'fg.muted'}
            lineHeight="short"
          >
            {step.label}
            {done && i !== current && (
              <Box as="span" srOnly>
                , ✓
              </Box>
            )}
          </Text>
          {step.caption && (
            <Text fontSize="xs" color="fg.muted" mt={0.5}>
              {step.caption}
            </Text>
          )}
        </ListItem>
      );
    })}
  </List>
);
