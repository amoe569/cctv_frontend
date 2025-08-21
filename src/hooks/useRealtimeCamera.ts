import { useState, useEffect, useCallback, useRef } from 'react';
import apiService, { Camera, Event } from '../services/api';
import useSSE from './useSSE';
import useNotification from './useNotification';

interface RealtimeCameraOptions {
  autoRefreshInterval?: number;
  showNotifications?: boolean;
  onEventAlert?: (eventData: any) => void;
  onCameraStatusAlert?: (cameraName: string, oldStatus: string, newStatus: string) => void;
}

export const useRealtimeCamera = (options: RealtimeCameraOptions = {}) => {
  const { 
    autoRefreshInterval = 60000, 
    showNotifications = true,
    onEventAlert,
    onCameraStatusAlert 
  } = options; // 60초마다 자동 새로고침
  
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const loadingRef = useRef(false);
  const { addNotification, showEventNotification, showCameraStatusNotification } = useNotification();

  // 카메라 데이터 로드
  const loadCameras = useCallback(async (silent = false) => {
    if (loadingRef.current) {
      console.log('⏳ 이미 카메라 데이터 로딩 중...');
      return;
    }

    try {
      loadingRef.current = true;
      if (!silent) setLoading(true);
      
      console.log('📡 카메라 데이터 로드 중...');
      const data = await apiService.getCameras();
      
      // 상태 변화 감지 및 알림 (현재 상태와 비교)
      if (showNotifications) {
        setCameras(prevCameras => {
          if (prevCameras.length > 0) {
            data.forEach(newCamera => {
              const oldCamera = prevCameras.find(c => c.id === newCamera.id);
              if (oldCamera && oldCamera.status !== newCamera.status) {
                // 기존 토스트 알림
                showCameraStatusNotification(newCamera.name, oldCamera.status, newCamera.status);
                // 새로운 알람 모달
                onCameraStatusAlert?.(newCamera.name, oldCamera.status, newCamera.status);
              }
            });
          }
          return data;
        });
      } else {
        setCameras(data);
      }
      
      setError(null);
      setLastUpdated(new Date());
      console.log(`✅ 카메라 데이터 로드 완료: ${data.length}개`);
      
    } catch (err) {
      const errorMessage = '카메라 데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 카메라 로드 오류:', err);
      
      if (showNotifications) {
        addNotification(errorMessage, 'error');
      }
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [showNotifications, addNotification, showCameraStatusNotification]);

  // 개별 카메라 상태 업데이트
  const updateCameraStatus = useCallback(async (cameraId: string, newStatus: string) => {
    try {
      console.log(`🔄 카메라 ${cameraId} 상태 변경: ${newStatus}`);
      const updatedCamera = await apiService.updateCameraStatus(cameraId, newStatus);
      
      setCameras(prev => {
        const oldCamera = prev.find(c => c.id === cameraId);
        const updated = prev.map(camera => 
          camera.id === cameraId ? updatedCamera : camera
        );
        
        // 상태 변경 알림
        if (showNotifications && oldCamera && oldCamera.status !== newStatus) {
          showCameraStatusNotification(updatedCamera.name, oldCamera.status, newStatus);
        }
        
        return updated;
      });
      
      return updatedCamera;
    } catch (err) {
      console.error(`❌ 카메라 ${cameraId} 상태 변경 실패:`, err);
      if (showNotifications) {
        addNotification('카메라 상태 변경에 실패했습니다.', 'error');
      }
      throw err;
    }
  }, [showNotifications, addNotification, showCameraStatusNotification]);

  // 특정 카메라 찾기
  const getCameraById = useCallback((cameraId: string) => {
    return cameras.find(camera => camera.id === cameraId);
  }, [cameras]);

  // 상태별 카메라 개수
  const getCameraCountByStatus = useCallback(() => {
    return cameras.reduce((acc, camera) => {
      acc[camera.status] = (acc[camera.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [cameras]);

  // SSE 이벤트 처리
  const handleSSEMessage = useCallback((data: Event) => {
    console.log('📡 실시간 이벤트 수신:', data);
    
    // 이벤트 알림 표시
    if (showNotifications) {
      showEventNotification(data);
      // 알람 모달도 표시
      onEventAlert?.(data);
    }
    
    // 카메라 상태 업데이트 (traffic_heavy 이벤트 시 WARNING 상태로)
    if (data.type === 'traffic_heavy' && data.cameraId) {
      setCameras(prev => prev.map(camera => 
        camera.id === data.cameraId 
          ? { ...camera, status: 'WARNING' as const }
          : camera
      ));
      console.log(`🚨 카메라 ${data.cameraId} 상태를 WARNING으로 변경`);
    }
    
    // SSE 이벤트는 이미 실시간 업데이트되므로 추가 로딩 불필요
    
  }, [showNotifications, showEventNotification]);

  const handleSSEError = useCallback((error: globalThis.Event) => {
    console.error('❌ SSE 연결 오류:', error);
    if (showNotifications) {
      addNotification('실시간 연결이 끊어졌습니다. 재연결 중...', 'warning');
    }
  }, [showNotifications, addNotification]);

  const handleSSEOpen = useCallback(() => {
    console.log('✅ 실시간 연결이 복구되었습니다.');
    if (showNotifications) {
      addNotification('실시간 연결이 복구되었습니다.', 'success');
    }
  }, [showNotifications, addNotification]);

  // SSE 연결 - 빠른 재연결 설정
  const { isConnected, reconnect } = useSSE({
    onMessage: handleSSEMessage,
    onError: handleSSEError,
    onOpen: handleSSEOpen,
    reconnectDelay: 500, // 0.5초로 단축
    maxReconnectAttempts: 15 // 더 많은 재시도
  });

  // 초기 로드 및 주기적 새로고침
  useEffect(() => {
    loadCameras();
    
    // 주기적 새로고침 (백그라운드)
    const refreshInterval = setInterval(() => {
      console.log('🔄 주기적 카메라 데이터 새로고침');
      loadCameras(true);
    }, autoRefreshInterval);

    return () => {
      clearInterval(refreshInterval);
    };
  }, [loadCameras, autoRefreshInterval]);

  return {
    cameras,
    loading,
    error,
    lastUpdated,
    isConnected: isConnected(),
    loadCameras,
    updateCameraStatus,
    getCameraById,
    getCameraCountByStatus,
    reconnectSSE: reconnect
  };
};

export default useRealtimeCamera;
