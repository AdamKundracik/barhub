import { apiUtils } from '../utils/api/apiClient';

export interface ReportDTO {
  id: number;
  postId: number;
  reporterId: number;
  reason: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

class ReportService {
  // Get all reports (Admin/Moderator only)
  async getAllReports(): Promise<ReportDTO[]> {
    try {
      console.log('[ReportService] Fetching all reports');
      const reports = await apiUtils.get<ReportDTO[]>('/reports');
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  // Get reports by type (Admin/Moderator only)
  async getReportsByType(reasonType: string): Promise<ReportDTO[]> {
    try {
      console.log('[ReportService] Fetching reports by type:', reasonType);
      const reports = await apiUtils.get<ReportDTO[]>(`/reports/type/${reasonType}`);
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      throw error;
    }
  }

  // Delete report (Admin/Moderator only)
  async deleteReport(reportId: number): Promise<boolean> {
    try {
      console.log('[ReportService] Deleting report:', reportId);
      await apiUtils.delete(`/reports/${reportId}`);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Create report (Any user can report)
  async createReport(report: Omit<ReportDTO, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReportDTO> {
    try {
      console.log('[ReportService] Creating report:', report);
      const createdReport = await apiUtils.post<ReportDTO>('/reports', report);
      return createdReport;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();

