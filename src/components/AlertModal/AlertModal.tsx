import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Chip,
  Alert,
  Fade,
  Slide,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Videocam as CameraIcon,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { formatEventTime, getEventIcon, getEventColor, getEventDisplayName } from '../../utils/eventUtils';

export interface AlertData {
  id: string;
  type: 'traffic_heavy' | 'test_event' | 'camera_status' | 'system_error';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  cameraId?: string;
  cameraName?: string;
  timestamp: Date;
  autoClose?: number; // 자동 닫기 시간 (ms)
}

interface AlertModalProps {
  alert: AlertData | null;
  open: boolean;
  onClose: () => void;
  onViewCamera?: (cameraId: string) => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="down" ref={ref} {...props} />;
});

const AlertModal: React.FC<AlertModalProps> = ({
  alert,
  open,
  onClose,
  onViewCamera,
}) => {
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    if (open && alert?.autoClose) {
      setCountdown(Math.ceil(alert.autoClose / 1000));
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [open, alert?.autoClose, onClose]);

  if (!alert) return null;

  const getSeverityIcon = () => {
    switch (alert.severity) {
      case 'error': return <ErrorIcon sx={{ color: '#f44336', fontSize: 40 }} />;
      case 'warning': return <WarningIcon sx={{ color: '#ff9800', fontSize: 40 }} />;
      case 'success': return <SuccessIcon sx={{ color: '#4caf50', fontSize: 40 }} />;
      default: return <InfoIcon sx={{ color: '#2196f3', fontSize: 40 }} />;
    }
  };

  const getSeverityColor = () => {
    switch (alert.severity) {
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'success': return '#4caf50';
      default: return '#2196f3';
    }
  };

  const getAlertBackground = () => {
    switch (alert.severity) {
      case 'error': return 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)';
      case 'warning': return 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)';
      case 'success': return 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)';
      default: return 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: getAlertBackground(),
          border: `3px solid ${getSeverityColor()}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
        }
      }}
    >
      <DialogTitle sx={{ 
        background: getSeverityColor(), 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {getSeverityIcon()}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'white' }}>
              🚨 {alert.title}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, color: 'white' }}>
              {formatEventTime(alert.timestamp)}
            </Typography>
          </Box>
        </Box>
        
        {countdown > 0 && (
          <Chip 
            label={`${countdown}초`} 
            size="small" 
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              color: 'white',
              fontWeight: 'bold'
            }} 
          />
        )}
        
        <IconButton 
          onClick={onClose} 
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* 메인 메시지 */}
          <Alert 
            severity={alert.severity} 
            sx={{ 
              fontSize: '1.1rem',
              '& .MuiAlert-message': { fontWeight: 'medium' }
            }}
          >
            {alert.message}
          </Alert>

          {/* 카메라 정보 */}
          {alert.cameraId && alert.cameraName && (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                backgroundColor: 'rgba(255,255,255,0.7)',
                border: '1px solid #e0e0e0',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CameraIcon sx={{ color: getSeverityColor(), fontSize: 24 }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    📹 {alert.cameraName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    카메라 ID: {alert.cameraId}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          {/* 이벤트 타입 정보 */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`이벤트: ${getEventDisplayName(alert.type)}`} 
              color={alert.severity as any}
              icon={<span>{getEventIcon(alert.type)}</span>}
              sx={{ fontWeight: 'medium' }}
            />
            <Chip 
              label={`심각도: ${alert.severity.toUpperCase()}`} 
              variant="outlined"
              sx={{ 
                borderColor: getSeverityColor(),
                color: getSeverityColor(),
                fontWeight: 'medium'
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1, backgroundColor: 'rgba(255,255,255,0.5)' }}>
        {alert.cameraId && onViewCamera && (
          <Button
            variant="contained"
            startIcon={<CameraIcon />}
            onClick={() => onViewCamera(alert.cameraId!)}
            sx={{ 
              backgroundColor: getSeverityColor(),
              '&:hover': { backgroundColor: getSeverityColor(), opacity: 0.9 }
            }}
          >
            카메라 확인
          </Button>
        )}
        
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ 
            borderColor: getSeverityColor(),
            color: getSeverityColor(),
            '&:hover': { 
              borderColor: getSeverityColor(),
              backgroundColor: `${getSeverityColor()}15`
            }
          }}
        >
          {countdown > 0 ? `확인 (${countdown}초)` : '확인'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertModal;
