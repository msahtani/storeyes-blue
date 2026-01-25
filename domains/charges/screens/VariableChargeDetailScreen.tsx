import { Text } from '@/components/Themed';
import { BluePalette } from '@/constants/Colors';
import { useI18n } from '@/constants/i18n/I18nContext';
import BottomBar from '@/domains/shared/components/BottomBar';
import Feather from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getVariableChargeById } from '../services/chargesService';
import { VariableChargeDetail } from '../types/charge';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function VariableChargeDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [charge, setCharge] = useState<VariableChargeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  // Fetch charge detail function
  const fetchCharge = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const chargeId = parseInt(id, 10);
      if (isNaN(chargeId)) {
        throw new Error('Invalid charge ID');
      }

      const response = await getVariableChargeById(chargeId);

      // Convert to frontend format
      const frontendCharge: VariableChargeDetail = {
        id: response.id.toString(),
        name: response.name,
        amount: response.amount,
        date: response.date,
        category: response.category,
        supplier: response.supplier,
        notes: response.notes,
        purchaseOrderUrl: response.purchaseOrderUrl,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
      };

      setCharge(frontendCharge);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to load charge details';
      setError(errorMessage);
      console.error('Error fetching variable charge:', err);
      setCharge(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch charge detail when id changes
  useEffect(() => {
    fetchCharge();
  }, [fetchCharge]);

  // Refetch when screen comes into focus (after edit)
  useFocusEffect(
    useCallback(() => {
      fetchCharge();
    }, [fetchCharge])
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
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
    // Ensure url is a valid non-empty string before setting state
    if (url && typeof url === 'string' && url.length > 0) {
      setSelectedImageUrl(url);
      setImageModalVisible(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
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
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={BluePalette.merge} />
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  if (error || !charge) {
    return (
      <SafeAreaView
        edges={['left', 'right']}
        style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
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
            {error || t('charges.variable.details.notFound')}
          </Text>
        </View>
        <BottomBar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['left', 'right']}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={BluePalette.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {charge.name}
        </Text>
        <Pressable
          style={styles.editButton}
          onPress={() => router.push(`/charges/variable/edit/${id}` as any)}
        >
          <Feather name="edit-2" size={20} color={BluePalette.merge} />
        </Pressable>
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

        {/* Purchase Order Section - HIDDEN FOR NOW */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('charges.variable.details.purchaseOrder')}
          </Text>
          {charge.purchaseOrderUrl ? (
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
          ) : (
            <View style={styles.missingReceiptCard}>
              <Feather name="alert-circle" size={24} color={BluePalette.warning} />
              <Text style={styles.missingReceiptText}>
                No purchase order available
              </Text>
            </View>
          )}
        </View> */}
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
            {selectedImageUrl && typeof selectedImageUrl === 'string' && selectedImageUrl.length > 0 && (
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
    backgroundColor: BluePalette.backgroundNew,
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
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BluePalette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BluePalette.border,
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
    backgroundColor: BluePalette.backgroundNew,
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
    color: BluePalette.white,
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
    backgroundColor: BluePalette.backgroundNew,
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
    color: BluePalette.white,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  notesText: {
    fontSize: 15,
    color: BluePalette.textTertiary,
    lineHeight: 22,
  },
  imageCard: {
    backgroundColor: BluePalette.backgroundNew,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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

