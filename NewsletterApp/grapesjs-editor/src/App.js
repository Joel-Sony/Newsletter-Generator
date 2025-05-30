import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GrapesEditor from './components/GrapesEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/editor" element={<GrapesEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
