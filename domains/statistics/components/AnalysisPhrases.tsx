import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import Feather from '@expo/vector-icons/Feather';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ChargeDetail, KPIData } from '../types/statistics';

interface AnalysisPhrasesProps {
  kpi: KPIData;
  charges?: ChargeDetail[];
}

export default function AnalysisPhrases({ kpi, charges = [] }: AnalysisPhrasesProps) {
  const phrases = useMemo(() => {
    const result: string[] = [];

    // Charges analysis
    if (kpi.chargesPercentage !== undefined) {
      if (kpi.chargesPercentage > 75) {
        result.push(`Les charges représentent ${kpi.chargesPercentage.toFixed(1)}% du chiffre d'affaires (seuil critique dépassé)`);
      } else if (kpi.chargesPercentage > 66) {
        result.push(`Les charges représentent ${kpi.chargesPercentage.toFixed(1)}% du chiffre d'affaires (attention requise)`);
      } else {
        result.push(`Les charges représentent ${kpi.chargesPercentage.toFixed(1)}% du chiffre d'affaires (niveau sain)`);
      }
    }

    // Profit analysis
    if (kpi.profitPercentage !== undefined) {
      if (kpi.profitPercentage < 15) {
        result.push(`Les bénéfices sont en dessous du seuil recommandé (${kpi.profitPercentage.toFixed(1)}%)`);
      } else if (kpi.profitPercentage < 33) {
        result.push(`Les bénéfices sont à ${kpi.profitPercentage.toFixed(1)}% du chiffre d'affaires (niveau moyen)`);
      } else {
        result.push(`Les bénéfices sont à ${kpi.profitPercentage.toFixed(1)}% du chiffre d'affaires (excellent niveau)`);
      }
    }

    // Top charge analysis
    if (charges.length > 0) {
      const topCharge = charges.reduce((max, charge) => 
        charge.percentageOfCharges > max.percentageOfCharges ? charge : max
      );
      if (topCharge.percentageOfCharges > 30) {
        result.push(`Les charges de ${topCharge.name} représentent ${topCharge.percentageOfCharges.toFixed(1)}% des charges totales`);
      }
    }

    return result;
  }, [kpi, charges]);

  if (phrases.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Feather name="info" size={16} color={BluePalette.merge} />
        <Text style={styles.title}>Analyse</Text>
      </View>
      <View style={styles.phrasesContainer}>
        {phrases.map((phrase, index) => (
          <View key={index} style={styles.phraseItem}>
            <View style={styles.bullet} />
            <Text style={styles.phraseText}>{phrase}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.2,
  },
  phrasesContainer: {
    gap: 10,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BluePalette.merge,
    marginTop: 6,
  },
  phraseText: {
    flex: 1,
    fontSize: 13,
    color: BluePalette.textSecondary,
    lineHeight: 20,
  },
});

