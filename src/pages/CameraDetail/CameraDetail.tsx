import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import apiService, { Camera, Event } from '../../services/api';
import { getCameraStatusColor, getCameraStatusIcon, getCameraStatusText, CAMERA_STATUS_OPTIONS } from '../../utils/cameraUtils';
import { formatDateTime, formatTime } from '../../utils/eventUtils';
import EventList from '../../components/EventList/EventList';

const CameraDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [camera, setCamera] = useState<Camera | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 스트림 상태
  const [streamError, setStreamError] = useState(false);
  const [streamLoading, setStreamLoading] = useState(true);
  
  // 상태 변경
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [statusChanging, setStatusChanging] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    if (id) {
      loadCameraData();
      setupSSE();
    }
  }, [id]);

  const loadCameraData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [cameraData, eventsData] = await Promise.all([
        apiService.getCameraById(id),
        apiService.getEventsByCamera(id)
      ]);
      
      setCamera(cameraData);
      setEvents(eventsData);
      setSelectedStatus(cameraData.status);
    } catch (err) {
      setError('카메라 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('카메라 데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSSE = () => {
    const eventSource = apiService.createEventStream();
    
    eventSource.onmessage = (event) => {
      try {
        const data: Event = JSON.parse(event.data);
        
        // 현재 카메라의 이벤트만 처리
        if (data.camera.id === id) {
          setEvents(prev => [data, ...prev]);
          
          // 카메라 상태 업데이트
          if (data.type === 'traffic_heavy') {
            setCamera(prev => prev ? { ...prev, status: 'WARNING' } : null);
          }
        }
      } catch (err) {
        console.error('SSE 이벤트 파싱 오류:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  };

  const handleStatusChange = async () => {
    if (!camera || !selectedStatus) return;

    try {
      setStatusChanging(true);
      const updatedCamera = await apiService.updateCameraStatus(camera.id, selectedStatus);
      setCamera(updatedCamera);
      setNotification({
        open: true,
        message: `${updatedCamera.name}의 상태가 ${selectedStatus}로 변경되었습니다.`,
        severity: 'success'
      });
    } catch (err) {
      setNotification({
        open: true,
        message: '카메라 상태 변경에 실패했습니다.',
        severity: 'error'
      });
      console.error('상태 변경 오류:', err);
    } finally {
      setStatusChanging(false);
    }
  };

  const handleStreamLoad = () => {
    setStreamLoading(false);
    setStreamError(false);
  };

  const handleStreamError = () => {
    setStreamLoading(false);
    setStreamError(true);
  };

  const retryStream = () => {
    setStreamLoading(true);
    setStreamError(false);
    // 강제로 이미지 새로고침
    const img = document.getElementById('stream-image') as HTMLImageElement;
    if (img) {
      const timestamp = new Date().getTime();
      const randomId = Math.random().toString(36).substr(2, 9);
      img.src = `${apiService.getStreamUrl(id!)}?t=${timestamp}&r=${randomId}`;
    }
  };

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!camera) return <Alert severity="error">카메라를 찾을 수 없습니다.</Alert>;

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{ mr: 2 }}
        >
          돌아가기
        </Button>
        <Typography variant="h4">
          {camera.name}
        </Typography>
        <Chip
          label={`${getCameraStatusIcon(camera.status)} ${getCameraStatusText(camera.status)}`}
          sx={{
            ml: 2,
            backgroundColor: getCameraStatusColor(camera.status),
            color: 'white',
          }}
        />
      </Box>

      {/* 카메라 정보 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          <Box>
            <Typography variant="body2" color="textSecondary">위치</Typography>
            <Typography variant="body1">{camera.lat}, {camera.lng}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">RTSP URL</Typography>
            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
              {camera.rtspUrl || 'N/A'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">등록일</Typography>
            <Typography variant="body1">{formatDateTime(camera.createdAt)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">수정일</Typography>
            <Typography variant="body1">{formatDateTime(camera.updatedAt)}</Typography>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
        {/* 스트림 영상 */}
        <Box sx={{ flex: { xs: 1, lg: 2 } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              실시간 스트림
            </Typography>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                paddingBottom: '56.25%', // 16:9 비율
                backgroundColor: '#000',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              {!streamError ? (
                <img
                  id="stream-image"
                  src={`${apiService.getStreamUrl(camera.id)}?t=${Date.now()}`}
                  alt="실시간 스트림"
                  onLoad={handleStreamLoad}
                  onError={handleStreamError}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : null}
              
              {(streamLoading || streamError) && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    color: 'white',
                  }}
                >
                  <Typography variant="h3" sx={{ mb: 2 }}>📹</Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    {streamLoading ? '스트림 연결 중...' : '스트림 연결 실패'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
                    Python Detector가 실행 중인지 확인하세요<br />
                    스트림 URL: {apiService.getStreamUrl(camera.id)}
                  </Typography>
                  {streamError && (
                    <Button variant="contained" onClick={retryStream}>
                      재시도
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </Box>

        {/* 이벤트 패널 */}
        <Box sx={{ flex: { xs: 1, lg: 1 } }}>
          <Paper sx={{ p: 2, height: 'fit-content' }}>
            {/* 상태 변경 패널 */}
            <Box sx={{ mb: 3, p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                ⚙️ 카메라 상태 변경
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 120, flex: 1 }}>
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
                  disabled={statusChanging || selectedStatus === camera.status}
                  size="small"
                >
                  {statusChanging ? '변경 중...' : '변경'}
                </Button>
              </Box>
            </Box>

            {/* 이벤트 목록 */}
            <Typography variant="h6" gutterBottom>
              실시간 이벤트 ({events.length})
            </Typography>
            <EventList events={events} maxHeight="400px" />
          </Paper>
        </Box>
      </Box>

      {/* 알림 스낵바 */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
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

export default CameraDetail;
