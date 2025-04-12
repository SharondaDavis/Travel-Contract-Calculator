import React from 'react';
import { createRoot } from 'react-dom/client';
import { DemoPage } from './components/distance-calculator/DemoPage';
import './index.css';

// Create a demo page for the Distance Calculator
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DemoPage />
  </React.StrictMode>
);
