import { useI18n } from "@/constants/i18n/I18nContext";
import { Document } from "@/domains/documents/types/document";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import React, { useCallback, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import * as Sharing from "expo-sharing";

function getMimeType(url: string): string {
  const base = url.split("?")[0];
  const ext = base.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    doc: "application/msword",
    docx:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  return map[ext || ""] || "application/octet-stream";
}

/** iOS UTI (Uniform Type Identifier) for proper file type handling on iOS */
function getUti(url: string): string {
  const base = url.split("?")[0];
  const ext = base.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "public.pdf",
    jpg: "public.jpeg",
    jpeg: "public.jpeg",
    png: "public.png",
    gif: "public.gif",
    doc: "com.microsoft.word.doc",
    docx: "org.openxmlformats.wordprocessingml.document",
    xls: "com.microsoft.excel.xls",
    xlsx: "org.openxmlformats.spreadsheetml.sheet",
  };
  return map[ext || ""] || "public.data";
}

export function useDocumentActions(document: Document | null) {
  const { t } = useI18n();
  const [openLoading, setOpenLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  const downloadToLocal = useCallback(async (): Promise<string | null> => {
    if (!document || !FileSystem.cacheDirectory) return null;
    try {
      const pathname = new URL(document.url).pathname;
      const filename = decodeURIComponent(
        pathname.split("/").pop() || document.name || "document"
      );
      const localUri = `${FileSystem.cacheDirectory}${filename}`;
      const { status } = await FileSystem.downloadAsync(
        document.url,
        localUri
      );
      if (status === 200) return localUri;
    } catch (e) {
      console.error("Failed to download document", e);
    }
    return null;
  }, [document]);

  const handleOpen = useCallback(async () => {
    if (!document) return;
    setOpenLoading(true);
    try {
      const localUri = await downloadToLocal();
      if (!localUri) {
        await Linking.openURL(document.url);
        return;
      }

      if (Platform.OS === "android") {
        try {
          const contentUri = await FileSystem.getContentUriAsync(localUri);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              type: getMimeType(document.url),
              flags: 1,
            }
          );
        } catch {
          await Linking.openURL(document.url);
        }
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(localUri, {
            UTI: getUti(document.url),
            dialogTitle: t("documents.details.open"),
          });
        } else {
          await Linking.openURL(document.url);
        }
      }
    } catch (e) {
      console.error("Failed to open document", e);
      try {
        await Linking.openURL(document.url);
      } catch {
        Alert.alert("", t("documents.details.openFailed"));
      }
    } finally {
      setOpenLoading(false);
    }
  }, [document, downloadToLocal, t]);

  const handleShare = useCallback(async () => {
    if (!document) return;
    setShareLoading(true);
    try {
      const localUri = await downloadToLocal();
      if (!localUri) {
        Alert.alert("", t("documents.details.shareFailed"));
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("", t("documents.details.shareFailed"));
        return;
      }

      const shareOptions: Parameters<typeof Sharing.shareAsync>[1] = {
        mimeType: getMimeType(document.url),
        dialogTitle: t("documents.details.share"),
      };
      if (Platform.OS === "ios") {
        shareOptions.UTI = getUti(document.url);
      }

      await Sharing.shareAsync(localUri, shareOptions);
    } catch (e) {
      console.error("Failed to share document", e);
      Alert.alert("", t("documents.details.shareFailed"));
    } finally {
      setShareLoading(false);
    }
  }, [document, downloadToLocal, t]);

  return { handleOpen, handleShare, openLoading, shareLoading };
}
