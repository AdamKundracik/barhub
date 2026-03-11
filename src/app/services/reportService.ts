import { apiUtils } from '../utils/api/apiClient';
import {
  ReasonTypeEnum,
  ReportDTO,
  ReportUserDTO,
  UnifiedReportDTO,
  ReportManagementDTO,
  ReportTypeEnum,
} from '../types/dto';

// Export types for backward compatibility
export { ReasonTypeEnum, ReportTypeEnum } from '../types/dto';
export type {
  ReportDTO,
  ReportUserDTO,
  UnifiedReportDTO,
  ReportManagementDTO,
} from '../types/dto';

class ReportService {
  // === UNIFIED REPORTING METHODS ===

  // Unified method to create any type of report
  async createUnifiedReport(reportData: UnifiedReportDTO): Promise<ReportDTO> {
    try {
      return await apiUtils.post<ReportDTO>('/reports/create', reportData);
    } catch (error) {
      console.error('Error creating unified report:', error);
      throw error;
    }
  }

  // === MANAGEMENT METHODS (Admin/Moderator) ===

  // Get all reports with enhanced context for management
  async getAllReportsForManagement(): Promise<ReportManagementDTO[]> {
    try {
      const reports = await apiUtils.get<ReportManagementDTO[]>(
        '/reports/management'
      );
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports for management:', error);
      throw error;
    }
  }

  // Get unresolved reports for management
  async getUnresolvedReports(): Promise<ReportManagementDTO[]> {
    try {
      const reports = await apiUtils.get<ReportManagementDTO[]>(
        '/reports/management/unresolved'
      );
      return reports || [];
    } catch (error) {
      console.error('Error fetching unresolved reports:', error);
      throw error;
    }
  }

  // Get reports by type for management
  async getReportsByTypeForManagement(
    reportType: ReportTypeEnum
  ): Promise<ReportManagementDTO[]> {
    try {
      const reports = await apiUtils.get<ReportManagementDTO[]>(
        `/reports/management/type/${reportType}`
      );
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports by type for management:', error);
      throw error;
    }
  }

  // Resolve a report
  async resolveReport(
    reportId: number,
    resolutionNotes?: string
  ): Promise<ReportDTO> {
    try {
      const requestBody = resolutionNotes ? { resolutionNotes } : {};
      return await apiUtils.put<ReportDTO>(
        `/reports/management/${reportId}/resolve`,
        requestBody
      );
    } catch (error) {
      console.error('Error resolving report:', error);
      throw error;
    }
  }

  // Delete report (Admin/Moderator only)
  async deleteReport(reportId: number): Promise<boolean> {
    try {
      await apiUtils.delete(`/reports/management/${reportId}`);
      return true;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  // === LEGACY METHODS (for backward compatibility) ===

  // Get all reports (Admin/Moderator only) - Legacy
  async getAllReports(): Promise<ReportDTO[]> {
    try {
      const reports = await apiUtils.get<ReportDTO[]>('/reports');
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  // Get reports by reason type (Admin/Moderator only) - Legacy
  async getReportsByType(reasonType: string): Promise<ReportDTO[]> {
    try {
      const reports = await apiUtils.get<ReportDTO[]>(
        `/reports/type/${reasonType}`
      );
      return reports || [];
    } catch (error) {
      console.error('Error fetching reports by type:', error);
      throw error;
    }
  }

  // === CONVENIENCE METHODS ===

  // Report a post using unified API
  async reportPost(
    postId: string | number,
    reason: ReasonTypeEnum,
    otherReasonMessage?: string
  ): Promise<ReportDTO> {
    try {
      const reportData: UnifiedReportDTO = {
        reportType: ReportTypeEnum.POST,
        postId: typeof postId === 'string' ? parseInt(postId, 10) : postId,
        reason,
        otherReasonMessage,
      };

      return await this.createUnifiedReport(reportData);
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  }

  // Report a user using unified API
  async reportUser(
    reportedUserId: number,
    reason: ReasonTypeEnum,
    otherReasonMessage?: string
  ): Promise<ReportDTO> {
    try {
      const reportData: UnifiedReportDTO = {
        reportType: ReportTypeEnum.USER,
        userId: reportedUserId,
        reason,
        otherReasonMessage,
      };

      return await this.createUnifiedReport(reportData);
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  }

  // Report a comment using unified API
  async reportComment(
    commentId: number | string,
    reason: ReasonTypeEnum,
    otherReasonMessage?: string
  ): Promise<ReportDTO> {
    try {
      const reportData: UnifiedReportDTO = {
        reportType: ReportTypeEnum.COMMENT,
        commentId:
          typeof commentId === 'string' ? parseInt(commentId, 10) : commentId,
        reason,
        otherReasonMessage,
      };

      return await this.createUnifiedReport(reportData);
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  }

  // === LEGACY METHODS (for backward compatibility) ===

  // Create report (Any user can report a post) - Legacy
  async createReport(
    userId: number,
    postId: string, // Frontend uses string, convert to number for backend
    reason: ReasonTypeEnum,
    otherReasonMessage?: string
  ): Promise<ReportDTO> {
    try {
      return await this.reportPost(postId, reason, otherReasonMessage);
    } catch (error) {
      console.error('Error creating report (legacy):', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
