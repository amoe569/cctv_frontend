import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Event } from '../../services/api';
import {
  getEventIcon,
  getEventColor,
  getEventDisplayName,
  getSeverityText,
  parseEventMeta,
  formatTime,
} from '../../utils/eventUtils';

interface EventListProps {
  events: Event[];
  maxHeight?: string;
}

const EventList: React.FC<EventListProps> = ({ events, maxHeight = '300px' }) => {
  if (events.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
          color: 'text.secondary',
        }}
      >
        <Typography variant="body1">이벤트가 없습니다</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxHeight,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '3px',
        },
      }}
    >
      {events.map((event, index) => {
        const eventColor = getEventColor(event.type);
        const eventIcon = getEventIcon(event.type);
        const eventDisplayName = getEventDisplayName(event.type);
        const severityText = getSeverityText(event.severity);
        const meta = parseEventMeta(event.metaJson);

        return (
          <Card
            key={`${event.id}-${index}`}
            sx={{
              mb: 1,
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: `2px solid ${eventColor}`,
              borderLeft: `4px solid ${eventColor}`,
            }}
          >
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {/* 이벤트 헤더 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ color: eventColor, fontWeight: 'bold' }}>
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
                <Typography variant="caption" color="text.secondary">
                  {formatTime(event.ts)}
                </Typography>
              </Box>

              {/* 이벤트 상세 정보 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">
                    심각도: <strong>{severityText}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#ffc107' }}>
                    점수: <strong>{(event.score * 100).toFixed(1)}%</strong>
                  </Typography>
                </Box>

                {/* 메타 정보 */}
                {meta.vehicleCount && (
                  <Typography variant="body2" sx={{ color: eventColor }}>
                    상세: <strong>차량 {meta.vehicleCount}대</strong>
                    {meta.isTest && ' (테스트)'}
                  </Typography>
                )}

                {meta.message && !meta.vehicleCount && (
                  <Typography variant="body2" sx={{ color: eventColor }}>
                    상세: <strong>{meta.message}</strong>
                  </Typography>
                )}

                {/* 바운딩 박스 정보 */}
                {event.bbox && event.bbox.w > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    위치: ({event.bbox.x}, {event.bbox.y}) {event.bbox.w}×{event.bbox.h}
                  </Typography>
                )}

                {/* 원본 타입 (디버그용) */}
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                  원본 타입: {event.type}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default EventList;
