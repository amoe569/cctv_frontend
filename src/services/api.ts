import axios from 'axios';

// API 기본 설정
const API_BASE_URL = 'http://localhost:8080';

class ApiService {
  private axiosInstance: any;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      (config: any) => {
        console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error: any) => {
        console.error('API 요청 오류:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response: any) => {
        console.log(`API 응답: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: any) => {
        console.error('API 응답 오류:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // 카메라 관련 API
  async getCameras(): Promise<Camera[]> {
    const response = await this.axiosInstance.get('/api/cameras');
    return response.data;
  }

  async getCameraById(id: string): Promise<Camera> {
    console.log(`🎯 카메라 조회 요청: ${id}`);
    try {
      const response = await this.axiosInstance.get(`/api/cameras/${id}`);
      console.log(`✅ 카메라 조회 성공: ${id}`, response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ 카메라 조회 실패: ${id}`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw error;
    }
  }

  async updateCameraStatus(id: string, status: string): Promise<Camera> {
    const response = await this.axiosInstance.put(`/api/cameras/${id}/status?status=${status}`);
    return response.data;
  }

  async createCamera(cameraData: CameraCreateData): Promise<Camera> {
    const response = await this.axiosInstance.post('/api/cameras', cameraData);
    return response.data;
  }

  async updateCamera(id: string, cameraData: CameraUpdateData): Promise<Camera> {
    const response = await this.axiosInstance.put(`/api/cameras/${id}`, cameraData);
    return response.data;
  }

  async deleteCamera(id: string): Promise<void> {
    await this.axiosInstance.delete(`/api/cameras/${id}`);
  }

  // 이벤트 관련 API
  async getEvents(): Promise<Event[]> {
    const response = await this.axiosInstance.get('/api/events');
    return response.data;
  }

  async getEventsByCamera(cameraId: string): Promise<Event[]> {
    const response = await this.axiosInstance.get(`/api/events/camera/${cameraId}`);
    return response.data;
  }

  async getEventsWithFilters(params: EventFilterParams): Promise<PaginatedEvents> {
    const response = await this.axiosInstance.get('/api/events', { params });
    return response.data;
  }

  // SSE 이벤트 스트림
  createEventStream(): EventSource {
    return new EventSource(`${API_BASE_URL}/api/events/stream`, {
      withCredentials: true,
    });
  }

  // 비디오 관련 API
  async getVideos(): Promise<Video[]> {
    const response = await this.axiosInstance.get('/api/videos');
    return response.data;
  }

  // 스트림 URL 생성
  getStreamUrl(cameraId: string): string {
    return `http://localhost:5001/stream/${cameraId}`;
  }
}

// 타입 정의
export interface Camera {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR' | 'WARNING';
  lat: number;
  lng: number;
  rtspUrl?: string;
  streamUrl?: string;
  yoloEnabled?: boolean;
  metaJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  cameraId: string;
  cameraName: string;
  type: string;
  severity: number;
  score: number;
  ts: string;
  bboxJson?: string;
  metaJson?: string;
  createdAt: string;
}

export interface Video {
  id: string;
  filename: string;
  duration: number;
  size: number;
  ts: string;
  camera: Camera;
}

export interface EventFilterParams {
  cameraId?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  severity?: number;
  page?: number;
  size?: number;
}

export interface PaginatedEvents {
  content: Event[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CameraCreateData {
  name: string;
  lat: number;
  lng: number;
  rtspUrl?: string;
  description?: string;
  yoloEnabled?: boolean;
}

export interface CameraUpdateData {
  name: string;
  lat: number;
  lng: number;
  rtspUrl?: string;
  description?: string;
  yoloEnabled?: boolean;
}

// API 서비스 인스턴스 내보내기
export const apiService = new ApiService();
export default apiService;
