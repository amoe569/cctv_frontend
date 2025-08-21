import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { VideoLibrary as VideoIcon, AccessTime, Storage } from '@mui/icons-material';
import apiService, { Video } from '../../services/api';
import { formatDateTime } from '../../utils/eventUtils';
import { getCameraStatusIcon } from '../../utils/cameraUtils';

const VideoList: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await apiService.getVideos();
      setVideos(data);
    } catch (err) {
      setError('비디오 데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('비디오 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) return <Typography>로딩 중...</Typography>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        저장 영상
      </Typography>

      {videos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <VideoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            저장된 영상이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            이벤트가 발생하면 자동으로 영상이 저장됩니다
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              📊 영상 통계
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="h4" color="primary.main">
                    {videos.length}
                  </Typography>
                  <Typography variant="body2">총 영상 수</Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="h4" color="secondary.main">
                    {formatFileSize(videos.reduce((total, video) => total + video.size, 0))}
                  </Typography>
                  <Typography variant="body2">총 용량</Typography>
                </Box>
              </Box>
              <Box>
                <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <Typography variant="h4" color="info.main">
                    {formatDuration(videos.reduce((total, video) => total + video.duration, 0))}
                  </Typography>
                  <Typography variant="body2">총 재생시간</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 2 }}>
            {videos.map((video) => (
              <Box key={video.id}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease',
                    },
                  }}
                >
                  <CardContent>
                    {/* 비디오 아이콘 */}
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <VideoIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>

                    {/* 파일명 */}
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        fontSize: '1rem',
                        wordBreak: 'break-all',
                        textAlign: 'center',
                      }}
                    >
                      {video.filename}
                    </Typography>

                    {/* 카메라 정보 */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getCameraStatusIcon(video.camera.status)}
                      <Typography variant="body2">
                        {video.camera.name}
                      </Typography>
                    </Box>

                    {/* 영상 정보 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDuration(video.duration)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatFileSize(video.size)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* 생성일 */}
                    <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateTime(video.ts)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default VideoList;
