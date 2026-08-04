import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { Math as ReactPdfMath } from '@react-pdf/math';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#0f172a',
  },
  inlineMath: {
    marginHorizontal: 0,
  },
  blockMathContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 4,
  }
});

interface LatexParserProps {
  content: string;
  style?: any;
}

import { autoWrapBareLatex } from '../MathRenderer';

export const LatexParser: React.FC<LatexParserProps> = ({ content, style }) => {
  if (!content) return null;

  // Process and normalize LaTeX before rendering
  const processedContent = autoWrapBareLatex(content, false);

  // Split content by $$...$$ for block math, and $...$ for inline math.
  const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;
  const parts = processedContent.split(regex);

  return (
    <View style={[styles.container, style]}>
      {parts.map((part, index) => {
        if (!part) return null;

        // Check if block math
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const mathExpr = part.slice(2, -2).trim();
          return (
            <View key={index} style={styles.blockMathContainer}>
              <ReactPdfMath fontSize={10}>{mathExpr}</ReactPdfMath>
            </View>
          );
        }

        // Check if inline math
        if (part.startsWith('$') && part.endsWith('$')) {
          const mathExpr = part.slice(1, -1).trim();
          return (
            <View key={index} style={styles.inlineMath}>
              <ReactPdfMath inline fontSize={10}>{mathExpr}</ReactPdfMath>
            </View>
          );
        }

        // Otherwise it's regular text.
        // Split into individual words so they wrap naturally alongside inline math in flex-wrap row.
        const lines = part.split('\n');
        return lines.map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line && line.split(/(\s+)/).map((word, wordIndex) => {
              if (!word) return null;
              // Preserve whitespace as-is
              if (/^\s+$/.test(word)) {
                return <Text key={`${index}-${lineIndex}-${wordIndex}`} style={styles.text}> </Text>;
              }
              return <Text key={`${index}-${lineIndex}-${wordIndex}`} style={styles.text}>{word}</Text>;
            })}
            {lineIndex < lines.length - 1 && <View style={{ width: '100%', height: 4 }} />}
          </React.Fragment>
        ));
      })}
    </View>
  );
};
