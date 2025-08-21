import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { Event } from '../../services/api';
import { formatDateTime, getEventIcon, getEventColor, getEventDisplayName, parseEventMeta } from '../../utils/eventUtils';

interface EventListProps {
  events: Event[];
  maxHeight?: string;
}

const EventList: React.FC<EventListProps> = ({ events, maxHeight = '300px' }) => {
  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
        <Typography variant="body2">이벤트가 없습니다</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxHeight, overflowY: 'auto' }}>
      <List dense>
        {events.map((event, index) => {
          const eventColor = getEventColor(event.type);
          const eventIcon = getEventIcon(event.type);
          const eventDisplayName = getEventDisplayName(event.type);
          const meta = parseEventMeta(event.metaJson);

          return (
            <ListItem key={`${event.id}-${index}`} divider>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
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
                          fontSize: '0.6rem',
                          height: '16px',
                        }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(event.ts)}
                    </Typography>
                    {meta.vehicleCount && (
                      <Typography variant="caption" sx={{ color: eventColor, display: 'block' }}>
                        차량 {meta.vehicleCount}대 감지
                      </Typography>
                    )}
                    {meta.message && !meta.vehicleCount && (
                      <Typography variant="caption" sx={{ color: eventColor, display: 'block' }}>
                        {meta.message}
                      </Typography>
                    )}
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default EventList;