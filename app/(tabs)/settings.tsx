import { ScrollView, Text, View, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useNFCDumps } from "@/hooks/use-nfc-dumps";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SettingsScreen() {
  const router = useRouter();
  const { clearAllDumps, dumps } = useNFCDumps();
  const [darkMode, setDarkMode] = useState(false);
  const [emulationMode, setEmulationMode] = useState(false);

  const handleClearHistory = async () => {
    await clearAllDumps();
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">Settings</Text>
            <Text className="text-base text-muted">Customize your experience</Text>
          </View>

          {/* Display Settings */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Display</Text>
            <View className="bg-surface rounded-xl p-4 border border-border flex-row justify-between items-center">
              <Text className="text-foreground">Dark Mode</Text>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: "#E5E7EB", true: "#0066CC" }}
                thumbColor={darkMode ? "#00A86B" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* NFC Settings */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">NFC Options</Text>
            <View className="bg-surface rounded-xl p-4 border border-border flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-foreground font-semibold">Emulation Mode</Text>
                <Text className="text-xs text-muted mt-1">
                  Emulate tags instead of writing
                </Text>
              </View>
              <Switch
                value={emulationMode}
                onValueChange={setEmulationMode}
                trackColor={{ false: "#E5E7EB", true: "#0066CC" }}
                thumbColor={emulationMode ? "#00A86B" : "#f4f3f4"}
              />
            </View>
          </View>

          {/* Data Management */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Data Management</Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <Text className="text-foreground mb-2">
                Total Dumps: <Text className="font-semibold">{dumps.length}</Text>
              </Text>
              <TouchableOpacity
                onPress={handleClearHistory}
                className="bg-error rounded-lg p-3 mt-3 active:opacity-80"
              >
                <Text className="text-white font-semibold text-center">
                  Clear All Dumps
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* About */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">About</Text>
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="gap-3">
                <View>
                  <Text className="text-xs text-muted">App Name</Text>
                  <Text className="text-foreground font-semibold">
                    NFC Dump & Apply
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-muted">Version</Text>
                  <Text className="text-foreground font-semibold">1.0.0</Text>
                </View>
                <View>
                  <Text className="text-xs text-muted">Description</Text>
                  <Text className="text-sm text-foreground leading-relaxed">
                    Read and write NFC tag dumps with ease. Import binary dumps
                    and apply them to physical NFC tags.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full bg-surface border border-border rounded-xl p-4 active:opacity-80 mt-6"
          >
            <Text className="text-foreground font-semibold text-center text-lg">
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
