import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useNFCDumps } from "@/hooks/use-nfc-dumps";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function ImportScreen() {
  const router = useRouter();
  const { saveDump } = useNFCDumps();
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          name: asset.name,
          size: asset.size || 0,
          uri: asset.uri,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick file");
      console.error(error);
    }
  };

  const importDump = async () => {
    if (!selectedFile) {
      Alert.alert("Error", "No file selected");
      return;
    }

    try {
      setLoading(true);

      // Read file as base64
      const content = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: "base64",
      });

      // Convert base64 to hex
      const buffer = Buffer.from(content, "base64");
      const hexData = buffer.toString("hex").toUpperCase();

      // Save dump
      const dump = await saveDump(selectedFile.name, hexData);

      if (dump) {
        Alert.alert("Success", "Dump imported successfully", [
          {
            text: "View Details",
            onPress: () => navigateTo(`/(tabs)/dump/${dump.id}`),
          },
          {
            text: "Back to Home",
            onPress: () => navigateTo("/(tabs)"),
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to save dump");
      }
    } catch (error) {
      Alert.alert(
        "Error",
        `Failed to import dump: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">
              Import Dump
            </Text>
            <Text className="text-base text-muted text-center">
              Select a binary dump file to import
            </Text>
          </View>

          {/* File Picker Section */}
          <View className="gap-4">
            <TouchableOpacity
              onPress={pickFile}
              disabled={loading}
              className={cn(
                "w-full bg-primary rounded-xl p-6 active:opacity-80",
                loading && "opacity-50"
              )}
            >
              <Text className="text-white font-semibold text-center text-lg">
                {loading ? "Processing..." : "Select File"}
              </Text>
            </TouchableOpacity>

            {/* Selected File Info */}
            {selectedFile && (
              <View className="bg-surface rounded-xl p-4 border border-border">
                <Text className="text-sm text-muted mb-2">Selected File</Text>
                <Text className="text-lg font-semibold text-foreground mb-1">
                  {selectedFile.name}
                </Text>
                <Text className="text-sm text-muted">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              </View>
            )}
          </View>

          {/* Import Button */}
          {selectedFile && (
            <TouchableOpacity
              onPress={importDump}
              disabled={loading}
              className={cn(
                "w-full bg-success rounded-xl p-4 active:opacity-80",
                loading && "opacity-50"
              )}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-center text-lg">
                  Import Dump
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Info Section */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Supported Formats:
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              • Binary files (.bin){"\n"}
              • Hex files (.hex){"\n"}
              • Raw data files{"\n"}
              • Any binary format
            </Text>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            onPress={() => navigateTo("/(tabs)")}
            disabled={loading}
            className={cn(
              "w-full bg-surface border border-border rounded-xl p-4 active:opacity-80",
              loading && "opacity-50"
            )}
          >
            <Text className="text-foreground font-semibold text-center text-lg">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
