import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { DocumentoLegal } from '@/components/DocumentoLegal';
import { terminosUsoTexto } from '@/data/legal';
import { colors, spacing } from '@/theme';

export default function TerminosScreen() {
  const [texto, setTexto] = useState('');

  useEffect(() => {
    terminosUsoTexto().then(setTexto);
  }, []);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={styles.content}>
      <DocumentoLegal texto={texto} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
