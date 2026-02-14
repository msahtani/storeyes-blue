import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import {
  createDocumentCategory,
  getDocumentCategories,
  updateDocumentCategory,
} from "@/domains/documents/services/documentCategoriesService";
import { DocumentCategory } from "@/domains/documents/types/documentCategory";
import Feather from "@expo/vector-icons/Feather";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function DocumentCategoryFormScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(!!params.id);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = !!params.id;
  const categoryId = params.id;

  useEffect(() => {
    if (!isEdit || !categoryId) return;
    const load = async () => {
      try {
        const list = await getDocumentCategories();
        const cat = list.find((c) => c.id === categoryId);
        if (cat) {
          setName(cat.name);
          setDescription(cat.description ?? "");
        }
      } catch (e) {
        console.error("Error loading category for edit:", e);
      } finally {
        setLoadingEdit(false);
      }
    };
    load();
  }, [isEdit, categoryId]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("documents.categories.nameRequired");
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      if (isEdit && categoryId) {
        await updateDocumentCategory(categoryId, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        await createDocumentCategory({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      }
      router.back();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("documents.categories.saveFailed");
      setErrors((prev) => ({ ...prev, submit: message }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={[styles.container, { backgroundColor: BluePalette.white }]}
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
          {isEdit
            ? t("documents.categories.formTitleEdit")
            : t("documents.categories.formTitleNew")}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loadingEdit ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BluePalette.merge} />
            </View>
          ) : (
            <>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("documents.categories.name")} *
            </Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <Feather
                name="folder"
                size={18}
                color={errors.name ? BluePalette.error : BluePalette.textDark}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (errors.name) setErrors((e) => ({ ...e, name: "" }));
                }}
                placeholder={t("documents.categories.placeholderName")}
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                autoCapitalize="words"
              />
            </View>
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("documents.categories.description")}
            </Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder={t("documents.categories.placeholderDescription")}
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {errors.submit ? (
            <View style={styles.submitErrorContainer}>
              <Text style={styles.errorText}>{errors.submit}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && !submitting && styles.submitButtonPressed,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={BluePalette.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEdit
                  ? t("documents.categories.buttonUpdate")
                  : t("documents.categories.buttonCreate")}
              </Text>
            )}
            </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
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
  headerSpacer: { width: 40 },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: BluePalette.textDark,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BluePalette.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 31, 58, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 4,
    minHeight: 52,
  },
  inputError: {
    borderColor: BluePalette.error,
    backgroundColor: `${BluePalette.error}15`,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: BluePalette.textDark,
  },
  textAreaWrapper: {
    backgroundColor: BluePalette.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(10, 31, 58, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    color: BluePalette.textDark,
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: BluePalette.error,
    marginLeft: 4,
    marginTop: 4,
  },
  submitErrorContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  submitButton: {
    backgroundColor: BluePalette.merge,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: BluePalette.merge,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: BluePalette.white,
    letterSpacing: -0.3,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
