import { useState, useCallback } from 'react';
import { AlertData } from '../components/AlertModal/AlertModal';

interface AlertModalOptions {
  defaultAutoClose?: number;
  maxAlerts?: number;
}

export const useAlertModal = (options: AlertModalOptions = {}) => {
  const { defaultAutoClose = 8000, maxAlerts = 3 } = options;
  
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [currentAlert, setCurrentAlert] = useState<AlertData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // 알림 생성
  const showAlert = useCallback((alertData: Partial<AlertData>) => {
    const newAlert: AlertData = {
      id: `alert-${Date.now()}-${Math.random()}`,
      type: alertData.type || 'system_error',
      severity: alertData.severity || 'info',
      title: alertData.title || '알림',
      message: alertData.message || '',
      cameraId: alertData.cameraId,
      cameraName: alertData.cameraName,
      timestamp: alertData.timestamp || new Date(),
      autoClose: alertData.autoClose !== undefined ? alertData.autoClose : defaultAutoClose,
    };

    setAlerts(prev => {
      const updated = [...prev, newAlert];
      // 최대 알림 개수 제한
      return updated.slice(-maxAlerts);
    });

    // 현재 열린 알림이 없으면 즉시 표시
    if (!isOpen) {
      setCurrentAlert(newAlert);
      setIsOpen(true);
    }

    return newAlert.id;
  }, [defaultAutoClose, maxAlerts, isOpen]);

  // 이벤트 기반 알림 생성
  const showEventAlert = useCallback((eventData: any) => {
    const { type, cameraId, cameraName } = eventData;
    
    let title = '이벤트 발생';
    let message = '새로운 이벤트가 감지되었습니다.';
    let severity: AlertData['severity'] = 'info';
    
    switch (type) {
      case 'traffic_heavy':
        title = '🚨 교통량 과다 경고';
        message = `${cameraName}에서 교통량이 과다하게 감지되었습니다! 즉시 확인이 필요합니다.`;
        severity = 'warning';
        break;
      
      case 'test_event':
        title = '🧪 테스트 이벤트';
        message = `${cameraName}에서 테스트 이벤트가 발생했습니다.`;
        severity = 'success';
        break;
      
      default:
        title = '📡 시스템 이벤트';
        message = `${cameraName}에서 ${type} 이벤트가 발생했습니다.`;
        severity = 'info';
    }
    
    return showAlert({
      type,
      title,
      message,
      severity,
      cameraId,
      cameraName,
      autoClose: type === 'traffic_heavy' ? 12000 : 8000, // 교통량 경고는 더 오래 표시
    });
  }, [showAlert]);

  // 카메라 상태 변경 알림
  const showCameraStatusAlert = useCallback((cameraName: string, oldStatus: string, newStatus: string) => {
    let title = '📹 카메라 상태 변경';
    let message = `${cameraName}의 상태가 ${oldStatus}에서 ${newStatus}로 변경되었습니다.`;
    let severity: AlertData['severity'] = 'info';
    
    if (newStatus === 'ERROR' || newStatus === 'OFFLINE') {
      title = '🔴 카메라 연결 오류';
      message = `${cameraName}에 연결 문제가 발생했습니다. 확인이 필요합니다.`;
      severity = 'error';
    } else if (newStatus === 'WARNING') {
      title = '🟠 카메라 경고 상태';
      message = `${cameraName}에서 경고 상황이 감지되었습니다.`;
      severity = 'warning';
    } else if (newStatus === 'ONLINE') {
      title = '🟢 카메라 연결 복구';
      message = `${cameraName}의 연결이 정상적으로 복구되었습니다.`;
      severity = 'success';
    }
    
    return showAlert({
      type: 'camera_status',
      title,
      message,
      severity,
      cameraName,
      autoClose: severity === 'error' ? 15000 : 6000, // 오류는 더 오래 표시
    });
  }, [showAlert]);

  // 알림 닫기
  const closeAlert = useCallback(() => {
    setIsOpen(false);
    setCurrentAlert(null);
    
    // 대기 중인 다음 알림이 있으면 표시
    setAlerts(prev => {
      const remaining = prev.filter(alert => 
        !currentAlert || alert.id !== currentAlert.id
      );
      
      if (remaining.length > 0) {
        const nextAlert = remaining[0];
        setTimeout(() => {
          setCurrentAlert(nextAlert);
          setIsOpen(true);
        }, 500); // 0.5초 지연 후 다음 알림 표시
        
        return remaining.slice(1); // 표시할 알림 제거
      }
      
      return remaining;
    });
  }, [currentAlert]);

  // 모든 알림 제거
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
    setCurrentAlert(null);
    setIsOpen(false);
  }, []);

  // 특정 알림 제거
  const removeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    
    if (currentAlert?.id === alertId) {
      closeAlert();
    }
  }, [currentAlert, closeAlert]);

  return {
    // 상태
    currentAlert,
    isOpen,
    alertCount: alerts.length,
    
    // 메서드
    showAlert,
    showEventAlert,
    showCameraStatusAlert,
    closeAlert,
    clearAllAlerts,
    removeAlert,
  };
};

export default useAlertModal;
