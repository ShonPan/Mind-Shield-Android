import React, {useMemo} from 'react';
import {ScrollView, Text, StyleSheet} from 'react-native';
import {colors, fonts, spacing, borderRadius} from '../styles/theme';

interface TranscriptViewProps {
  transcript: string;
  highlightPhrases?: string[];
}

interface TextSegment {
  text: string;
  highlighted: boolean;
}

/**
 * Splits the transcript into segments, marking those matching any of the
 * highlight phrases. Matching is case-insensitive.
 */
function buildSegments(
  transcript: string,
  phrases: string[],
): TextSegment[] {
  if (phrases.length === 0) {
    return [{text: transcript, highlighted: false}];
  }

  // Build a regex that matches any of the phrases (case-insensitive).
  // Escape special regex characters in each phrase.
  const escaped = phrases
    .filter(p => p.length > 0)
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (escaped.length === 0) {
    return [{text: transcript, highlighted: false}];
  }

  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(transcript)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      segments.push({
        text: transcript.slice(lastIndex, match.index),
        highlighted: false,
      });
    }
    // The matched phrase
    segments.push({
      text: match[0],
      highlighted: true,
    });
    lastIndex = pattern.lastIndex;
  }

  // Remaining text after the last match
  if (lastIndex < transcript.length) {
    segments.push({
      text: transcript.slice(lastIndex),
      highlighted: false,
    });
  }

  return segments;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({
  transcript,
  highlightPhrases,
}) => {
  const segments = useMemo(
    () => buildSegments(transcript, highlightPhrases ?? []),
    [transcript, highlightPhrases],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityRole="text">
      <Text style={styles.transcriptText}>
        {segments.map((segment, index) =>
          segment.highlighted ? (
            <Text key={index} style={styles.highlight}>
              {segment.text}
            </Text>
          ) : (
            <Text key={index}>{segment.text}</Text>
          ),
        )}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  content: {
    padding: spacing.md,
  },
  transcriptText: {
    fontSize: fonts.sizeBody, // 18sp
    fontWeight: fonts.weightRegular,
    color: colors.textPrimary,
    lineHeight: 28,
  },
  highlight: {
    backgroundColor: '#FFF176', // yellow highlight
    color: colors.textPrimary,
    fontWeight: fonts.weightMedium,
  },
});

export default TranscriptView;
