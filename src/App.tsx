import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DMAAnalyzer from './pages/dma-check-status/page_layout';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<DMAAnalyzer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
