import './App.css'
import { BrowserRouter, HashRouter } from 'react-router-dom';
import Routes from '@/routes';

function App() {

  return (
    <HashRouter>
      <Routes />
    </HashRouter>
  )
}

export default App
