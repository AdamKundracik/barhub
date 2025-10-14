import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { Icons } from '../../utils/icons/icons';
import { useUserRole } from '../../hooks/useUserRole';
import {
  primaryBgColor,
  primaryColor,
  separatorColor,
  warningColor,
} from '../../utils/styles/colors';
import { ScreenLayout } from '../../components/shared/Layouts/ScreenLayout';
import { BlurView } from 'expo-blur';
import { useCustomToast } from '../../components/shared/Toaster';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import { ReportDTO, reportService } from '../../services/reportService';
import { useTranslation } from 'react-i18next';
import { getLocales } from 'expo-localization';

interface ReportItemProps {
  report: ReportDTO;
  onReportPress: (report: ReportDTO) => void;
}

const ReportItem = ({ report, onReportPress }: ReportItemProps) => {
  const getReasonColor = (reason: string) => {
    switch (reason.toUpperCase()) {
      case 'SPAM':
      case 'HARASSMENT':
        return '#EF4444'; // Red
      case 'INAPPROPRIATE':
        return '#F59E0B'; // Orange
      default:
        return '#6B7280'; // Gray
    }
  };

  const reasonStr = String(report.reason);
  const reasonColor = getReasonColor(report.reason);
  const isOtherReason = reasonStr.toUpperCase() === 'OTHER';

  // Format timestamp with proper UTC parsing
  const formatTimestamp = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    // Add Z suffix if missing to ensure UTC parsing
    let isoString = dateString.replace(' ', 'T');
    if (!isoString.endsWith('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
      isoString = isoString + 'Z';
    }
    
    const date = new Date(isoString);
    const locales = getLocales();
    const userLocale = locales[0]?.languageTag || 'en-US';
    
    return date.toLocaleString(userLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => onReportPress(report)}
      activeOpacity={0.7}
    >
      <View style={styles.reportItemLeft}>
        <View style={styles.reportIcon}>
          <FontAwesomeIcon icon={Icons.Warning} size={20} color={reasonColor} />
        </View>

        <View style={styles.reportInfo}>
          <View style={styles.reportHeader}>
            <View
              style={[
                styles.reasonBadge,
                {
                  backgroundColor: `${reasonColor}20`,
                  borderColor: `${reasonColor}40`,
                },
              ]}
            >
              <Text style={[styles.reasonText, { color: reasonColor }]}>
                {reasonStr}
              </Text>
            </View>
            <Text style={styles.reportId}>#{report.id}</Text>
          </View>

          {isOtherReason && report.otherReasonMessage && (
            <Text style={styles.reportDescription} numberOfLines={2}>
              {report.otherReasonMessage}
            </Text>
          )}

          <View style={styles.reportMeta}>
            <Text style={styles.metaText}>Post ID: {report.postId}</Text>
            <Text style={styles.metaText}>•</Text>
            <Text style={styles.metaText}>
              Reporter: {report.userName || `User #${report.userId}`}
            </Text>
          </View>

          {report.createdAt && (
            <Text style={styles.reportTimestamp}>
              {formatTimestamp(report.createdAt)}
            </Text>
          )}
        </View>
      </View>

      <FontAwesomeIcon
        icon={Icons.ChevronRight}
        size={16}
        color={separatorColor}
      />
    </TouchableOpacity>
  );
};

export const ReportsManagement: React.FC = () => {
  const { isAdmin, isModerator } = useUserRole();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Format timestamp with proper UTC parsing
  const formatTimestamp = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    // Add Z suffix if missing to ensure UTC parsing
    let isoString = dateString.replace(' ', 'T');
    if (!isoString.endsWith('Z') && !isoString.includes('+') && !isoString.includes('-', 10)) {
      isoString = isoString + 'Z';
    }
    
    const date = new Date(isoString);
    const locales = getLocales();
    const userLocale = locales[0]?.languageTag || 'en-US';
    
    return date.toLocaleString(userLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const [selectedReport, setSelectedReport] = useState<ReportDTO | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);

  // console.log('[ReportsManagement] Component rendered');
  // console.log('[ReportsManagement] isAdmin:', isAdmin);
  // console.log('[ReportsManagement] isModerator:', isModerator);

  // Fetch all reports (Admin/Moderator only)
  const {
    data: reports = [],
    isLoading,
    refetch,
  } = useQuery<ReportDTO[]>(
    ['admin', 'reports'],
    async () => {
      const data = await reportService.getAllReports();
      // console.log('[ReportsManagement] Fetched reports:', data);
      // console.log('[ReportsManagement] Reports count:', data?.length || 0);
      return data;
    },
    {
      enabled: isAdmin || isModerator,
      staleTime: 30000,
      refetchOnWindowFocus: true,
    }
  );

  // Delete report mutation
  const deleteReportMutation = useMutation(
    async (reportId: number) => {
      return await reportService.deleteReport(reportId);
    },
    {
      onSuccess: () => {
        showSuccessToast(t('success'), t('admin.reportDeleted'));
        queryClient.invalidateQueries(['admin', 'reports']);
        setSelectedReport(null);
      },
      onError: (error: any) => {
        showErrorToast(t('error'), error.message || 'Failed to delete report');
      },
    }
  );

  const handleReportPress = useCallback((report: ReportDTO) => {
    setSelectedReport(report);
  }, []);

  const handleDeleteReport = useCallback(() => {
    if (!selectedReport || !selectedReport.id) return;

    Alert.alert(t('admin.deleteReport'), t('admin.deleteReportConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete-post'),
        style: 'destructive',
        onPress: () => {
          deleteReportMutation.mutate(selectedReport.id!);
        },
      },
    ]);
  }, [selectedReport, deleteReportMutation, t]);

  // Filter reports by selected type
  const filteredReports = useMemo(() => {
    // console.log('[ReportsManagement] === FILTERING ===');
    // console.log('[ReportsManagement] Total reports:', reports.length);
    // console.log(
    //   '[ReportsManagement] Reports data:',
    // JSON.stringify(reports, null, 2)
    // );
    // console.log('[ReportsManagement] Selected filter:', selectedFilter);

    if (selectedFilter === 'ALL') {
      // console.log('[ReportsManagement] Returning all reports:', reports);
      return reports;
    }

    const filtered = reports.filter(r => {
      const reasonStr = r.reason;
      const matches = reasonStr.toUpperCase() === selectedFilter.toUpperCase();
      // console.log(
      //   `[ReportsManagement] Report ${r.id}: reason=${reasonStr}, matches=${matches}`
      // );
      return matches;
    });

    // console.log('[ReportsManagement] Filtered reports count:', filtered.length);
    // console.log('[ReportsManagement] Filtered reports:', filtered);
    return filtered;
  }, [reports, selectedFilter]);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      spam: reports.filter(r => r.reason.toUpperCase() === 'SPAM').length,
      inappropriate: reports.filter(
        r => r.reason.toUpperCase() === 'INAPPROPRIATE'
      ).length,
      harassment: reports.filter(r => r.reason.toUpperCase() === 'HARASSMENT')
        .length,
      other: reports.filter(r => r.reason.toUpperCase() === 'OTHER').length,
    };
  }, [reports]);

  const FILTER_TYPES = [
    { key: 'ALL', label: t('admin.all'), color: primaryColor },
    { key: 'SPAM', label: t('admin.spam'), color: '#EF4444' },
    { key: 'INAPPROPRIATE', label: t('admin.inappropriate'), color: '#F59E0B' },
    { key: 'HARASSMENT', label: t('admin.harassment'), color: '#EF4444' },
    { key: 'OTHER', label: t('admin.other'), color: '#6B7280' },
  ];

  if (!isAdmin && !isModerator) {
    return (
      <ScreenLayout>
        <View style={styles.unauthorizedContainer}>
          <FontAwesomeIcon icon={Icons.Lock} size={64} color={warningColor} />
          <Text style={styles.unauthorizedTitle}>
            {t('admin.accessDenied')}
          </Text>
          <Text style={styles.unauthorizedText}>{t('admin.noPermission')}</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <FontAwesomeIcon
                icon={Icons.ChevronLeft}
                size={20}
                color={'white'}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {t('admin.reportsManagement')}
            </Text>

            <TouchableOpacity
              onPress={() => refetch()}
              style={styles.refreshButton}
            >
              <FontAwesomeIcon
                icon={Icons.Rotate}
                size={20}
                color={primaryColor}
              />
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('admin.total')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {stats.spam}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('admin.spam')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                {stats.inappropriate}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('admin.inappropriate')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#EF4444' }]}>
                {stats.harassment}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('admin.harassment')}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: '#6B7280' }]}>
                {stats.other}
              </Text>
              <Text
                style={styles.statLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('admin.other')}
              </Text>
            </View>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          {/* Filter Toggle Button */}
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setShowFilters(!showFilters)}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon
              icon={Icons.Filter}
              size={16}
              color={primaryColor}
            />
            <Text style={styles.filterToggleText}>
              {t('admin.filters')}{' '}
              {selectedFilter !== 'ALL' && `• ${selectedFilter}`}
            </Text>
            <FontAwesomeIcon
              icon={showFilters ? Icons.ChevronUp : Icons.ChevronRight}
              size={14}
              color={separatorColor}
            />
          </TouchableOpacity>

          {/* Filter Tabs - Collapsible */}
          {showFilters && (
            <View style={styles.filterContainer}>
              {FILTER_TYPES.map(filter => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterTab,
                    selectedFilter === filter.key && {
                      borderColor: filter.color,
                      backgroundColor: `${filter.color}20`,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter.key);
                    setShowFilters(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterTabText,
                      selectedFilter === filter.key && {
                        color: filter.color,
                        fontWeight: '700',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Report List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>{t('admin.loadingReports')}</Text>
          </View>
        ) : (
          <FlashList
            data={filteredReports}
            keyExtractor={item =>
              item.id?.toString() || Math.random().toString()
            }
            renderItem={({ item }) => (
              <ReportItem report={item} onReportPress={handleReportPress} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            extraData={selectedFilter}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesomeIcon
                  icon={Icons.Check}
                  size={48}
                  color={primaryColor}
                />
                <Text style={styles.emptyText}>
                  {t('admin.noReportsFound')}
                </Text>
                <Text style={styles.emptySubtext}>{t('admin.allClear')}</Text>
              </View>
            }
          />
        )}

        {/* Report Actions Modal */}
        <Modal
          visible={selectedReport !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedReport(null)}
        >
          <BlurView intensity={100} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Report #{selectedReport?.id}
                </Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)}>
                  <FontAwesomeIcon icon={Icons.Remove} size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Report Details */}
              <View style={styles.reportDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('admin.reportReason')}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedReport?.reason && String(selectedReport.reason)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('admin.postId')}:</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport?.postId}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('admin.reporter')}:</Text>
                  <Text style={styles.detailValue}>
                    {selectedReport?.userName ||
                      `User #${selectedReport?.userId}`}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('admin.reporterId')}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {selectedReport?.userId}
                  </Text>
                </View>
                {selectedReport?.createdAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>
                      {t('admin.reportedAt')}:
                    </Text>
                    <Text style={styles.detailValue}>
                      {formatTimestamp(selectedReport.createdAt)}
                    </Text>
                  </View>
                )}
                {selectedReport?.otherReasonMessage &&
                  String(selectedReport.reason).toUpperCase() === 'OTHER' && (
                    <View style={styles.detailColumn}>
                      <Text style={styles.detailLabel}>
                        {t('admin.description')}:
                      </Text>
                      <Text style={styles.detailValue}>
                        {selectedReport.otherReasonMessage}
                      </Text>
                    </View>
                  )}
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteReport}
                >
                  <FontAwesomeIcon
                    icon={Icons.TrashCan}
                    size={18}
                    color={warningColor}
                  />
                  <Text
                    style={[styles.actionButtonText, { color: warningColor }]}
                  >
                    {t('admin.deleteReport')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: primaryColor,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: separatorColor,
  },
  filterSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterToggleText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reportItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportId: {
    fontSize: 12,
    color: separatorColor,
  },
  reportDescription: {
    fontSize: 14,
    color: '#FFF',
    marginBottom: 6,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: separatorColor,
  },
  reportTimestamp: {
    fontSize: 11,
    color: separatorColor,
    marginTop: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: separatorColor,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: primaryColor,
  },
  emptySubtext: {
    fontSize: 16,
    color: separatorColor,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: warningColor,
  },
  unauthorizedText: {
    fontSize: 16,
    color: separatorColor,
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: primaryBgColor,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  reportDetails: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailColumn: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: separatorColor,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#FFF',
  },
  modalActions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 217, 185, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 217, 185, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(254, 120, 120, 0.1)',
    borderColor: 'rgba(254, 120, 120, 0.2)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
