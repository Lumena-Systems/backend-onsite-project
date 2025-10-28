import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { ApiDocs } from './pages/ApiDocs';
import { Webhooks } from './pages/Webhooks';
import { DataManagement } from './pages/DataManagement';
import { Monitoring } from './pages/Monitoring';
import { TestingScenarios } from './pages/TestingScenarios';
import { LatencyTests } from './pages/LatencyTests';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/docs" element={<ApiDocs />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/data" element={<DataManagement />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/scenarios" element={<TestingScenarios />} />
          <Route path="/latency" element={<LatencyTests />} />
        </Routes>
      </Layout>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#363636',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </Router>
  );
}

export default App;

