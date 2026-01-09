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
import { WriteProtectionStatus } from "@/components/write-protection-status";
import { useState, useEffect } from "react";
import type { WriteMode } from "@/lib/nfc-write-protection";
import React from "react";

export default function WriteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getDumpById, updateDumpStatus } = useNFCDumps();
  const { writeTag, isWriting, isSupported, cleanup, writeMode, setWriteMode } =
    useNFCOperations();
  const [status, setStatus] = useState<
    "idle" | "waiting" | "writing" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<WriteMode>("TEST");
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

    // Confirmar modo de escrita
    if (mode === "WRITE") {
      Alert.alert(
        "⚠️ Confirmar Escrita Real",
        "Você está prestes a GRAVAR dados na TAG física. Esta operação é irreversível.\n\nDeseja continuar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Confirmar Escrita",
            style: "destructive",
            onPress: () => performWrite(),
          },
        ]
      );
    } else {
      performWrite();
    }
  };

  const performWrite = async () => {
    try {
      setStatus("waiting");
      setMessage(
        mode === "TEST" ? "Simulando escrita..." : "Aguardando TAG NFC..."
      );

      const result = await writeTag(dump.data, mode);

      if (result.success) {
        setStatus("success");

        if (mode === "TEST") {
          setMessage("Simulação concluída com sucesso!");

          Alert.alert(
            "✅ Simulação Concluída",
            result.message + "\n\nNenhuma TAG foi modificada.",
            [
              {
                text: "Ver Relatório",
                onPress: () => {
                  if (result.writeResult) {
                    const report = result.writeResult.warnings.join("\n");
                    Alert.alert("Relatório de Simulação", report);
                  }
                },
              },
              { text: "OK" },
            ]
          );
        } else {
          setMessage("Escrita concluída e verificada!");
          await updateDumpStatus(dump.id, "success");

          Alert.alert("✅ Escrita Concluída", result.message, [
            {
              text: "Ver Histórico",
              onPress: () => navigateTo("/(tabs)/history"),
            },
            {
              text: "Voltar",
              onPress: () => router.push("/(tabs)"),
            },
          ]);
        }
      } else {
        setStatus("error");
        setMessage(result.message);
        if (mode === "WRITE") {
          await updateDumpStatus(dump.id, "error");
        }
        Alert.alert("❌ Erro", result.message);
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      if (mode === "WRITE") {
        await updateDumpStatus(dump.id, "error");
      }
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
        return mode === "TEST" ? "bg-warning" : "bg-primary";
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
        return mode === "TEST" ? "🧪" : "📱";
    }
  };

  return (
    <ScreenContainer className="p-6">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 gap-6">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-foreground">
              {mode === "TEST" ? "Simular Escrita" : "Escrever na TAG"}
            </Text>
            <Text className="text-base text-muted">{dump.name}</Text>
          </View>

          {/* Dump Info */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <View className="gap-2">
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
            </View>
          </View>

          {/* Protection Status */}
          <WriteProtectionStatus
            hexData={dump.data}
            mode={mode}
            onModeChange={(newMode) => {
              setMode(newMode);
              setWriteMode(newMode);
              setStatus("idle");
            }}
          />

          {/* Status Display */}
          <View
            className={`${getStatusColor()} rounded-xl p-6 items-center gap-3`}
          >
            <Text className="text-4xl">{getStatusIcon()}</Text>
            <Text className="text-white font-semibold text-center text-lg">
              {status === "idle" &&
                (mode === "TEST"
                  ? "Pronto para simular"
                  : "Pronto para escrever")}
              {status === "waiting" &&
                (mode === "TEST" ? "Simulando..." : "Aguardando TAG NFC...")}
              {status === "writing" && "Escrevendo..."}
              {status === "success" &&
                (mode === "TEST" ? "Simulação OK!" : "Sucesso!")}
              {status === "error" && "Erro"}
            </Text>
            {message && (
              <Text className="text-white text-center text-sm opacity-90">
                {message}
              </Text>
            )}
          </View>

          {/* Instructions */}
          <View className="bg-surface rounded-xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {mode === "TEST" ? "Modo Teste:" : "Instruções:"}
            </Text>
            <Text className="text-xs text-muted leading-relaxed">
              {mode === "TEST" ? (
                <>
                  1. Nenhuma TAG será modificada{"\n"}
                  2. Apenas simula a operação de escrita{"\n"}
                  3. Valida o dump antes da escrita real{"\n"}
                  4. Use para testar antes de gravar
                </>
              ) : (
                <>
                  1. Toque em "Iniciar Escrita"{"\n"}
                  2. Aproxime a TAG do topo do dispositivo{"\n"}
                  3. Mantenha a TAG próxima até concluir{"\n"}
                  4. Aguarde a mensagem de sucesso
                </>
              )}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleWrite}
              disabled={isWriting || status === "success"}
              className={`w-full rounded-xl p-4 active:opacity-80 ${
                isWriting || status === "success" ? "opacity-50" : ""
              } ${
                status === "success"
                  ? "bg-success"
                  : mode === "TEST"
                    ? "bg-warning"
                    : "bg-primary"
              }`}
            >
              {isWriting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-center text-lg">
                  {status === "success"
                    ? mode === "TEST"
                      ? "✓ Simulado"
                      : "✓ Escrito"
                    : mode === "TEST"
                      ? "🧪 Iniciar Simulação"
                      : "🔧 Iniciar Escrita"}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              className="w-full bg-surface border border-border rounded-xl p-4 active:opacity-80"
            >
              <Text className="text-foreground font-semibold text-center text-lg">
                Voltar
              </Text>
            </TouchableOpacity>
          </View>

          {/* NFC Support Info */}
          {!isSupported && (
            <View className="bg-error bg-opacity-10 rounded-xl p-4 border border-error">
              <Text className="text-error font-semibold">
                NFC Não Suportado
              </Text>
              <Text className="text-error text-sm mt-1">
                Este dispositivo não suporta operações NFC.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
