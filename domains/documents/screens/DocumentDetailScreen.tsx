import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import {
  deleteDocument,
  getDocuments,
} from "@/domains/documents/services/documentsService";
import { useDocumentActions } from "@/domains/documents/hooks/useDocumentActions";
import { Document } from "@/domains/documents/types/document";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function DocumentDetailScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    handleOpen,
    handleShare,
    openLoading,
    shareLoading,
  } = useDocumentActions(document);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await getDocuments();
      const found = all.find((d) => d.id === params.id);
      if (!found) {
        setError(t("documents.details.notFound"));
        setDocument(null);
      } else {
        setDocument(found);
      }
    } catch (err: any) {
      console.error("Error loading document:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("documents.details.loadFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [params.id, t]);

  useFocusEffect(
    useCallback(() => {
      loadDocument();
    }, [loadDocument])
  );

  const confirmDelete = () => {
    if (!document) return;
    Alert.alert(
      t("documents.details.deleteConfirmTitle"),
      t("documents.details.deleteConfirmMessage"),
      [
        {
          text: t("charges.fixed.details.delete"),
          style: "destructive",
          onPress: handleDelete,
        },
        {
          text: t("charges.fixed.form.cancel"),
          style: "cancel",
        },
      ],
    );
  };

  const handleDelete = async () => {
    if (!document) return;
    setDeleting(true);
    try {
      await deleteDocument(document.id);
      router.back();
    } catch (err: any) {
      console.error("Error deleting document:", err);
      let message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("documents.details.deleteFailed");
      if (
        err?.message === "Network Error" ||
        err?.message === "Network request failed" ||
        err?.code === "ERR_NETWORK"
      ) {
        message = t("documents.form.networkError");
      }
      setError(message);
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!document) return;
    router.push(`/documents/edit/${document.id}` as any);
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
          {t("documents.details.title")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={BluePalette.merge} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !document ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {t("documents.details.notFound")}
            </Text>
          </View>
        ) : (
          <>
            {/* File info card - blue background */}
            <View style={styles.fileInfoCard}>
              <View style={styles.iconRow}>
                <View style={styles.iconCircle}>
                  <Feather
                    name="file-text"
                    size={32}
                    color={BluePalette.merge}
                  />
                </View>
              </View>
              <Text style={styles.fileInfoTitle}>{document.name}</Text>
              {document.description && (
                <Text style={styles.fileInfoDescription}>
                  {document.description}
                </Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.openButton,
                pressed && styles.openButtonPressed,
              ]}
              onPress={handleOpen}
              disabled={openLoading}
            >
              {openLoading ? (
                <ActivityIndicator size="small" color={BluePalette.white} />
              ) : (
                <Feather
                  name="external-link"
                  size={18}
                  color={BluePalette.white}
                />
              )}
              <Text style={styles.openButtonText}>
                {openLoading
                  ? t("documents.details.downloading")
                  : t("documents.details.open")}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.shareButton,
                pressed && styles.shareButtonPressed,
              ]}
              onPress={handleShare}
              disabled={shareLoading}
            >
              {shareLoading ? (
                <ActivityIndicator size="small" color={BluePalette.textPrimary} />
              ) : (
                <Feather name="share-2" size={18} color={BluePalette.textPrimary} />
              )}
              <Text style={styles.shareButtonText}>
                {shareLoading
                  ? t("documents.details.downloading")
                  : t("documents.details.share")}
              </Text>
            </Pressable>

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.secondaryButtonPressed,
                ]}
                onPress={handleEdit}
              >
                <Feather
                  name="edit-2"
                  size={18}
                  color={BluePalette.textPrimary}
                />
                <Text style={styles.secondaryButtonText}>
                  {t("documents.details.edit")}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.deleteButtonPressed,
                ]}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={BluePalette.white} />
                ) : (
                  <>
                    <Feather
                      name="trash-2"
                      size={18}
                      color={BluePalette.white}
                    />
                    <Text style={styles.deleteButtonText}>
                      {t("charges.fixed.details.delete")}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: BluePalette.white,
  },
  fileInfoCard: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  fileInfoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BluePalette.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  fileInfoDescription: {
    fontSize: 14,
    color: BluePalette.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: BluePalette.error,
    textAlign: "center",
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${BluePalette.merge}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  openButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
  },
  openButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  openButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: BluePalette.white,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BluePalette.surface,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  shareButtonPressed: {
    opacity: 0.9,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BluePalette.border,
    paddingVertical: 12,
    backgroundColor: BluePalette.primary,
  },
  secondaryButtonPressed: {
    opacity: 0.9,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: BluePalette.white,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: BluePalette.error,
  },
  deleteButtonPressed: {
    opacity: 0.9,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: BluePalette.white,
  },
});

