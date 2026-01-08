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
import { useNFCOperations } from "@/hooks/use-nfc-operations";
import { useState, useEffect } from "react";

export default function WriteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getDumpById, updateDumpStatus } = useNFCDumps();
  const { writeTag, isWriting, isSupported, cleanup } = useNFCOperations();
  const [status, setStatus] = useState<"idle" | "waiting" | "writing" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const dump = getDumpById(id as string);

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

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

  const handleWrite = async () => {
    if (!isSupported) {
      Alert.alert("Error", "NFC is not supported on this device");
      return;
    }

    try {
      setStatus("waiting");
      setMessage("Waiting for NFC tag...");

      const result = await writeTag(dump.data);

      if (result.success) {
        setStatus("success");
        setMessage("Dump written successfully!");
        await updateDumpStatus(dump.id, "success");

        Alert.alert("Success", "Dump written to tag successfully", [
          {
            text: "View History",
            onPress: () => navigateTo("/(tabs)/history"),
          },
          {
            text: "Back to Home",
            onPress: () => router.push("/(tabs)"),
          },
        ]);
      } else {
        setStatus("error");
        setMessage(result.message);
        await updateDumpStatus(dump.id, "error");
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      await updateDumpStatus(dump.id, "error");
      Alert.alert("Error", "Failed to write dump");
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-success";
      case "error":
        return "bg-error";
      case "waiting":
      case "writing":
        return "bg-warning";
      default:
        return "bg-primary";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "waiting":
      case "writing":
        return "⟳";
      default:
        return "📱";
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Write Dump to Tag</Text>
            <Text className="text-base text-muted">{dump.name}</Text>
          </View>

          {/* Dump Info */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="gap-2">
              <View>
                <Text className="text-xs text-muted">File Name</Text>
                <Text className="text-lg font-semibold text-foreground">{dump.name}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Size</Text>
                <Text className="text-lg font-semibold text-foreground">
                  {dump.size} bytes
                </Text>
              </View>
            </View>
          </View>

          {/* Status Display */}
          <View className={`${getStatusColor()} rounded-xl p-6 items-center gap-3`}>
            <Text className="text-4xl">{getStatusIcon()}</Text>
            <Text className="text-white font-semibold text-center text-lg">
              {status === "idle" && "Ready to write"}
              {status === "waiting" && "Waiting for NFC tag..."}
              {status === "writing" && "Writing..."}
              {status === "success" && "Success!"}
              {status === "error" && "Error"}
            </Text>
            {message && (
              <Text className="text-white text-center text-sm opacity-90">{message}</Text>
            )}
          </View>

          {/* Instructions */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">Instructions:</Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Tap "Start Writing" button{"\n"}
              2. Hold your NFC tag near the top of your device{"\n"}
              3. Keep the tag in place until the write completes{"\n"}
              4. You'll see a success message when done
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleWrite}
              disabled={isWriting || status === "success"}
              className={`w-full rounded-xl p-4 active:opacity-80 ${
                isWriting || status === "success" ? "opacity-50" : ""
              } ${status === "success" ? "bg-success" : "bg-primary"}`}
            >
              {isWriting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-center text-lg">
                  {status === "success" ? "✓ Written" : "Start Writing"}
                </Text>
              )}
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

          {/* NFC Support Info */}
          {!isSupported && (
            <View className="bg-error bg-opacity-10 rounded-xl p-4 border border-error">
              <Text className="text-error font-semibold">NFC Not Supported</Text>
              <Text className="text-error text-sm mt-1">
                This device does not support NFC operations.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
