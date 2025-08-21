import { useState, useCallback } from 'react';

export interface NotificationData {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  timestamp: number;
}

interface NotificationOptions {
  maxNotifications?: number;
  defaultDuration?: number;
}

export const useNotification = (options: NotificationOptions = {}) => {
  const { maxNotifications = 5, defaultDuration = 3000 } = options; // 3초로 단축
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // 알림 추가
  const addNotification = useCallback((
    message: string, 
    severity: NotificationData['severity'] = 'info',
    duration: number = defaultDuration
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const timestamp = Date.now();
    
    const newNotification: NotificationData = {
      id,
      message,
      severity,
      duration,
      timestamp
    };

    setNotifications(prev => {
      // 중복 메시지 방지 (최근 3초 이내 같은 메시지)
      const recentDuplicate = prev.find(n => 
        n.message === message && 
        timestamp - n.timestamp < 3000
      );
      
      if (recentDuplicate) {
        console.log('🔄 중복 알림 무시:', message);
        return prev;
      }

      // 최대 알림 개수 제한
      const updatedNotifications = [...prev, newNotification];
      if (updatedNotifications.length > maxNotifications) {
        return updatedNotifications.slice(-maxNotifications);
      }
      
      return updatedNotifications;
    });

    console.log('🔔 새 알림 추가:', { message, severity, id });

    // 자동 제거 (duration이 0이 아닌 경우)
    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, [defaultDuration, maxNotifications]);

  // 알림 제거
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      if (filtered.length !== prev.length) {
        console.log('🗑️ 알림 제거:', id);
      }
      return filtered;
    });
  }, []);

  // 모든 알림 제거
  const clearAllNotifications = useCallback(() => {
    console.log('🧹 모든 알림 제거');
    setNotifications([]);
  }, []);

  // 특정 심각도의 알림만 제거
  const clearNotificationsBySeverity = useCallback((severity: NotificationData['severity']) => {
    setNotifications(prev => prev.filter(n => n.severity !== severity));
    console.log(`🧹 ${severity} 알림 제거`);
  }, []);

  // 이벤트별 알림 생성 헬퍼
  const showEventNotification = useCallback((eventData: any) => {
    const { type, cameraName } = eventData;
    
    let message = `${cameraName}에서 이벤트 발생`;
    let severity: NotificationData['severity'] = 'info';
    
    switch (type) {
      case 'traffic_heavy':
        message = `🚨 ${cameraName}에서 교통량 과다 감지!`;
        severity = 'warning';
        break;
      case 'test_event':
        message = `🧪 ${cameraName} 테스트 이벤트 완료`;
        severity = 'success';
        break;
      default:
        message = `📡 ${cameraName}에서 ${type} 이벤트 발생`;
        severity = 'info';
    }
    
    return addNotification(message, severity, 4000); // 4초간 표시
  }, [addNotification]);

  // 카메라 상태 변경 알림
  const showCameraStatusNotification = useCallback((cameraName: string, oldStatus: string, newStatus: string) => {
    const message = `📹 ${cameraName} 상태: ${oldStatus} → ${newStatus}`;
    let severity: NotificationData['severity'] = 'info';
    
    if (newStatus === 'ERROR' || newStatus === 'OFFLINE') {
      severity = 'error';
    } else if (newStatus === 'WARNING') {
      severity = 'warning';
    } else if (newStatus === 'ONLINE') {
      severity = 'success';
    }
    
    return addNotification(message, severity, 3000); // 3초간 표시
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    clearNotificationsBySeverity,
    showEventNotification,
    showCameraStatusNotification
  };
};

export default useNotification;
