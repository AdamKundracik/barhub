import React, { useState, useMemo, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { UserStackList } from '@/src/app/utils/types/screen-types';
import { Icons } from '@/src/app/utils/icons/icons';
import {
  primaryBgColor,
  primaryColor,
  secondaryTextColor,
} from '@/src/app/utils/styles/colors';
import { useLogsStore, LogEntry, LogLevel } from '@/src/app/utils/store/logsStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DebugLogsScreen = () => {
  const navigation = useNavigation<NavigationProp<UserStackList>>();
  const { logs, clearLogs, getLogsByCategory, loadLogs, isInitialized } = useLogsStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load logs on mount if not initialized
  useEffect(() => {
    if (!isInitialized) {
      loadLogs();
    }
  }, [isInitialized, loadLogs]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(logs.map(log => log.category));
    return Array.from(uniqueCategories).sort();
  }, [logs]);

  // Filter logs based on selected category and level
  const filteredLogs = useMemo(() => {
    let filtered = logs;

    if (selectedCategory) {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    if (selectedLevel) {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    return filtered.reverse(); // Most recent first
  }, [logs, selectedCategory, selectedLevel]);

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('sk-SK', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const formatTimestampFull = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('sk-SK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const handleExportLogs = async () => {
    if (filteredLogs.length === 0) {
      Alert.alert('No Logs', 'There are no logs to export.');
      return;
    }

    setIsExporting(true);
    try {
      // Create text content (more readable)
      const textContent = filteredLogs
        .map(log => {
          const timestamp = formatTimestampFull(log.timestamp);
          const level = log.level.toUpperCase().padEnd(5);
          const category = log.category.padEnd(20);
          const message = log.message;
          const dataStr = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
          return `[${timestamp}] ${level} [${category}] ${message}${dataStr}`;
        })
        .join('\n\n');

      // Create file name with timestamp
      const fileName = `barhub-logs-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, textContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Debug Logs',
        });
      } else {
        Alert.alert(
          'Export Complete',
          `Logs exported to: ${fileUri}\n\nSharing is not available on this device.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      Alert.alert('Export Failed', `Failed to export logs: ${error}`);
    } finally {
      setIsExporting(false);
    }
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error':
        return '#ff4444';
      case 'warn':
        return '#ffaa00';
      case 'debug':
        return '#8888ff';
      default:
        return '#ffffff';
    }
  };

  const renderLogItem = ({ item }: { item: LogEntry }) => {
    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <View style={styles.logHeaderLeft}>
            <View
              style={[
                styles.levelBadge,
                { backgroundColor: getLevelColor(item.level) },
              ]}
            >
              <Text style={styles.levelText}>{item.level.toUpperCase()}</Text>
            </View>
            <Text style={styles.categoryText}>{item.category}</Text>
            <Text style={styles.timestampText}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
        <Text style={styles.logMessage}>{item.message}</Text>
        {item.data && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataText}>
              {JSON.stringify(item.data, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={Icons.Remove} size={28} color={'white'} />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>Debug Logs</Text>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleExportLogs}
              style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
              disabled={isExporting || filteredLogs.length === 0}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesomeIcon icon={Icons.Download} size={18} color={'white'} />
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === null && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === null && styles.filterChipTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.filterChip,
                  selectedCategory === category && styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedCategory(
                    selectedCategory === category ? null : category
                  )
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === category && styles.filterChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedLevel === null && styles.filterChipActive,
              ]}
              onPress={() => setSelectedLevel(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedLevel === null && styles.filterChipTextActive,
                ]}
              >
                All Levels
              </Text>
            </TouchableOpacity>
            {(['error', 'warn', 'info', 'debug'] as LogLevel[]).map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterChip,
                  selectedLevel === level && styles.filterChipActive,
                ]}
                onPress={() =>
                  setSelectedLevel(selectedLevel === level ? null : level)
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLevel === level && styles.filterChipTextActive,
                  ]}
                >
                  {level.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Logs count */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Total: {logs.length} | Showing: {filteredLogs.length}
          </Text>
        </View>

        {/* Logs list */}
        {filteredLogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLogs}
            renderItem={renderLogItem}
            keyExtractor={item => item.id}
            style={styles.logsList}
            contentContainerStyle={styles.logsListContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: primaryBgColor,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C28',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: primaryColor,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4444',
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C28',
  },
  filtersScroll: {
    paddingHorizontal: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#1C1C28',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterChipActive: {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
  },
  filterChipText: {
    color: secondaryTextColor,
    fontSize: 12,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#000',
    fontWeight: '600',
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C28',
  },
  statsText: {
    color: secondaryTextColor,
    fontSize: 12,
  },
  logsList: {
    flex: 1,
  },
  logsListContent: {
    padding: 8,
  },
  logItem: {
    backgroundColor: '#1C1C28',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: primaryColor,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  levelText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryText: {
    color: primaryColor,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  timestampText: {
    color: secondaryTextColor,
    fontSize: 10,
  },
  logMessage: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  dataContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#0a0a0a',
    borderRadius: 4,
  },
  dataText: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: secondaryTextColor,
    fontSize: 16,
  },
});

export default DebugLogsScreen;

