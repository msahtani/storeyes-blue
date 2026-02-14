import DocumentsScreen from "@/domains/documents/screens/DocumentsScreen";
import { useLocalSearchParams } from "expo-router";

export default function DocumentsByCategoryRoute() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  return <DocumentsScreen categoryId={categoryId} />;
}
