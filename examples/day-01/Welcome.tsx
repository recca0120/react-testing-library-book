import React from 'react';

interface WelcomeProps {
  name: string;
}

export const Welcome: React.FC<WelcomeProps> = ({ name }) => {
  return <h1>Welcome, {name}!</h1>;
};