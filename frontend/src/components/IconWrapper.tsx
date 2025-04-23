import React from 'react';
import { IconType, IconBaseProps } from 'react-icons';
import { Box, IconButton, IconButtonProps } from '@chakra-ui/react';

interface IconWrapperProps {
  icon: IconType;
  size?: string | number;
  color?: string;
  className?: string;
}

export const IconWrapper = React.forwardRef<HTMLSpanElement, IconWrapperProps>(({ 
  icon: Icon, 
  size = "1.5em", 
  color = "currentColor",
  className,
  ...props 
}, ref) => {
  const IconComponent = Icon as React.ComponentType<IconBaseProps>;
  
  return (
    <Box 
      ref={ref}
      as="span" 
      className={className}
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      {...props}
    >
      <IconComponent size={size} color={color} />
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