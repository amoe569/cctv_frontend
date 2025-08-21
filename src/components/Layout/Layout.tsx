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
  Videocam as VideocamIcon,
  Event as EventIcon,

} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 250; // 네비게이션 창 가로 늘림

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/' },
    { text: '카메라 관리', icon: <VideocamIcon />, path: '/cameras' },
    { text: '이벤트 관리', icon: <EventIcon />, path: '/events' },
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
          <List sx={{ px: 1 }}>
            {menuItems.map((item) => (
              <ListItem
                key={item.text}
                onClick={() => navigate(item.path)}
                sx={{
                  cursor: 'pointer',
                  mx: 1,
                  my: 0.5,
                  px: 2, // 버튼 내부 좌우 패딩 줄임
                  py: 1.5, // 버튼 내부 상하 패딩 조정
                  borderRadius: 2,
                  minHeight: 48, // 최소 높이 설정
                  maxWidth: '90%', // 버튼 최대 가로 제한
                  backgroundColor:
                    location.pathname === item.path ? '#667eea' : 'transparent',
                  '&:hover': {
                    backgroundColor:
                      location.pathname === item.path ? '#5a6fd8' : '#444',
                    transform: 'translateX(4px)', // 호버 시 살짝 이동 효과
                  },
                  transition: 'all 0.2s ease-in-out', // 부드러운 전환 효과
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: 'inherit',
                    minWidth: 36, // 아이콘 영역 가로 줄임
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontSize: '0.9rem', // 텍스트 크기 살짝 줄임
                      fontWeight: location.pathname === item.path ? 600 : 400,
                    }
                  }}
                />
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
