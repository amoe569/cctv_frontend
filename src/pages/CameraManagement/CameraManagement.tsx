import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Chip,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material';
import apiService, { Camera, CameraCreateData, CameraUpdateData } from '../../services/api';
import { getCameraStatusIcon } from '../../utils/cameraUtils';
import { formatDateTime } from '../../utils/eventUtils';

const CameraManagement: React.FC = () => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState<CameraCreateData>({
    name: '',
    lat: 0,
    lng: 0,
    rtspUrl: '',
    description: '',
    yoloEnabled: true, // 기본값: YOLO 활성화
  });

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getCameras();
      setCameras(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '카메라 목록 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (mode: 'create' | 'edit', camera?: Camera) => {
    setDialogMode(mode);
    setSelectedCamera(camera || null);
    
    if (mode === 'edit' && camera) {
      setFormData({
        name: camera.name,
        lat: camera.lat,
        lng: camera.lng,
        rtspUrl: camera.rtspUrl || '',
        description: camera.metaJson || '',
        yoloEnabled: camera.yoloEnabled || false,
      });
    } else {
      setFormData({
        name: '',
        lat: 0,
        lng: 0,
        rtspUrl: '',
        description: '',
        yoloEnabled: true,
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCamera(null);
    setFormData({
      name: '',
      lat: 0,
      lng: 0,
      rtspUrl: '',
      description: '',
      yoloEnabled: true,
    });
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setSuccess(null);

      if (dialogMode === 'create') {
        await apiService.createCamera(formData);
        setSuccess('카메라가 성공적으로 생성되었습니다.');
      } else if (selectedCamera) {
        await apiService.updateCamera(selectedCamera.id, formData as CameraUpdateData);
        setSuccess('카메라가 성공적으로 수정되었습니다.');
      }

      handleCloseDialog();
      await loadCameras();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '작업 실패');
    }
  };

  const handleDelete = async (camera: Camera) => {
    if (!window.confirm(`카메라 "${camera.name}"을(를) 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await apiService.deleteCamera(camera.id);
      setSuccess('카메라가 성공적으로 삭제되었습니다.');
      await loadCameras();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '카메라 삭제 실패');
    }
  };

  const isBasicCamera = (cameraId: string) => {
    return cameraId === 'cam-001' || cameraId === 'cam-002';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📹 카메라 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          카메라 추가
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>위치</TableCell>
                <TableCell>RTSP URL</TableCell>
                <TableCell>YOLO</TableCell>
                <TableCell>생성일</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cameras.map((camera) => (
                <TableRow key={camera.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VideocamIcon color="primary" />
                      {camera.id}
                      {isBasicCamera(camera.id) && (
                        <Chip label="기본" size="small" color="primary" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{camera.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getCameraStatusIcon(camera.status)}
                      {camera.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {camera.lat.toFixed(6)}, {camera.lng.toFixed(6)}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {camera.rtspUrl || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={camera.yoloEnabled ? '활성화' : '비활성화'}
                      color={camera.yoloEnabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {formatDateTime(camera.createdAt)}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog('edit', camera)}
                    >
                      <EditIcon />
                    </IconButton>
                    {!isBasicCamera(camera.id) && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(camera)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 카메라 생성/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? '카메라 추가' : '카메라 수정'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="카메라 이름"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="위도"
                type="number"
                value={formData.lat === 0 ? '' : formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                required
                fullWidth
                placeholder="예: 37.5665"
                helperText="위도 좌표 (예: 37.5665)"
                inputProps={{ step: 'any' }}
              />
              <TextField
                label="경도"
                type="number"
                value={formData.lng === 0 ? '' : formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                required
                fullWidth
                placeholder="예: 126.9780"
                helperText="경도 좌표 (예: 126.9780)"
                inputProps={{ step: 'any' }}
              />
            </Box>

            <TextField
              label="RTSP URL"
              value={formData.rtspUrl}
              onChange={(e) => setFormData({ ...formData, rtspUrl: e.target.value })}
              fullWidth
              placeholder="rtsp://example.com/stream"
            />

            <TextField
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.yoloEnabled}
                  onChange={(e) => setFormData({ ...formData, yoloEnabled: e.target.checked })}
                />
              }
              label="YOLO 객체 탐지 활성화"
            />

            {!formData.yoloEnabled && (
              <Alert severity="info">
                YOLO가 비활성화된 카메라는 객체 탐지 및 이벤트 전송이 수행되지 않습니다.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'create' ? '생성' : '수정'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CameraManagement;
