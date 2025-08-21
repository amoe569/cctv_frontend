import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiService, { Camera, Event } from '../../services/api';
import { getCameraStatusColor, getCameraStatusIcon, CAMERA_STATUS_OPTIONS } from '../../utils/cameraUtils';

// Leaflet 아이콘 문제 해결
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 카메라 상태 변경
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusChanging, setStatusChanging] = useState(false);

  useEffect(() => {
    loadCameras();
    setupSSE();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const data = await apiService.getCameras();
      setCameras(data);
    } catch (err) {
      setError('카메라 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('카메라 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    console.log('🔌 Dashboard SSE 연결 설정 중...');
    
    const eventSource = apiService.createEventStream();
    
    eventSource.onopen = () => {
      console.log('✅ Dashboard SSE 연결 성공');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data: Event = JSON.parse(event.data);
        console.log('📡 Dashboard SSE 이벤트 수신:', data);
        
        // 알림 표시
        showNotification(
          `${data.cameraName}에서 ${data.type} 이벤트 발생`,
          'info'
        );
        
        // 카메라 상태 업데이트 (WARNING 상태로 변경된 경우)
        if (data.type === 'traffic_heavy') {
          console.log(`🚨 카메라 ${data.cameraId} 상태를 WARNING으로 변경`);
          setCameras(prev => prev.map(camera => 
            camera.id === data.cameraId 
              ? { ...camera, status: 'WARNING' as const }
              : camera
          ));
        }
        
        // 카메라 목록 새로고침 (최신 상태 반영)
        loadCameras();
        
      } catch (err) {
        console.error('❌ Dashboard SSE 이벤트 파싱 오류:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ Dashboard SSE 연결 오류:', error);
      
      // 3초 후 재연결 시도
      setTimeout(() => {
        console.log('🔄 Dashboard SSE 재연결 시도...');
        setupSSE();
      }, 3000);
    };

    return () => {
      console.log('🔌 Dashboard SSE 연결 해제');
      eventSource.close();
    };
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleStatusChange = async () => {
    if (!selectedCamera || !selectedStatus) {
      showNotification('카메라와 상태를 선택해주세요.', 'error');
      return;
    }

    try {
      setStatusChanging(true);
      const updatedCamera = await apiService.updateCameraStatus(selectedCamera, selectedStatus);
      
      // 카메라 목록 업데이트
      setCameras(prev => prev.map(camera => 
        camera.id === selectedCamera ? updatedCamera : camera
      ));
      
      showNotification(`${updatedCamera.name}의 상태가 ${selectedStatus}로 변경되었습니다.`, 'success');
      setSelectedCamera('');
      setSelectedStatus('');
    } catch (err) {
      showNotification('카메라 상태 변경에 실패했습니다.', 'error');
      console.error('상태 변경 오류:', err);
    } finally {
      setStatusChanging(false);
    }
  };

  // 카메라 상태별 마커 색상
  const getMarkerIcon = (camera: Camera) => {
    const color = getCameraStatusColor(camera.status);
    return new L.DivIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        대시보드
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 카메라 상태 변경 패널 */}
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              ⚙️ 카메라 상태 변경
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>카메라 선택</InputLabel>
                <Select
                  value={selectedCamera}
                  onChange={(e) => setSelectedCamera(e.target.value)}
                  label="카메라 선택"
                >
                  {cameras.map((camera) => (
                    <MenuItem key={camera.id} value={camera.id}>
                      {getCameraStatusIcon(camera.status)} {camera.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>상태 선택</InputLabel>
                <Select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  label="상태 선택"
                >
                  {CAMERA_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                onClick={handleStatusChange}
                disabled={statusChanging || !selectedCamera || !selectedStatus}
              >
                {statusChanging ? '변경 중...' : '상태 변경'}
              </Button>
            </Box>
          </Paper>
        </Box>

        {/* 지도 */}
        <Box>
          <Paper sx={{ p: 2, height: 600 }}>
            <Typography variant="h6" gutterBottom>
              카메라 위치 및 상태
            </Typography>
            <Box sx={{ height: 'calc(100% - 40px)' }}>
              <MapContainer
                center={[36.8218, 127.1530]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {cameras.map((camera) => (
                  <Marker
                    key={camera.id}
                    position={[camera.lat, camera.lng]}
                    icon={getMarkerIcon(camera)}
                  >
                    <Popup>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {camera.name}
                        </Typography>
                        <Typography variant="body2">
                          상태: {getCameraStatusIcon(camera.status)} {camera.status}
                        </Typography>
                        <Typography variant="body2">
                          위치: {camera.lat}, {camera.lng}
                        </Typography>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={{ mt: 1 }}
                          onClick={() => navigate(`/camera/${camera.id}`)}
                        >
                          상세보기
                        </Button>
                      </Box>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Box>
          </Paper>
        </Box>

        {/* 카메라 통계 */}
        <Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              카메라 현황
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
              {CAMERA_STATUS_OPTIONS.map((status) => {
                const count = cameras.filter(camera => camera.status === status.value).length;
                return (
                  <Box
                    key={status.value}
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      border: `2px solid ${status.color}`,
                    }}
                  >
                    <Typography variant="h4" sx={{ color: status.color }}>
                      {count}
                    </Typography>
                    <Typography variant="body2">
                      {status.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* 알림 스낵바 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
