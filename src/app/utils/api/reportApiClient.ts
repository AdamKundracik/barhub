// TypeScript API Client pre optimálne report management
import { apiUtils } from './apiClient';
import { 
  UnifiedReportDTO, 
  ReportDTO, 
  ReportManagementDTO, 
  ReportTypeEnum, 
  ReasonTypeEnum 
} from '../../types/dto';

export interface ReportApiClient {
  // === UNIFIED REPORTING ===
  
  /**
   * Create any type of report using unified API
   */
  createReport(reportData: UnifiedReportDTO): Promise<ReportDTO>;
  
  /**
   * Report a user
   */
  reportUser(userId: number, reason: ReasonTypeEnum, customReason?: string): Promise<ReportDTO>;
  
  /**
   * Report a post
   */
  reportPost(postId: number, reason: ReasonTypeEnum, customReason?: string): Promise<ReportDTO>;
  
  /**
   * Report a comment
   */
  reportComment(commentId: number, reason: ReasonTypeEnum, customReason?: string): Promise<ReportDTO>;
  
  // === MANAGEMENT (Admin/Moderator) ===
  
  /**
   * Get all reports with enhanced context for management
   */
  getAllReportsForManagement(): Promise<ReportManagementDTO[]>;
  
  /**
   * Get unresolved reports
   */
  getUnresolvedReports(): Promise<ReportManagementDTO[]>;
  
  /**
   * Get reports by type
   */
  getReportsByType(reportType: ReportTypeEnum): Promise<ReportManagementDTO[]>;
  
  /**
   * Resolve a report
   */
  resolveReport(reportId: number, resolutionNotes?: string): Promise<ReportDTO>;
  
  /**
   * Delete a report
   */
  deleteReport(reportId: number): Promise<void>;
}

class ReportApiClientImpl implements ReportApiClient {
  
  // === UNIFIED REPORTING ===
  
  async createReport(reportData: UnifiedReportDTO): Promise<ReportDTO> {
    try {
      console.log('[ReportApiClient] Creating unified report:', reportData);
      return await apiUtils.post<ReportDTO>('/reports/create', reportData);
    } catch (error) {
      console.error('[ReportApiClient] Error creating unified report:', error);
      throw this.handleError(error, 'Failed to create report');
    }
  }

  async reportUser(userId: number, reason: ReasonTypeEnum, customReason?: string): Promise<ReportDTO> {
    const reportData: UnifiedReportDTO = {
      reportType: ReportTypeEnum.USER,
      userId,
      reason,
      otherReasonMessage: customReason,
    };
    
    return this.createReport(reportData);
  }

  async reportPost(postId: number, reason: ReasonTypeEnum, customReason?: string): Promise<ReportDTO> {
    const reportData: UnifiedReportDTO = {
      reportType: ReportTypeEnum.POST,
      postId,
      reason,
      otherReasonMessage: customReason,
    };
    
    return this.createReport(reportData);
  }

  async reportComment(commentId: number, reason: ReasonTypeEnum, customReason?: string): Promise<ReportDTO> {
    const reportData: UnifiedReportDTO = {
      reportType: ReportTypeEnum.COMMENT,
      commentId,
      reason,
      otherReasonMessage: customReason,
    };
    
    return this.createReport(reportData);
  }

  // === MANAGEMENT (Admin/Moderator) ===

  async getAllReportsForManagement(): Promise<ReportManagementDTO[]> {
    try {
      console.log('[ReportApiClient] Fetching all reports for management');
      const reports = await apiUtils.get<ReportManagementDTO[]>('/reports/management');
      return reports || [];
    } catch (error) {
      console.error('[ReportApiClient] Error fetching reports for management:', error);
      throw this.handleError(error, 'Failed to load reports');
    }
  }

  async getUnresolvedReports(): Promise<ReportManagementDTO[]> {
    try {
      console.log('[ReportApiClient] Fetching unresolved reports');
      const reports = await apiUtils.get<ReportManagementDTO[]>('/reports/management/unresolved');
      return reports || [];
    } catch (error) {
      console.error('[ReportApiClient] Error fetching unresolved reports:', error);
      throw this.handleError(error, 'Failed to load unresolved reports');
    }
  }

  async getReportsByType(reportType: ReportTypeEnum): Promise<ReportManagementDTO[]> {
    try {
      console.log('[ReportApiClient] Fetching reports by type:', reportType);
      const reports = await apiUtils.get<ReportManagementDTO[]>(
        `/reports/management/type/${reportType}`
      );
      return reports || [];
    } catch (error) {
      console.error('[ReportApiClient] Error fetching reports by type:', error);
      throw this.handleError(error, `Failed to load ${reportType.toLowerCase()} reports`);
    }
  }

  async resolveReport(reportId: number, resolutionNotes?: string): Promise<ReportDTO> {
    try {
      console.log('[ReportApiClient] Resolving report:', reportId);
      const requestBody = resolutionNotes ? { resolutionNotes } : {};
      return await apiUtils.put<ReportDTO>(`/reports/management/${reportId}/resolve`, requestBody);
    } catch (error) {
      console.error('[ReportApiClient] Error resolving report:', error);
      throw this.handleError(error, 'Failed to resolve report');
    }
  }

  async deleteReport(reportId: number): Promise<void> {
    try {
      console.log('[ReportApiClient] Deleting report:', reportId);
      await apiUtils.delete(`/reports/management/${reportId}`);
    } catch (error) {
      console.error('[ReportApiClient] Error deleting report:', error);
      throw this.handleError(error, 'Failed to delete report');
    }
  }

  // === UTILITY METHODS ===

  private handleError(error: any, defaultMessage: string): Error {
    const statusCode = error?.response?.status;
    const errorMessage = error?.response?.data?.message || error?.message;
    
    let message = defaultMessage;
    if (statusCode || errorMessage) {
      const parts: string[] = [defaultMessage];
      if (statusCode) {
        parts.push(`Status: ${statusCode}`);
      }
      if (errorMessage) {
        parts.push(`Details: ${errorMessage}`);
      }
      message = parts.join(' - ');
    }
    
    return new Error(message);
  }
}

// Export singleton instance
export const reportApiClient: ReportApiClient = new ReportApiClientImpl();

// === CONVENIENCE HOOKS ===

export interface UseReportingOptions {
  onSuccess?: (report: ReportDTO) => void;
  onError?: (error: Error) => void;
}

/**
 * React hook for reporting functionality
 */
export const useReporting = (options?: UseReportingOptions) => {
  const reportUser = async (userId: number, reason: ReasonTypeEnum, customReason?: string) => {
    try {
      const report = await reportApiClient.reportUser(userId, reason, customReason);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const reportPost = async (postId: number, reason: ReasonTypeEnum, customReason?: string) => {
    try {
      const report = await reportApiClient.reportPost(postId, reason, customReason);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const reportComment = async (commentId: number, reason: ReasonTypeEnum, customReason?: string) => {
    try {
      const report = await reportApiClient.reportComment(commentId, reason, customReason);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  return {
    reportUser,
    reportPost,
    reportComment,
  };
};

export interface UseReportManagementOptions extends UseReportingOptions {
  onResolve?: (report: ReportDTO) => void;
  onDelete?: () => void;
  onLoadReports?: (reports: ReportManagementDTO[]) => void;
}

/**
 * React hook for report management functionality
 */
export const useReportManagement = (options?: UseReportManagementOptions) => {
  const getAllReports = async () => {
    try {
      const reports = await reportApiClient.getAllReportsForManagement();
      options?.onLoadReports?.(reports);
      return reports;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const getUnresolvedReports = async () => {
    try {
      const reports = await reportApiClient.getUnresolvedReports();
      options?.onLoadReports?.(reports);
      return reports;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const getReportsByType = async (reportType: ReportTypeEnum) => {
    try {
      const reports = await reportApiClient.getReportsByType(reportType);
      options?.onLoadReports?.(reports);
      return reports;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const resolveReport = async (reportId: number, resolutionNotes?: string) => {
    try {
      const report = await reportApiClient.resolveReport(reportId, resolutionNotes);
      options?.onResolve?.(report);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const deleteReport = async (reportId: number) => {
    try {
      await reportApiClient.deleteReport(reportId);
      options?.onDelete?.();
      return true;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  return {
    getAllReports,
    getUnresolvedReports,
    getReportsByType,
    resolveReport,
    deleteReport,
  };
};

/**
 * React hook specifically for resolve operations with enhanced functionality
 */
export const useResolveReport = (options?: UseReportManagementOptions) => {
  const resolveWithAction = async (
    reportId: number, 
    action: ResolutionAction, 
    customNotes?: string
  ) => {
    try {
      const finalNotes = customNotes || action.suggestedNote || `Report resolved: ${action.label}`;
      const report = await reportApiClient.resolveReport(reportId, finalNotes);
      options?.onResolve?.(report);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const quickResolve = async (reportId: number, reason = 'Quick resolution - no violation found') => {
    try {
      const report = await reportApiClient.resolveReport(reportId, reason);
      options?.onResolve?.(report);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  const resolveWithNotes = async (reportId: number, resolutionNotes: string) => {
    try {
      const report = await reportApiClient.resolveReport(reportId, resolutionNotes);
      options?.onResolve?.(report);
      options?.onSuccess?.(report);
      return report;
    } catch (error) {
      options?.onError?.(error as Error);
      throw error;
    }
  };

  return {
    resolveWithAction,
    quickResolve,
    resolveWithNotes,
  };
};

// === RESOLUTION ACTION TYPES ===

export interface ResolutionAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresNotes?: boolean;
  suggestedNote?: string;
}

export const RESOLUTION_ACTIONS: ResolutionAction[] = [
  {
    id: 'no_violation',
    label: 'No Violation Found',
    description: 'Content does not violate community guidelines',
    icon: 'check-circle',
    color: '#34C759',
    suggestedNote: 'No violation of community guidelines found after review.',
  },
  {
    id: 'warning_issued',
    label: 'Warning Issued',
    description: 'User has been warned about the content',
    icon: 'exclamation-triangle',
    color: '#FF9500',
    requiresNotes: true,
    suggestedNote: 'Warning issued to user regarding community guidelines.',
  },
  {
    id: 'content_removed',
    label: 'Content Removed',
    description: 'Violating content has been removed',
    icon: 'trash',
    color: '#FF3B30',
    requiresNotes: true,
    suggestedNote: 'Content removed for violating community guidelines.',
  },
  {
    id: 'user_suspended',
    label: 'User Suspended',
    description: 'User account has been temporarily suspended',
    icon: 'ban',
    color: '#FF3B30',
    requiresNotes: true,
    suggestedNote: 'User account suspended due to repeated violations.',
  },
  {
    id: 'duplicate_report',
    label: 'Duplicate Report',
    description: 'This issue has already been addressed',
    icon: 'copy',
    color: '#8E8E93',
    suggestedNote: 'Duplicate report - issue already addressed in previous report.',
  },
  {
    id: 'custom',
    label: 'Custom Resolution',
    description: 'Provide custom resolution notes',
    icon: 'edit',
    color: '#007AFF',
    requiresNotes: true,
  },
];

// === TYPE GUARDS ===

export const isReportManagementDTO = (report: any): report is ReportManagementDTO => {
  return report && typeof report === 'object' && 'reportType' in report;
};

export const isValidReportType = (type: string): type is ReportTypeEnum => {
  return Object.values(ReportTypeEnum).includes(type as ReportTypeEnum);
};

export const isValidReasonType = (reason: string): reason is ReasonTypeEnum => {
  return Object.values(ReasonTypeEnum).includes(reason as ReasonTypeEnum);
};

// === CONSTANTS ===

export const REPORT_TYPE_LABELS = {
  [ReportTypeEnum.USER]: 'User Report',
  [ReportTypeEnum.POST]: 'Post Report',
  [ReportTypeEnum.COMMENT]: 'Comment Report',
} as const;

export const REASON_TYPE_LABELS = {
  [ReasonTypeEnum.SPAM]: 'Spam',
  [ReasonTypeEnum.INAPPROPRIATE]: 'Inappropriate Content',
  [ReasonTypeEnum.HARASSMENT]: 'Harassment',
  [ReasonTypeEnum.FAKE_CONTENT]: 'Fake Content',
  [ReasonTypeEnum.VIOLENCE]: 'Violence',
  [ReasonTypeEnum.COPYRIGHT]: 'Copyright Infringement',
  [ReasonTypeEnum.OTHER]: 'Other',
} as const;

export const REASON_TYPE_COLORS = {
  [ReasonTypeEnum.VIOLENCE]: '#FF3B30',
  [ReasonTypeEnum.HARASSMENT]: '#FF3B30',
  [ReasonTypeEnum.SPAM]: '#FF9500',
  [ReasonTypeEnum.FAKE_CONTENT]: '#FF9500',
  [ReasonTypeEnum.INAPPROPRIATE]: '#FFCC00',
  [ReasonTypeEnum.COPYRIGHT]: '#FFCC00',
  [ReasonTypeEnum.OTHER]: '#8E8E93',
} as const;
