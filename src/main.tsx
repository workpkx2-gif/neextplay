import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testFirebaseConnection } from './services/firebase';

// Test connection to Firestore on boot
testFirebaseConnection().catch(() => {});

createRoot(document.getElementById('root')!).render(<App />);
