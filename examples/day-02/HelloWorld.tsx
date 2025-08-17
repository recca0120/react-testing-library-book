import React from 'react';

interface HelloWorldProps {
  name?: string;
  showTime?: boolean;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({ 
  name = 'World',
  showTime = false 
}) => {
  const currentTime = new Date().toLocaleTimeString();
  
  return (
    <div className="hello-container">
      <h1>Hello, {name}!</h1>
      <p>Welcome to React Testing Library with Vitest</p>
      {showTime && (
        <p className="time">Current time: {currentTime}</p>
      )}
    </div>
  );
};