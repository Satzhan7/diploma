import React from 'react';
import { IconType, IconBaseProps } from 'react-icons';
import { Box, IconButton, IconButtonProps, BoxProps } from '@chakra-ui/react';

// Extend BoxProps to include Chakra UI style props
interface IconWrapperProps extends BoxProps { 
  icon: IconType;
  size?: string | number; // Size for the icon itself
  // color is already part of BoxProps
  // className?: string; // className is part of BoxProps
}

export const IconWrapper = React.forwardRef<HTMLSpanElement, IconWrapperProps>(({ 
  icon: Icon, 
  size = "1.5em", // Default icon size
  // color = "currentColor", // Use default color from BoxProps
  // className, // Use default className from BoxProps
  ...props // Spread the rest of the props (including mt, flexShrink, etc.)
}, ref) => {
  const IconComponent = Icon as React.ComponentType<IconBaseProps>;
  
  return (
    <Box 
      ref={ref}
      as="span" 
      // className={className} // Handled by props
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      {...props} // Spread all props, including style props like mt, color, flexShrink
    >
      {/* Pass only relevant props to the actual icon component */}
      <IconComponent size={size as string} color={props.color as string} />
    </Box>
  );
});

IconWrapper.displayName = 'IconWrapper';

type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg';

// Custom component for IconButton that works with react-icons
export const IconButtonWithWrapper = React.forwardRef<HTMLButtonElement, Omit<IconButtonProps, 'icon'> & { icon: IconType }>(({ 
  icon: Icon, 
  'aria-label': ariaLabel,
  size = "md",
  ...props 
}, ref) => {
  const IconComponent = Icon as React.ComponentType<IconBaseProps>;
  
  const getIconSize = (buttonSize: IconButtonSize): string => {
    const sizes = {
      xs: "0.75em",
      sm: "1em",
      md: "1.25em",
      lg: "1.5em"
    };
    return sizes[buttonSize] || sizes.md;
  };

  return (
    <IconButton 
      ref={ref}
      aria-label={ariaLabel || ""}
      icon={<IconComponent size={getIconSize(size as IconButtonSize)} />}
      size={size}
      {...props} 
    />
  );
});

IconButtonWithWrapper.displayName = 'IconButtonWithWrapper'; 