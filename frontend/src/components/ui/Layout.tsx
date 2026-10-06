import React from 'react';
import { Box, BoxProps, Grid, GridProps, Heading, Text, Flex, Stack, StackProps } from '@chakra-ui/react';
import { layout } from '../../theme';

type ContainerSize = 'narrow' | 'default' | 'wide';

interface PageContainerProps extends StackProps {
  size?: ContainerSize;
}

// The page's content column: one of three widths (docs/PROJECT.md §7), centred in
// the area beside the sidebar, with one vertical rhythm (layout.section) between the
// header and each section. AppShell owns the page padding, so this only caps width.
export const PageContainer: React.FC<PageContainerProps> = ({ size = 'default', ...rest }) => (
  <Stack w="full" maxW={`container.${size}`} mx="auto" spacing={layout.section} {...rest} />
);

interface SectionProps extends Omit<BoxProps, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

// A page section: optional h2 + description + actions above its content.
export const Section: React.FC<SectionProps> = ({ title, description, actions, children, ...rest }) => (
  <Box as="section" minW={0} {...rest}>
    {(title || actions) && (
      <Flex justify="space-between" align="center" gap={4} wrap="wrap" mb={4}>
        <Box minW={0}>
          {title && (
            <Heading as="h2" textStyle="h2">
              {title}
            </Heading>
          )}
          {description && (
            <Text textStyle="small" color="fg.muted" mt={1} maxW="container.prose">
              {description}
            </Text>
          )}
        </Box>
        {actions}
      </Flex>
    )}
    {children}
  </Box>
);

interface ResponsiveGridProps extends GridProps {
  /** Smallest card width before the grid drops a column. */
  min?: 'kpi' | 'card' | 'wide';
}

// Smallest card widths: KPI 220, cards 300, wide cards 360. KPI rows auto-fit (a few
// cards share the row); card lists auto-fill (same card width on every page).
const MIN = { kpi: '220px', card: '300px', wide: '360px' };

// Auto-fill grid: as many columns as fit at `min` width, never wider than the container.
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ min = 'card', ...rest }) => (
  <Grid
    templateColumns={
      min === 'kpi'
        ? { base: 'repeat(2, minmax(0, 1fr))', md: `repeat(auto-fit, minmax(${MIN.kpi}, 1fr))` }
        : `repeat(auto-fill, minmax(min(100%, ${MIN[min]}), 1fr))`
    }
    gap={layout.grid}
    {...rest}
  />
);
