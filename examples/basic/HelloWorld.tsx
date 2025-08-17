import React from 'react';

interface HelloWorldProps {
  name?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ name = 'World' }) => {
  return (
    <div>
      <h1>Hello, {name}!</h1>
      <p>Welcome to React Testing Library</p>
    </div>
  );
};

export default HelloWorld;