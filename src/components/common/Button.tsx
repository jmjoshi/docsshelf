import React from 'react';
import { Button as PaperButton } from 'react-native-paper';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
}) => {
  return (
    <PaperButton mode={mode} onPress={onPress}>
      {title}
    </PaperButton>
  );
};
