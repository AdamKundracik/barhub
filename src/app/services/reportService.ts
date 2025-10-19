import { apiUtils } from '../utils/api/apiClient';
import { ReasonTypeEnum, ReportDTO, ReportUserDTO } from '../types/dto';

// Export ReasonTypeEnum for backward compatibility
export { ReasonTypeEnum } from '../types/dto';
export type { ReportDTO, ReportUserDTO } from '../types/dto';

class ReportService {
  // Get all reports (Admin/Moderator only)
  async getAllReports(): Promise<ReportDTO[]> {
    try {
      // console.log('[ReportService] Fetching all reports');
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
      // console.log('[ReportService] Fetching reports by type:', reasonType);
      const reports = await apiUtils.get<ReportDTO[]>(
        `/reports/type/${reasonType}`
      );
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      throw error;
    }
  }

  // Delete report (Admin/Moderator only)
  async deleteReport(reportId: number): Promise<boolean> {
    try {
      // console.log('[ReportService] Deleting report:', reportId);
      await apiUtils.delete(`/reports/${reportId}`);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // Create report (Any user can report a post)
  async createReport(
    userId: number,
    postId: string, // Frontend uses string, convert to number for backend
    reason: ReasonTypeEnum,
    otherReasonMessage?: string
  ): Promise<ReportDTO> {
    try {
      const reportData: Omit<
        ReportDTO,
        'id' | 'createdAt' | 'updatedAt' | 'userName'
      > = {
        userId,
        postId: parseInt(postId), // Convert string to number for backend
        reason,
        otherReasonMessage,
      };

      // console.log('[ReportService] Creating report:', reportData);
      return await apiUtils.post<ReportDTO>('/reports', reportData);
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  // Report a user
  async reportUser(
    reportedUserId: number,
    reason: ReasonTypeEnum,
    otherReasonMessage?: string
  ): Promise<ReportDTO> {
    try {
      const reportData: ReportUserDTO = {
        reportedUserId,
        reason,
        otherReasonMessage,
      };

      // console.log('[ReportService] Reporting user:', reportData);
      return await apiUtils.post<ReportDTO>('/reports/user', reportData);
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
