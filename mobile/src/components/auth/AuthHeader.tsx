import React from 'react';
import { ViewStyle } from 'react-native';
import { PumpDeskBrandLogo } from '@/components/ui/PumpDeskLogo';

export interface AuthHeaderProps {
  showForOperators?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  showForOperators = true,
  compact = false,
  style,
}) => {
  return (
    <PumpDeskBrandLogo
      size={compact ? 28 : 56}
      showWordmark={true}
      showBadge={showForOperators}
      compact={compact}
      style={style}
    />
  );
};
