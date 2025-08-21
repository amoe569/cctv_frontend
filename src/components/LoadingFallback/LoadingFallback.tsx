import React from 'react';
import { Box, Typography, CircularProgress, Button } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface LoadingFallbackProps {
  message?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
  timeout?: number;
}

const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = '데이터를 불러오는 중...',
  showRefresh = false,
  onRefresh,
  timeout = 10000 // 10초 후 새로고침 버튼 표시
}) => {
  const [showRefreshButton, setShowRefreshButton] = React.useState(showRefresh);

  React.useEffect(() => {
    if (!showRefresh && timeout > 0) {
      const timer = setTimeout(() => {
        setShowRefreshButton(true);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [showRefresh, timeout]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: 2,
        p: 3
      }}
    >
      <CircularProgress size={40} />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
      
      {showRefreshButton && onRefresh && (
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          sx={{ mt: 1 }}
        >
          새로고침
        </Button>
      )}
    </Box>
  );
};

export default LoadingFallback;
