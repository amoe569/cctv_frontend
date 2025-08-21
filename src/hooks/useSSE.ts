import { useEffect, useRef, useCallback } from 'react';
import apiService from '../services/api';

interface SSEHookOptions {
  onMessage?: (data: any) => void;
  onError?: (error: globalThis.Event) => void;
  onOpen?: () => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

export const useSSE = (options: SSEHookOptions = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
      reconnectDelay = 1000, // 1초로 단축
  maxReconnectAttempts = 10 // 재시도 횟수 증가
  } = options;

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (eventSourceRef.current) {
      console.log('🔌 SSE 연결 해제');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    isConnectedRef.current = false;
  }, []);

  const connect = useCallback(() => {
    // 기존 연결이 있으면 정리
    cleanup();

    try {
      console.log('🔌 SSE 연결 시도 중...');
      const eventSource = apiService.createEventStream();
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('✅ SSE 연결 성공');
        isConnectedRef.current = true;
        reconnectAttemptsRef.current = 0; // 성공 시 재연결 카운트 리셋
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          // 하트비트는 로그 출력하지 않음
          if (event.type === 'heartbeat') {
            return;
          }
          
          // 연결 확인 메시지
          if (event.type === 'connected') {
            console.log('✅ SSE 연결 확인:', event.data);
            return;
          }
          
          const data = JSON.parse(event.data);
          console.log('📡 SSE 이벤트 수신:', data);
          onMessage?.(data);
        } catch (err) {
          console.error('❌ SSE 이벤트 파싱 오류:', err);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ SSE 연결 오류:', error);
        isConnectedRef.current = false;
        
        onError?.(error);

        // 최대 재연결 시도 횟수 체크
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 SSE 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts} (${reconnectDelay}ms 후)`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          console.error(`❌ SSE 최대 재연결 시도 횟수(${maxReconnectAttempts}) 초과`);
        }
      };

    } catch (err) {
      console.error('❌ SSE 연결 생성 실패:', err);
    }
  }, [onMessage, onError, onOpen, reconnectDelay, maxReconnectAttempts, cleanup]);

  // 연결 상태 확인 및 재연결
  const checkConnection = useCallback(() => {
    if (!isConnectedRef.current && eventSourceRef.current?.readyState !== EventSource.OPEN) {
      console.log('🔍 SSE 연결 상태 확인 - 재연결 필요');
      connect();
    }
  }, [connect]);

  // 수동 재연결
  const reconnect = useCallback(() => {
    console.log('🔄 SSE 수동 재연결');
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // 연결 상태 반환
  const isConnected = () => {
    return isConnectedRef.current && eventSourceRef.current?.readyState === EventSource.OPEN;
  };

  useEffect(() => {
    connect();

    // 주기적으로 연결 상태 확인 (10초마다)
    const healthCheckInterval = setInterval(checkConnection, 10000);

    return () => {
      clearInterval(healthCheckInterval);
      cleanup();
    };
  }, [connect, checkConnection, cleanup]);

  return {
    isConnected,
    reconnect,
    disconnect: cleanup
  };
};

export default useSSE;
