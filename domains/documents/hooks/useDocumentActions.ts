import { useI18n } from "@/constants/i18n/I18nContext";
import { Document } from "@/domains/documents/types/document";
import * as FileSystem from "expo-file-system/legacy";
import React, { useCallback, useState } from "react";
import { Alert, Linking } from "react-native";
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
      const canShare = await Sharing.isAvailableAsync();
      if (localUri && canShare) {
        await Sharing.shareAsync(localUri, {
          mimeType: getMimeType(document.url),
          dialogTitle: t("documents.details.open"),
        });
      } else {
        await Linking.openURL(document.url);
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
      if (localUri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(localUri, {
          mimeType: getMimeType(document.url),
          dialogTitle: t("documents.details.share"),
        });
      } else if (localUri) {
        await Sharing.shareAsync(localUri, {
          mimeType: getMimeType(document.url),
          dialogTitle: t("documents.details.share"),
        });
      } else {
        Alert.alert("", t("documents.details.shareFailed"));
      }
    } catch (e) {
      console.error("Failed to share document", e);
      Alert.alert("", t("documents.details.shareFailed"));
    } finally {
      setShareLoading(false);
    }
  }, [document, downloadToLocal, t]);

  return { handleOpen, handleShare, openLoading, shareLoading };
}
