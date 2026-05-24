import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { apiConfig } from './api/config';
import { seed } from './api/mock/db/store';
import { startMockSimulation } from './api/mock/db/simulator';

// When running against the in-memory mock, seed the DB and start the
// background simulation exactly once, here in bootstrap.
// In production (USE_MOCK=false) neither line runs.
if (apiConfig.useMock) {
  seed();
  startMockSimulation();
}

createRoot(document.getElementById('root')!).render(<App />);
