import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { primaryTextColor } from '@/src/app/utils/styles/colors';

interface LegalDocumentViewerProps {
    content: string;
}

export const LegalDocumentViewer = ({ content }: LegalDocumentViewerProps) => {
    const parseBold = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <Text key={i} style={styles.boldText}>
                        {part.slice(2, -2)}
                    </Text>
                );
            }
            return <Text key={i} style={styles.text}>{part}</Text>;
        });
    };

    const renderLine = (line: string, index: number) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={index} style={styles.spacing} />;

        // Header: "1. TITLE" or "TERMS OF SERVICE"
        // We check for "1. " or if the line is uppercase and short-ish (titles)
        const isNumberedHeader = /^\d+\.\s/.test(trimmed);
        const isMainTitle = /^[A-Z\s]+$/.test(trimmed) && trimmed.length > 3 && trimmed.length < 50;

        if (isNumberedHeader || isMainTitle) {
            return (
                <Text key={index} style={styles.header}>
                    {trimmed}
                </Text>
            );
        }

        // List item: "- Item"
        if (trimmed.startsWith('- ')) {
            return (
                <View key={index} style={styles.listItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.listItemText}>
                        {parseBold(trimmed.substring(2))}
                    </Text>
                </View>
            );
        }

        // Regular paragraph
        return (
            <Text key={index} style={styles.paragraph}>
                {parseBold(line)}
            </Text>
        );
    };

    return (
        <View style={styles.container}>
            {content.split('\n').map((line, index) => renderLine(line, index))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        color: primaryTextColor,
        marginTop: 24,
        marginBottom: 12,
    },
    paragraph: {
        fontSize: 14,
        color: primaryTextColor,
        lineHeight: 22,
        marginBottom: 8,
    },
    text: {
        fontSize: 14,
        color: primaryTextColor,
    },
    listItem: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingLeft: 8,
    },
    bullet: {
        fontSize: 14,
        color: primaryTextColor,
        marginRight: 8,
        lineHeight: 22,
    },
    listItemText: {
        flex: 1,
        fontSize: 14,
        color: primaryTextColor,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: 'bold',
        color: primaryTextColor,
    },
    spacing: {
        height: 8,
    },
});
