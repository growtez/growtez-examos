import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';
import { Math as ReactPdfMath } from '@react-pdf/math';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#0f172a',
  },
  inlineMath: {
    marginHorizontal: 1,
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
        // We might want to handle newlines by splitting and rendering multiple Text components.
        // Because of flexWrap: 'wrap', simple words should wrap, but new lines need forced breaks.
        // Actually, rendering text inside flexRow wrap requires we let <Text> handle its own wrap 
        // if possible, but React-PDF Text doesn't wrap alongside sibling views natively unless they are inside it.
        // For robust wrapping with inline math, we need to wrap each word in Text, or keep them together.
        // For now, let's keep the block together.
        const lines = part.split('\n');
        return lines.map((line, lineIndex) => (
          <React.Fragment key={`${index}-${lineIndex}`}>
            {line && <Text style={styles.text}>{line}</Text>}
            {lineIndex < lines.length - 1 && <View style={{ width: '100%', height: 4 }} />}
          </React.Fragment>
        ));
      })}
    </View>
  );
};
