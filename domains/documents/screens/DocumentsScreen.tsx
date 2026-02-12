import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import BottomBar from "@/domains/shared/components/BottomBar";
import { getDocuments } from "@/domains/documents/services/documentsService";
import { useDocumentActions } from "@/domains/documents/hooks/useDocumentActions";
import { Document } from "@/domains/documents/types/document";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function DocumentCard({
  doc,
  onPress,
}: {
  doc: Document;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const {
    handleOpen,
    handleShare,
    openLoading,
    shareLoading,
  } = useDocumentActions(doc);

  return (
    <View style={styles.itemCard}>
      <Pressable
        style={({ pressed }) => [
          styles.itemCardMain,
          pressed && styles.itemCardPressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.itemIconContainer}>
          <Feather name="file-text" size={28} color={BluePalette.merge} />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle} numberOfLines={1}>
            {doc.name}
          </Text>
          {doc.description && (
            <Text style={styles.itemDescription} numberOfLines={2}>
              {doc.description}
            </Text>
          )}
        </View>
      </Pressable>
      <View style={styles.itemActionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.cardActionButton,
            pressed && styles.cardActionButtonPressed,
          ]}
          onPress={() => handleOpen()}
          disabled={openLoading}
        >
          {openLoading ? (
            <ActivityIndicator size="small" color={BluePalette.textPrimary} />
          ) : (
            <Feather name="external-link" size={16} color={BluePalette.textPrimary} />
          )}
          <Text style={styles.cardActionText}>
            {t("documents.details.open")}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.cardActionButton,
            pressed && styles.cardActionButtonPressed,
          ]}
          onPress={() => handleShare()}
          disabled={shareLoading}
        >
          {shareLoading ? (
            <ActivityIndicator size="small" color={BluePalette.textPrimary} />
          ) : (
            <Feather name="share-2" size={16} color={BluePalette.textPrimary} />
          )}
          <Text style={styles.cardActionText}>
            {t("documents.details.share")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DocumentsScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err: any) {
      console.error("Error fetching documents:", {
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("documents.list.failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchDocuments();
    }, [fetchDocuments])
  );

  const handleCreatePress = () => {
    router.push("/documents/create" as any);
  };

  const handleItemPress = (id: string) => {
    router.push(`/documents/${id}` as any);
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather
            name="arrow-left"
            size={24}
            color={BluePalette.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t("documents.screen.title")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Create Button */}
      <View style={styles.createButtonContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreatePress}
        >
          <Feather name="plus" size={20} color={BluePalette.white} />
          <Text style={styles.createButtonText}>
            {t("documents.list.newDocument")}
          </Text>
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
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BluePalette.merge} />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.retryButton,
                pressed && styles.retryButtonPressed,
              ]}
              onPress={fetchDocuments}
            >
              <Text style={styles.retryButtonText}>
                {t("statistics.common.retry")}
              </Text>
            </Pressable>
          </View>
        ) : documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {t("documents.list.empty")}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onPress={() => handleItemPress(doc.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <BottomBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  headerSpacer: {
    width: 40,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: BluePalette.backgroundNew,
    borderBottomWidth: 1,
    borderBottomColor: BluePalette.border,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: BluePalette.merge,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: BluePalette.white,
    letterSpacing: -0.3,
  },
  scrollView: {
    flex: 1,
    backgroundColor: BluePalette.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  listContainer: {
    gap: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: BluePalette.textTertiary,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: BluePalette.error,
    fontWeight: "500",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BluePalette.merge,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    color: BluePalette.merge,
    fontWeight: "600",
  },
  itemCard: {
    flexDirection: "column",
    padding: 16,
    borderRadius: 16,
    backgroundColor: BluePalette.backgroundNew,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  itemCardMain: {
    flexDirection: "row",
    gap: 12,
  },
  itemCardPressed: {
    opacity: 0.9,
  },
  itemActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: BluePalette.mergeDark,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  cardActionButtonPressed: {
    opacity: 0.8,
  },
  cardActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  itemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${BluePalette.merge}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  itemDescription: {
    fontSize: 13,
    color: BluePalette.textSecondary,
  },
});

