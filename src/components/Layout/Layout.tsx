import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Event as EventIcon,
  VideoLibrary as VideoIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/' },
    { text: '이벤트 관리', icon: <EventIcon />, path: '/events' },
    { text: '저장 영상', icon: <VideoIcon />, path: '/videos' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      {/* 상단 앱바 */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            CCTV AI 관제 시스템
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            admin@example.com
          </Typography>
        </Toolbar>
      </AppBar>

      {/* 사이드바 */}
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#2d2d2d',
            borderRight: '1px solid #444',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  mx: 1,
                  borderRadius: 2,
                  backgroundColor:
                    location.pathname === item.path ? '#667eea' : 'transparent',
                  '&:hover': {
                    backgroundColor:
                      location.pathname === item.path ? '#5a6fd8' : '#444',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* 메인 콘텐츠 */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
