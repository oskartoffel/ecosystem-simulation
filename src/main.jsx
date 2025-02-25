import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import DebugInterface from './visualization/DebugInterface';

const rootElement = document.getElementById('root');
const existingRoot = rootElement._reactRoot;

if (existingRoot) {
  existingRoot.render(
    <React.StrictMode>
      <DebugInterface />
    </React.StrictMode>
  );
} else {
  const root = createRoot(rootElement);
  rootElement._reactRoot = root;
  root.render(
    <React.StrictMode>
      <DebugInterface />
    </React.StrictMode>
  );
}