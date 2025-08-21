import React, { useState } from 'react';
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
  Chip,
  Tooltip,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCameraStatusColor, getCameraStatusIcon, CAMERA_STATUS_OPTIONS } from '../../utils/cameraUtils';
import useRealtimeCamera from '../../hooks/useRealtimeCamera';
import useNotification from '../../hooks/useNotification';
import LoadingFallback from '../../components/LoadingFallback/LoadingFallback';
import AlertModal from '../../components/AlertModal/AlertModal';
import useAlertModal from '../../hooks/useAlertModal';

// Leaflet 아이콘 문제 해결
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // 알람 모달 관리 (먼저 선언)
  const { 
    currentAlert, 
    isOpen: isAlertOpen, 
    showEventAlert, 
    showCameraStatusAlert, 
    closeAlert 
  } = useAlertModal({
    defaultAutoClose: 10000, // 10초 자동 닫기
    maxAlerts: 5
  });

  // 실시간 카메라 데이터 및 알림 관리
  const { 
    cameras, 
    loading, 
    error, 
    lastUpdated, 
    isConnected, 
    updateCameraStatus,
    getCameraCountByStatus,
    reconnectSSE,
    loadCameras 
  } = useRealtimeCamera({ 
    autoRefreshInterval: 5000, // 5초마다 자동 새로고침 (빠른 반영)
    showNotifications: true,
    onEventAlert: showEventAlert, // 이벤트 알람 모달
    onCameraStatusAlert: showCameraStatusAlert // 카메라 상태 알람 모달
  });
  
  const { notifications, removeNotification } = useNotification();
  
  // 카메라 상태 변경
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusChanging, setStatusChanging] = useState(false);

  // 카메라 상태 변경 핸들러
  const handleStatusChange = async () => {
    if (!selectedCamera || !selectedStatus) {
      return;
    }

    try {
      setStatusChanging(true);
      await updateCameraStatus(selectedCamera, selectedStatus);
      
      // 선택 초기화
      setSelectedCamera('');
      setSelectedStatus('');
    } catch (err) {
      console.error('상태 변경 오류:', err);
    } finally {
      setStatusChanging(false);
    }
  };



  // 카메라 상태별 마커 색상
  const getMarkerIcon = (camera: any) => {
    const color = getCameraStatusColor(camera.status);
    return new L.DivIcon({
      html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`,
      className: 'custom-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // 카메라 상태 통계
  const cameraStats = getCameraCountByStatus();

  if (loading) {
    return (
      <LoadingFallback
        message="카메라 데이터를 불러오는 중..."
        onRefresh={loadCameras}
        timeout={8000}
      />
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => loadCameras()}>
              다시 시도
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          대시보드
        </Typography>
        
        {/* 실시간 연결 상태 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title={isConnected ? "실시간 연결 활성" : "연결 끊김 - 클릭하여 재연결"}>
            <Chip
              label={isConnected ? "🟢 실시간" : "🔴 오프라인"}
              color={isConnected ? "success" : "error"}
              size="small"
              onClick={!isConnected ? reconnectSSE : undefined}
              sx={{ cursor: !isConnected ? 'pointer' : 'default' }}
            />
          </Tooltip>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              마지막 업데이트: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 카메라 상태 변경과 현황을 한 줄에 배치 */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {/* 카메라 상태 변경 패널 */}
          <Box sx={{ flex: '1 1 450px', minWidth: '450px' }}>
            <Paper sx={{ p: 1.5, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', mb: 1 }}>
                ⚙️ 카메라 상태 변경
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 160 }}>
                  <InputLabel>카메라 선택</InputLabel>
                  <Select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    label="카메라 선택"
                    size="small"
                  >
                    {cameras.map((camera) => (
                      <MenuItem key={camera.id} value={camera.id}>
                        {getCameraStatusIcon(camera.status)} {camera.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl sx={{ minWidth: 110 }}>
                  <InputLabel>상태 선택</InputLabel>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    label="상태 선택"
                    size="small"
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
                  size="small"
                  sx={{ px: 2 }}
                >
                  {statusChanging ? '변경 중...' : '상태 변경'}
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* 카메라 현황 통계 - 5개 상태 */}
          <Box sx={{ flex: '0 1 400px', minWidth: '400px', maxWidth: '450px' }}>
            <Paper sx={{ p: 1.5, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', mb: 1 }}>
                📊 카메라 현황
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 0.8, flexWrap: 'wrap' }}>
                {CAMERA_STATUS_OPTIONS.map((status) => {
                  const count = cameraStats[status.value] || 0;
                  return (
                    <Box
                      key={status.value}
                      sx={{
                        textAlign: 'center',
                        p: 0.8,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        border: `2px solid ${status.color}`,
                        minWidth: '45px',
                        flex: '1 1 auto',
                        maxWidth: '18%', // 5개가 한 줄에 들어가도록
                        transition: 'transform 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      <Typography variant="h6" sx={{ color: status.color, fontWeight: 'bold', mb: 0.2, fontSize: '1.2rem' }}>
                        {count}
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.55rem', fontWeight: 'medium', lineHeight: 1.1 }}>
                        {status.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        </Box>

        {/* 지도 */}
        <Box>
          <Paper sx={{ p: 2, height: 600 }}>
            <Typography variant="h6" gutterBottom>
              🗺️ 카메라 위치 및 상태
            </Typography>
                                    <Box sx={{ height: 'calc(100% - 40px)' }}>
                          <MapContainer
                            center={[36.8365730, 127.1456889]}
                            zoom={13}
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
      </Box>

      {/* 실시간 알림 스낵바 */}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: `${notifications.indexOf(notification) * 70}px` }}
        >
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}

      {/* 알람 모달 */}
      <AlertModal
        alert={currentAlert}
        open={isAlertOpen}
        onClose={closeAlert}
        onViewCamera={(cameraId) => navigate(`/camera/${cameraId}`)}
      />
    </Box>
  );
};

export default Dashboard;
