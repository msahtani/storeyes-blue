import { Text } from "@/components/Themed";
import { BluePalette } from "@/constants/Colors";
import { useI18n } from "@/constants/i18n/I18nContext";
import {
  createDocument,
  getDocuments,
  updateDocument,
} from "@/domains/documents/services/documentsService";
import { Document } from "@/domains/documents/types/document";
import Feather from "@expo/vector-icons/Feather";
import * as DocumentPicker from "expo-document-picker";
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

interface DocumentFormScreenProps {
  mode?: "create" | "edit";
  initialDocument?: Document | null;
}

export default function DocumentFormScreen({
  mode = "create",
  initialDocument,
}: DocumentFormScreenProps) {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState(initialDocument?.name ?? "");
  const [description, setDescription] = useState(
    initialDocument?.description ?? "",
  );
  const [file, setFile] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);
  const [existingFileName, setExistingFileName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdit = mode === "edit" || !!params.id;
  const documentId = params.id ?? initialDocument?.id;

  // Extract filename from S3 URL (e.g. .../storeCode/uuid.pdf -> uuid.pdf)
  const getFileNameFromUrl = (url: string): string => {
    try {
      const path = url.split("?")[0];
      const segments = path.split("/");
      const lastSegment = segments[segments.length - 1];
      return decodeURIComponent(lastSegment || "document");
    } catch {
      return "document";
    }
  };

  // Load document data when in edit mode to pre-fill the form
  useEffect(() => {
    const loadDocument = async () => {
      if (!isEdit || !documentId) return;
      try {
        const all = await getDocuments();
        const doc = all.find((d) => d.id === documentId);
        if (doc) {
          setName(doc.name);
          setDescription(doc.description ?? "");
          setExistingFileName(doc.url ? getFileNameFromUrl(doc.url) : null);
        }
      } catch (e) {
        console.error("Error loading document for edit:", e);
      }
    };
    loadDocument();
  }, [isEdit, documentId]);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFile({
          uri: asset.uri,
          name: asset.name,
          type: asset.mimeType || "application/octet-stream",
        });
        if (errors.file) {
          setErrors((prev) => ({ ...prev, file: "" }));
        }
      }
    } catch (e) {
      console.error("Error picking document:", e);
    }
  };

  const updateField = (field: string, value: string) => {
    if (field === "name") setName(value);
    if (field === "description") setDescription(value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("documents.form.nameRequired");
    }

    if (!isEdit && !file) {
      newErrors.file = t("documents.form.fileRequired");
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      if (isEdit && documentId) {
        await updateDocument(documentId, {
          name: name.trim(),
          description: description.trim(),
          file: file || undefined,
        });
      } else if (file) {
        await createDocument({
          name: name.trim(),
          description: description.trim() || undefined,
          file,
        });
      }

      router.back();
    } catch (err: any) {
      console.error("Error saving document:", {
        error: err,
        response: err?.response?.data,
        status: err?.response?.status,
      });
      let message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("documents.form.saveFailed");
      if (err?.message === "Network Error" || err?.code === "ERR_NETWORK") {
        message = t("documents.form.networkError");
      }
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
          {isEdit
            ? t("documents.form.titleEdit")
            : t("documents.form.titleNew")}
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
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("documents.form.name")} *
            </Text>
            <View style={[styles.inputWrapper, errors.name && styles.inputError]}>
              <Feather
                name="file-text"
                size={18}
                color={errors.name ? BluePalette.error : BluePalette.textDark}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(value) => updateField("name", value)}
                placeholder={t("documents.form.placeholderName")}
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("documents.form.description")}
            </Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={(value) => updateField("description", value)}
                placeholder={t("documents.form.placeholderDescription")}
                placeholderTextColor="rgba(10, 31, 58, 0.5)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* File Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t("documents.form.file")}
              {!isEdit && " *"}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.addFileButton,
                errors.file && styles.inputError,
                pressed && styles.addFileButtonPressed,
              ]}
              onPress={handlePickFile}
            >
              <Feather
                name="paperclip"
                size={24}
                color={BluePalette.merge}
              />
              <Text style={styles.addFileText}>
                {file
                  ? file.name
                  : existingFileName
                    ? existingFileName
                    : t("documents.form.pickFile")}
              </Text>
              <Text style={styles.addFileSubtext}>
                {file
                  ? t("documents.form.changeFile")
                  : existingFileName
                    ? t("documents.form.currentFile")
                    : t("documents.form.pickFileSubtext")}
              </Text>
            </Pressable>
            {errors.file && <Text style={styles.errorText}>{errors.file}</Text>}
          </View>

          {errors.submit && (
            <View style={styles.submitErrorContainer}>
              <Text style={styles.errorText}>{errors.submit}</Text>
            </View>
          )}

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
                  ? t("documents.form.buttonUpdate")
                  : t("documents.form.buttonCreate")}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: BluePalette.textDark,
    paddingVertical: 12,
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
  addFileButton: {
    backgroundColor: BluePalette.backgroundNew,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BluePalette.border,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  addFileButtonPressed: {
    opacity: 0.8,
  },
  addFileText: {
    fontSize: 16,
    fontWeight: "600",
    color: BluePalette.merge,
    textAlign: "center",
  },
  addFileSubtext: {
    fontSize: 13,
    color: BluePalette.textTertiary,
    fontWeight: "500",
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
});
