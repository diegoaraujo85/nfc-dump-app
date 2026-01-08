import { ScrollView, Text, View, TouchableOpacity, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useNFCDumps } from "@/hooks/use-nfc-dumps";

export default function HistoryScreen() {
  const router = useRouter();
  const { dumps, deleteDump } = useNFCDumps();

  const handleDelete = (id: string) => {
    deleteDump(id);
  };

  const navigateTo = (path: string) => {
    router.push(path as any);
  };

  const renderDumpItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => navigateTo(`/(tabs)/dump/${item.id}`)}
      className="bg-surface rounded-xl p-4 border border-border mb-3 active:opacity-80"
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-semibold text-foreground">
            {item.name}
          </Text>
          <Text className="text-sm text-muted">
            {item.size} bytes • {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.lastWriteStatus && (
          <View
            className={`px-2 py-1 rounded ${
              item.lastWriteStatus === "success"
                ? "bg-success"
                : item.lastWriteStatus === "error"
                  ? "bg-error"
                  : "bg-warning"
            }`}
          >
            <Text className="text-xs text-white capitalize">
              {item.lastWriteStatus}
            </Text>
          </View>
        )}
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => navigateTo(`/(tabs)/dump/${item.id}`)}
          className="flex-1 bg-primary rounded-lg p-2 active:opacity-80"
        >
          <Text className="text-white font-semibold text-center text-sm">
            View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          className="flex-1 bg-error rounded-lg p-2 active:opacity-80"
        >
          <Text className="text-white font-semibold text-center text-sm">
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1">
        {/* Header */}
        <View className="items-center gap-2 mb-6">
          <Text className="text-3xl font-bold text-foreground">History</Text>
          <Text className="text-base text-muted">
            {dumps.length} dump{dumps.length !== 1 ? "s" : ""} saved
          </Text>
        </View>

        {/* Dumps List */}
        {dumps.length > 0 ? (
          <FlatList
            data={[...dumps].reverse()}
            renderItem={renderDumpItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-lg text-muted text-center">
              No dumps yet. Import your first dump to get started!
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="gap-3 mt-6">
        <TouchableOpacity
          onPress={() => navigateTo("/import")}
          className="w-full bg-primary rounded-xl p-4 active:opacity-80"
        >
          <Text className="text-white font-semibold text-center text-lg">
            + Import New Dump
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
    </ScreenContainer>
  );
}
