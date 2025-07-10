import { createRoot } from 'react-dom/client';
import Landing from './Landing';
import './Landing.module.css';

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<Landing />); 