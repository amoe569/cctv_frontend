import { Camera } from '../services/api';

// 카메라 상태에 따른 색상 반환
export const getCameraStatusColor = (status: Camera['status']): string => {
  switch (status) {
    case 'ONLINE': return '#28a745';
    case 'OFFLINE': return '#6c757d';
    case 'MAINTENANCE': return '#ffc107';
    case 'ERROR': return '#dc3545';
    case 'WARNING': return '#fd7e14';
    default: return '#6c757d';
  }
};

// 카메라 상태에 따른 아이콘 반환
export const getCameraStatusIcon = (status: Camera['status']): string => {
  switch (status) {
    case 'ONLINE': return '🟢';
    case 'OFFLINE': return '⚫';
    case 'MAINTENANCE': return '🔧';
    case 'ERROR': return '🔴';
    case 'WARNING': return '🟠';
    default: return '❓';
  }
};

// 카메라 상태에 따른 한글 표시명 반환
export const getCameraStatusText = (status: Camera['status']): string => {
  switch (status) {
    case 'ONLINE': return '온라인';
    case 'OFFLINE': return '오프라인';
    case 'MAINTENANCE': return '점검중';
    case 'ERROR': return '오류';
    case 'WARNING': return '경고';
    default: return '알 수 없음';
  }
};

// 카메라 상태 옵션 목록 (주요 상태만)
export const CAMERA_STATUS_OPTIONS = [
  { value: 'ONLINE', label: '🟢 온라인', color: '#28a745' },
  { value: 'OFFLINE', label: '⚫ 오프라인', color: '#6c757d' },
  { value: 'WARNING', label: '🟠 경고', color: '#fd7e14' },
] as const;
