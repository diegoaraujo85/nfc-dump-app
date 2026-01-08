import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useNFCDumps } from "@/hooks/use-nfc-dumps";

export default function HomeScreen() {
  const router = useRouter();
  const { getLastDump, dumps } = useNFCDumps();
  const lastDump = getLastDump();

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-8">
          {/* Hero Section */}
          <View className="items-center gap-2 mt-4">
            <Text className="text-4xl font-bold text-foreground">
              NFC Dump & Apply
            </Text>
            <Text className="text-base text-muted text-center">
              Read and write NFC tag dumps with ease
            </Text>
          </View>

          {/* Last Dump Card */}
          {lastDump && (
            <View className="w-full bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-sm text-muted mb-2">Last Dump</Text>
              <Text className="text-lg font-semibold text-foreground mb-1">
                {lastDump.name}
              </Text>
              <Text className="text-sm text-muted mb-3">
                {lastDump.size} bytes • {new Date(lastDump.createdAt).toLocaleDateString()}
              </Text>
              {lastDump.lastWriteStatus && (
                <View className="flex-row items-center gap-2">
                  <View
                    className={`w-2 h-2 rounded-full ${
                      lastDump.lastWriteStatus === "success"
                        ? "bg-success"
                        : lastDump.lastWriteStatus === "error"
                          ? "bg-error"
                          : "bg-warning"
                    }`}
                  />
                  <Text className="text-xs text-muted capitalize">
                    {lastDump.lastWriteStatus}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Main Actions */}
          <View className="gap-3">
            {/* Import Dump Button */}
            <TouchableOpacity
              onPress={() => navigateTo("/import")}
              className="w-full bg-primary rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-white font-semibold text-center text-lg">
                + Import Dump
              </Text>
            </TouchableOpacity>

            {/* Write to Tag Button */}
            {lastDump && (
              <TouchableOpacity
                onPress={() => navigateTo(`/(tabs)/write/${lastDump.id}`)}
                className="w-full bg-success rounded-xl p-4 active:opacity-80"
              >
                <Text className="text-white font-semibold text-center text-lg">
                  Write Last Dump to Tag
                </Text>
              </TouchableOpacity>
            )}

            {/* History Button */}
            <TouchableOpacity
              onPress={() => navigateTo("/(tabs)/history")}
              className="w-full bg-surface border border-border rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-foreground font-semibold text-center text-lg">
                History ({dumps.length})
              </Text>
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity
              onPress={() => navigateTo("/(tabs)/settings")}
              className="w-full bg-surface border border-border rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-foreground font-semibold text-center text-lg">
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              How to use:
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              1. Import a binary dump file{"\n"}
              2. Review the dump details{"\n"}
              3. Hold your NFC tag near the device{"\n"}
              4. Write the dump to the tag
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
