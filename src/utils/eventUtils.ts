import { Event } from '../services/api';

// 이벤트 타입에 따른 아이콘 반환
export const getEventIcon = (eventType: string): string => {
  if (eventType === 'traffic_heavy') return '🚗';
  if (eventType === 'person') return '👤';
  if (eventType.includes('car')) return '🚙';
  if (eventType.includes('truck')) return '🚛';
  if (eventType.includes('bus')) return '🚌';
  if (eventType.includes('motorcycle')) return '🏍️';
  return '📊';
};

// 이벤트 타입에 따른 색상 반환
export const getEventColor = (eventType: string): string => {
  if (eventType === 'traffic_heavy') return '#fd7e14';
  if (eventType === 'person') return '#28a745';
  if (eventType.includes('car')) return '#17a2b8';
  if (eventType.includes('truck')) return '#17a2b8';
  if (eventType.includes('bus')) return '#17a2b8';
  if (eventType.includes('motorcycle')) return '#6f42c1';
  return '#667eea';
};

// 이벤트 타입에 따른 한글 표시명 반환
export const getEventDisplayName = (eventType: string): string => {
  if (eventType === 'traffic_heavy') return '통행량 많음';
  if (eventType === 'person') return '사람 감지';
  if (eventType.includes('car')) return '차량 감지';
  if (eventType.includes('truck')) return '트럭 감지';
  if (eventType.includes('bus')) return '버스 감지';
  if (eventType.includes('motorcycle')) return '오토바이 감지';
  return eventType;
};

// 심각도에 따른 텍스트 반환
export const getSeverityText = (severity: number): string => {
  const severityTexts = ['', '낮음', '보통', '높음', '매우 높음', '치명적'];
  return severityTexts[severity] || '알 수 없음';
};

// 이벤트 메타데이터 파싱
export const parseEventMeta = (metaJson?: string): { vehicleCount?: number; message?: string; isTest?: boolean } => {
  if (!metaJson) return {};
  
  try {
    const meta = JSON.parse(metaJson);
    return {
      vehicleCount: meta.vehicleCount,
      message: meta.message,
      isTest: meta.message?.includes('테스트') || false,
    };
  } catch (e) {
    return { message: metaJson };
  }
};

// 날짜 포맷팅
export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatTime = (dateString: string): string => {
  return new Date(dateString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
