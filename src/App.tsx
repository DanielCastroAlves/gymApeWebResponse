import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TelaLogin from './pages/login';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TelaLogin />} />
      </Routes>
    </Router>
  );
};

export default App;
