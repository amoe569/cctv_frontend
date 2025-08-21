import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import CameraDetail from './pages/CameraDetail/CameraDetail';
import CameraManagement from './pages/CameraManagement/CameraManagement';
import EventManagement from './pages/EventManagement/EventManagement';
import VideoList from './pages/VideoList/VideoList';
import './App.css';

// 다크 테마 설정
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: '#1a1a1a',
      paper: '#2d2d2d',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/camera/:id" element={<CameraDetail />} />
            <Route path="/cameras" element={<CameraManagement />} />
            <Route path="/events" element={<EventManagement />} />
            <Route path="/videos" element={<VideoList />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
