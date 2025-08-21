import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Chip,
  Alert,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import apiService, { Camera, EventFilterParams, PaginatedEvents } from '../../services/api';
import {
  getEventIcon,
  getEventColor,
  getEventDisplayName,
  getSeverityText,
  parseEventMeta,
  formatDateTime,
} from '../../utils/eventUtils';
import { getCameraStatusIcon } from '../../utils/cameraUtils';

const EventManagement: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [events, setEvents] = useState<PaginatedEvents | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 검색 필터
  const [filters, setFilters] = useState<EventFilterParams>({
    cameraId: '',
    eventType: '',
    startDate: '',
    endDate: '',
    severity: 1,
    page: 0,
    size: 20,
  });

  useEffect(() => {
    loadCameras();
    searchEvents();
    setupSSE();
  }, []);

  const loadCameras = async () => {
    try {
      const data = await apiService.getCameras();
      setCameras(data);
    } catch (err) {
      console.error('카메라 로드 오류:', err);
    }
  };

  const searchEvents = async (newFilters?: EventFilterParams) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = newFilters || filters;
      
      console.log('🔍 이벤트 검색 요청:', searchParams);
      const data = await apiService.getEventsWithFilters(searchParams);
      console.log('✅ 이벤트 검색 응답:', data);
      console.log('📊 이벤트 개수:', data?.content?.length || 0, '/ 총', data?.totalElements || 0, '개');
      
      setEvents(data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || '알 수 없는 오류';
      const errorStatus = err.response?.status || 'Unknown';
      
      console.error('❌ 이벤트 검색 실패:', {
        status: errorStatus,
        message: errorMessage,
        error: err
      });
      
      setError(`이벤트 데이터 로드 실패 (${errorStatus}): ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: keyof EventFilterParams, value: any) => {
    const newFilters = { ...filters, [field]: value, page: 0 };
    setFilters(newFilters);
  };

  const handleSearch = () => {
    searchEvents(filters);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    const newFilters = { ...filters, page: page - 1 };
    setFilters(newFilters);
    searchEvents(newFilters);
  };

  const handleReset = () => {
    const resetFilters: EventFilterParams = {
      cameraId: '',
      eventType: '',
      startDate: '',
      endDate: '',
      severity: 1,
      page: 0,
      size: 20,
    };
    setFilters(resetFilters);
    searchEvents(resetFilters);
  };

  const setupSSE = () => {
    console.log('🔌 EventManagement SSE 연결 설정 중...');
    
    const eventSource = apiService.createEventStream();
    
    eventSource.onopen = () => {
      console.log('✅ EventManagement SSE 연결 성공');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 EventManagement SSE 이벤트 수신:', data);
        
        // 새로운 이벤트가 현재 필터 조건에 맞는지 확인하고 목록 새로고침
        if (!filters.cameraId || filters.cameraId === data.cameraId) {
          if (!filters.eventType || filters.eventType === data.type) {
            console.log('🔄 새 이벤트로 인한 목록 새로고침');
            searchEvents(filters);
          }
        }
        
      } catch (err) {
        console.error('❌ EventManagement SSE 이벤트 파싱 오류:', err);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ EventManagement SSE 연결 오류:', error);
      
      // 3초 후 재연결 시도
      setTimeout(() => {
        console.log('🔄 EventManagement SSE 재연결 시도...');
        setupSSE();
      }, 3000);
    };

    return () => {
      console.log('🔌 EventManagement SSE 연결 해제');
      eventSource.close();
    };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        이벤트 관리
      </Typography>

      {/* 검색 필터 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 이벤트 검색
        </Typography>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, alignItems: 'center' }}>
          <Box>
            <FormControl fullWidth>
              <InputLabel>카메라</InputLabel>
              <Select
                value={filters.cameraId || ''}
                onChange={(e) => handleFilterChange('cameraId', e.target.value)}
                label="카메라"
              >
                <MenuItem value="">전체</MenuItem>
                {cameras.map((camera) => (
                  <MenuItem key={camera.id} value={camera.id}>
                    {getCameraStatusIcon(camera.status)} {camera.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <FormControl fullWidth>
              <InputLabel>이벤트 타입</InputLabel>
              <Select
                value={filters.eventType || ''}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                label="이벤트 타입"
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="traffic_heavy">🚗 통행량 많음</MenuItem>
                <MenuItem value="person">👤 사람 감지</MenuItem>
                <MenuItem value="car">🚙 차량 감지</MenuItem>
                <MenuItem value="truck">🚛 트럭 감지</MenuItem>
                <MenuItem value="bus">🚌 버스 감지</MenuItem>
                <MenuItem value="motorcycle">🏍️ 오토바이 감지</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box>
            <TextField
              fullWidth
              label="시작일"
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <TextField
              fullWidth
              label="종료일"
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          <Box>
            <FormControl fullWidth>
              <InputLabel>최소 심각도</InputLabel>
              <Select
                value={filters.severity || 1}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                label="최소 심각도"
              >
                <MenuItem value={1}>낮음 이상</MenuItem>
                <MenuItem value={2}>보통 이상</MenuItem>
                <MenuItem value={3}>높음 이상</MenuItem>
                <MenuItem value={4}>매우 높음 이상</MenuItem>
                <MenuItem value={5}>치명적</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ gridColumn: '1 / -1' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
              >
                검색
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={loading}
              >
                초기화
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* 검색 결과 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            검색 결과 ({events?.totalElements || 0}건)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            페이지 {(events?.number || 0) + 1} / {events?.totalPages || 1}
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>시간</TableCell>
                <TableCell>카메라</TableCell>
                <TableCell>이벤트 타입</TableCell>
                <TableCell>심각도</TableCell>
                <TableCell>점수</TableCell>
                <TableCell>상세 정보</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : events?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    검색 결과가 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                events?.content.map((event, index) => {
                  const eventColor = getEventColor(event.type);
                  const eventIcon = getEventIcon(event.type);
                  const eventDisplayName = getEventDisplayName(event.type);
                  const severityText = getSeverityText(event.severity);
                  const meta = parseEventMeta(event.metaJson);

                  return (
                    <TableRow key={`${event.id}-${index}`}>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(event.ts)}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* 카메라 상태는 별도 API 호출이 필요하므로 일단 기본값 사용 */}
                          <Typography variant="body2">
                            {event.cameraName}
                          </Typography>
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ color: eventColor }}>
                            {eventIcon} {eventDisplayName}
                          </Typography>
                          {meta.isTest && (
                            <Chip
                              label="테스트"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255, 193, 7, 0.2)',
                                color: '#ffc107',
                                fontSize: '0.7rem',
                                height: '20px',
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      
                      <TableCell>
                        <Chip
                          label={severityText}
                          size="small"
                          sx={{
                            backgroundColor: `rgba(${eventColor.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
                            color: eventColor,
                          }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#ffc107' }}>
                          {(event.score * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Box>
                          {meta.vehicleCount && (
                            <Typography variant="body2" sx={{ color: eventColor }}>
                              차량 {meta.vehicleCount}대
                            </Typography>
                          )}
                          {meta.message && !meta.vehicleCount && (
                            <Typography variant="body2" sx={{ color: eventColor }}>
                              {meta.message}
                            </Typography>
                          )}
                          {(() => {
                            try {
                              const bbox = event.bboxJson ? JSON.parse(event.bboxJson) : null;
                              return bbox && bbox.w > 0 ? (
                                <Typography variant="caption" color="text.secondary">
                                  위치: ({bbox.x}, {bbox.y}) {bbox.w}×{bbox.h}
                                </Typography>
                              ) : null;
                            } catch {
                              return null;
                            }
                          })()}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 페이지네이션 */}
        {events && events.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={events.totalPages}
              page={(events.number || 0) + 1}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default EventManagement;
