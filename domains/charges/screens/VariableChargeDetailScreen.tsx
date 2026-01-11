import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Pressable,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import Feather from '@expo/vector-icons/Feather';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BottomBar from '@/domains/shared/components/BottomBar';
import { VariableChargeDetail } from '../types/charge';

// Mock data - replace with actual data fetching
const mockVariableChargeDetails: Record<string, VariableChargeDetail> = {
  '1': {
    id: '1',
    name: 'Coffee Beans - Premium Blend',
    amount: 245.50,
    date: '2024-01-15',
    category: 'Supplies',
    supplier: 'Coffee Distributors Inc.',
    notes: 'Monthly order of premium blend coffee beans',
    hasReceipt: true,
    receiptUrl: 'https://example.com/receipt1.jpg',
  },
  '2': {
    id: '2',
    name: 'Cleaning Supplies',
    amount: 89.99,
    date: '2024-01-14',
    category: 'Maintenance',
    supplier: 'Supply Co.',
    hasReceipt: false,
  },
  '3': {
    id: '3',
    name: 'Milk Delivery',
    amount: 156.00,
    date: '2024-01-13',
    category: 'Supplies',
    supplier: 'Dairy Farm',
    hasReceipt: true,
    receiptUrl: 'https://example.com/receipt3.jpg',
  },
  '4': {
    id: '4',
    name: 'Equipment Repair',
    amount: 320.00,
    date: '2024-01-12',
    category: 'Maintenance',
    supplier: 'Tech Services',
    notes: 'Espresso machine maintenance and repair',
    hasReceipt: true,
    receiptUrl: 'https://example.com/receipt4.jpg',
    purchaseOrderUrl: 'https://example.com/po4.jpg',
  },
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VariableChargeDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const charge = useMemo(() => {
    if (!id) return null;
    return mockVariableChargeDetails[id] || null;
  }, [id]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleImagePress = (url: string) => {
    setSelectedImageUrl(url);
    setImageModalVisible(true);
  };

  if (!charge) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.container, { backgroundColor: BluePalette.backgroundCard }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>
            {t('charges.variable.details.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            {t('charges.variable.details.notFound')}
          </Text>
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.backgroundCard }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {charge.name}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomBarTotalHeight + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>
            {t('charges.variable.details.amount')}
          </Text>
          <Text style={styles.amountValue}>{formatAmount(charge.amount)}</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('charges.variable.details.details')}
          </Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Feather name="calendar" size={16} color={BluePalette.merge} />
                <Text style={styles.detailLabel}>
                  {t('charges.variable.details.date')}
                </Text>
              </View>
              <Text style={styles.detailValue}>{formatDate(charge.date)}</Text>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailLabelContainer}>
                <Feather name="tag" size={16} color={BluePalette.merge} />
                <Text style={styles.detailLabel}>
                  {t('charges.variable.details.category')}
                </Text>
              </View>
              <Text style={styles.detailValue}>{charge.category}</Text>
            </View>

            {charge.supplier && (
              <View style={styles.detailRow}>
                <View style={styles.detailLabelContainer}>
                  <Feather name="truck" size={16} color={BluePalette.merge} />
                  <Text style={styles.detailLabel}>
                    {t('charges.variable.details.supplier')}
                  </Text>
                </View>
                <Text style={styles.detailValue}>{charge.supplier}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {charge.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('charges.variable.details.notes')}
            </Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{charge.notes}</Text>
            </View>
          </View>
        )}

        {/* Receipt Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('charges.variable.details.receipt')}
          </Text>
          {charge.hasReceipt && charge.receiptUrl ? (
            <Pressable
              style={({ pressed }) => [
                styles.imageCard,
                pressed && styles.imageCardPressed,
              ]}
              onPress={() => handleImagePress(charge.receiptUrl!)}
            >
              <View style={styles.imagePlaceholder}>
                <Feather name="file-text" size={32} color={BluePalette.merge} />
                <Text style={styles.imagePlaceholderText}>
                  {t('charges.variable.details.viewReceipt')}
                </Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.missingReceiptCard}>
              <Feather name="alert-circle" size={24} color={BluePalette.warning} />
              <Text style={styles.missingReceiptText}>
                {t('charges.variable.details.noReceipt')}
              </Text>
            </View>
          )}
        </View>

        {/* Purchase Order Section */}
        {charge.purchaseOrderUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {t('charges.variable.details.purchaseOrder')}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.imageCard,
                pressed && styles.imageCardPressed,
              ]}
              onPress={() => handleImagePress(charge.purchaseOrderUrl!)}
            >
              <View style={styles.imagePlaceholder}>
                <Feather name="file-text" size={32} color={BluePalette.merge} />
                <Text style={styles.imagePlaceholderText}>
                  {t('charges.variable.details.viewPurchaseOrder')}
                </Text>
              </View>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Fullscreen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setImageModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <Pressable
              style={[styles.modalCloseButton, { top: insets.top + 20 }]}
              onPress={() => setImageModalVisible(false)}
            >
              <Feather name="x" size={24} color={BluePalette.textPrimary} />
            </Pressable>
            {selectedImageUrl && (
              <Image
                source={{ uri: selectedImageUrl }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BluePalette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: BluePalette.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  amountCard: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: BluePalette.border,
    alignItems: 'center',
    gap: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BluePalette.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -1,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BluePalette.textDark,
    letterSpacing: -0.3,
  },
  detailsCard: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: BluePalette.textTertiary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: BluePalette.textDark,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesCard: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  notesText: {
    fontSize: 15,
    color: BluePalette.textDark,
    lineHeight: 22,
  },
  imageCard: {
    backgroundColor: BluePalette.backgroundCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.border,
    overflow: 'hidden',
  },
  imageCardPressed: {
    opacity: 0.7,
    borderColor: BluePalette.merge,
  },
  imagePlaceholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: BluePalette.surfaceDark,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: BluePalette.textPrimary,
    fontWeight: '600',
  },
  missingReceiptCard: {
    backgroundColor: `${BluePalette.warning}10`,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: BluePalette.warning,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  missingReceiptText: {
    fontSize: 15,
    color: BluePalette.textDark,
    fontWeight: '600',
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT - 100,
  },
  messageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    color: BluePalette.textDark,
    fontSize: 16,
    marginTop: 12,
  },
});

