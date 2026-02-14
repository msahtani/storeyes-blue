import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import BottomBar from "@/domains/shared/components/BottomBar";
import {
  deleteDocumentCategory,
  getDocumentCategories,
} from "@/domains/documents/services/documentCategoriesService";
import { DocumentCategory } from "@/domains/documents/types/documentCategory";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

function CategoryCard({
  category,
  onPress,
  onEdit,
  onDelete,
}: {
  category: DocumentCategory;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  return (
    <View style={styles.card}>
      <Pressable
        style={({ pressed }) => [
          styles.cardMain,
          pressed && styles.cardMainPressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.iconWrap}>
          <Feather name="folder" size={32} color={BluePalette.merge} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {category.name}
          </Text>
          {category.description ? (
            <Text style={styles.cardDescription} numberOfLines={2}>
              {category.description}
            </Text>
          ) : null}
        </View>
        <Feather
          name="chevron-right"
          size={22}
          color={BluePalette.textTertiary}
          style={styles.chevron}
        />
      </Pressable>
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={onEdit}
        >
          <Feather name="edit-2" size={18} color={BluePalette.merge} />
          <Text style={styles.actionBtnText}>{t("documents.categories.edit")}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnDanger,
            pressed && styles.actionBtnPressed,
          ]}
          onPress={onDelete}
        >
          <Feather name="trash-2" size={18} color={BluePalette.error} />
          <Text style={[styles.actionBtnText, styles.actionBtnTextDanger]}>
            {t("documents.categories.delete")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DocumentCategoriesScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomBarHeight = 15;
  const bottomBarTotalHeight = bottomBarHeight + insets.bottom;

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocumentCategories();
      setCategories(data);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("documents.categories.loadFailed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [fetchCategories])
  );

  const handleCreateCategory = () => {
    router.push("/documents/categories/create" as any);
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/documents/category/${categoryId}` as any);
  };

  const handleEdit = (categoryId: string) => {
    router.push(`/documents/categories/edit/${categoryId}` as any);
  };

  const handleDelete = (category: DocumentCategory) => {
    Alert.alert(
      t("documents.categories.deleteConfirmTitle"),
      t("documents.categories.deleteConfirmMessage"),
      [
        { text: t("documents.categories.cancel"), style: "cancel" },
        {
          text: t("documents.categories.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocumentCategory(category.id);
              setCategories((prev) => prev.filter((c) => c.id !== category.id));
            } catch (err: any) {
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                t("documents.categories.deleteFailed");
              Alert.alert(t("documents.categories.error"), msg);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, { backgroundColor: BluePalette.backgroundNew }]}
    >
      <View style={[styles.header, { paddingTop: insets.top + 5 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather
            name="arrow-left"
            size={24}
            color={BluePalette.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>
          {t("documents.categories.screenTitle")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.createSection}>
        <Pressable
          style={({ pressed }) => [
            styles.createButton,
            pressed && styles.createButtonPressed,
          ]}
          onPress={handleCreateCategory}
        >
          <Feather name="plus" size={20} color={BluePalette.white} />
          <Text style={styles.createButtonText}>
            {t("documents.categories.newCategory")}
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
              onPress={fetchCategories}
            >
              <Text style={styles.retryButtonText}>
                {t("statistics.common.retry")}
              </Text>
            </Pressable>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <Feather name="folder" size={48} color={BluePalette.textTertiary} />
            </View>
            <Text style={styles.emptyText}>
              {t("documents.categories.empty")}
            </Text>
            <Text style={styles.emptySubtext}>
              {t("documents.categories.emptyHint")}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onPress={() => handleCategoryPress(cat.id)}
                onEdit={() => handleEdit(cat.id)}
                onDelete={() => handleDelete(cat)}
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
  createSection: {
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
    shadowOffset: { width: 0, height: 2 },
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
    paddingTop: 16,
  },
  listContainer: {
    gap: 14,
  },
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BluePalette.backgroundNew,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: "600",
    color: BluePalette.textDark,
    textAlign: "center",
  },      
  emptySubtext: {
    fontSize: 14,
    color: BluePalette.textDark,
    textAlign: "center",
    paddingHorizontal: 24,
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
  card: {
    borderRadius: 16,
    backgroundColor: BluePalette.backgroundNew,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  cardMainPressed: {
    opacity: 0.9,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: `${BluePalette.merge}18`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BluePalette.textPrimary,
  },
  cardDescription: {
    fontSize: 13,
    color: BluePalette.textSecondary,
    marginTop: 4,
  },
  chevron: {
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: BluePalette.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: BluePalette.surface,
    borderWidth: 1,
    borderColor: BluePalette.border,
  },
  actionBtnPressed: {
    opacity: 0.8,
  },
  actionBtnDanger: {
    backgroundColor: `${BluePalette.error}12`,
    borderColor: `${BluePalette.error}30`,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: BluePalette.textPrimary,
  },
  actionBtnTextDanger: {
    color: BluePalette.error,
  },
});
