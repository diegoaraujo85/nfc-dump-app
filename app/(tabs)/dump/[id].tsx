import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useNFCDumps } from "@/hooks/use-nfc-dumps";
import { useState } from "react";

export default function DumpDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getDumpById, deleteDump, updateDumpStatus } = useNFCDumps();
  const [viewMode, setViewMode] = useState<"hex" | "ascii">("hex");
  const dump = getDumpById(id as string);

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  if (!dump) {
    return (
      <ScreenContainer className="p-6">
        <View className="flex-1 items-center justify-center">
          <Text className="text-lg text-muted">Dump not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-6 bg-primary rounded-xl p-4 px-8"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Dump", "Are you sure you want to delete this dump?", [
      {
        text: "Cancel",
        onPress: () => {},
      },
      {
        text: "Delete",
        onPress: async () => {
          await deleteDump(dump.id);
          router.back();
        },
        style: "destructive",
      },
    ]);
  };

  const handleWrite = () => {
    navigateTo(`/(tabs)/write/${dump.id}`);
  };

  // Format hex string for display (with line breaks every 32 chars)
  const formatHex = (hex: string) => {
    const chunks = hex.match(/.{1,32}/g) || [];
    return chunks.join("\n");
  };

  // Convert hex to ASCII where possible
  const hexToAscii = (hex: string) => {
    let ascii = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code >= 32 && code <= 126) {
        ascii += String.fromCharCode(code);
      } else {
        ascii += ".";
      }
    }
    return ascii;
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Dump Details</Text>
            <Text className="text-base text-muted">{dump.name}</Text>
          </View>

          {/* Dump Info Card */}
          <View className="bg-surface rounded-xl p-4 border border-border gap-3">
            <View>
              <Text className="text-xs text-muted">File Name</Text>
              <Text className="text-lg font-semibold text-foreground">
                {dump.name}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Size</Text>
              <Text className="text-lg font-semibold text-foreground">
                {dump.size} bytes
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted">Created</Text>
              <Text className="text-lg font-semibold text-foreground">
                {new Date(dump.createdAt).toLocaleString()}
              </Text>
            </View>
            {dump.lastWriteStatus && (
              <View>
                <Text className="text-xs text-muted">Last Write Status</Text>
                <View className="flex-row items-center gap-2 mt-1">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      dump.lastWriteStatus === "success"
                        ? "bg-success"
                        : dump.lastWriteStatus === "error"
                          ? "bg-error"
                          : "bg-warning"
                    }`}
                  />
                  <Text className="text-lg font-semibold text-foreground capitalize">
                    {dump.lastWriteStatus}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* View Mode Tabs */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => setViewMode("hex")}
              className={`flex-1 rounded-lg p-3 ${
                viewMode === "hex" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`font-semibold text-center ${
                  viewMode === "hex" ? "text-white" : "text-foreground"
                }`}
              >
                Hex
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode("ascii")}
              className={`flex-1 rounded-lg p-3 ${
                viewMode === "ascii" ? "bg-primary" : "bg-surface border border-border"
              }`}
            >
              <Text
                className={`font-semibold text-center ${
                  viewMode === "ascii" ? "text-white" : "text-foreground"
                }`}
              >
                ASCII
              </Text>
            </TouchableOpacity>
          </View>

          {/* Data Display */}
          <View className="bg-surface rounded-xl p-4 border border-border max-h-48">
            <ScrollView>
              <Text className="font-mono text-xs text-foreground leading-relaxed">
                {viewMode === "hex" ? formatHex(dump.data) : hexToAscii(dump.data)}
              </Text>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleWrite}
              className="w-full bg-success rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-white font-semibold text-center text-lg">
                Write to Tag
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDelete}
              className="w-full bg-error rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-white font-semibold text-center text-lg">
                Delete Dump
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="w-full bg-surface border border-border rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-foreground font-semibold text-center text-lg">
                Back
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
