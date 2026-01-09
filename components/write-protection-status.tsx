import {
  SAFE_WRITE_CONFIG,
  TEST_MODE_CONFIG,
  createWritePlan,
  type WriteMode,
} from "@/lib/nfc-write-protection";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface WriteProtectionStatusProps {
  hexData: string;
  mode: WriteMode;
  onModeChange: (mode: WriteMode) => void;
}

export function WriteProtectionStatus({
  hexData,
  mode,
  onModeChange,
}: WriteProtectionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  const config = mode === "TEST" ? TEST_MODE_CONFIG : SAFE_WRITE_CONFIG;
  const plan = createWritePlan(hexData, config);

  return (
    <View className="bg-surface rounded-xl p-4 border border-border">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-foreground">
          🛡️ Proteções Ativas
        </Text>
        <View
          className={`px-3 py-1 rounded-lg ${
            mode === "TEST" ? "bg-warning" : "bg-success"
          }`}
        >
          <Text className="text-white text-xs font-semibold">
            {mode === "TEST" ? "🧪 TESTE" : "🔧 ESCRITA"}
          </Text>
        </View>
      </View>

      {/* Protection Checklist */}
      <View className="gap-2 mb-3">
        <ProtectionItem
          icon="✅"
          title="Bloco 0 (UID) Bloqueado"
          description="Nunca será escrito - proteção contra brick"
          enabled={!config.allowBlock0}
        />
        <ProtectionItem
          icon="✅"
          title="Sector Trailers Bloqueados"
          description="Keys e Access Bits protegidos"
          enabled={!config.allowTrailers}
        />
        <ProtectionItem
          icon="✅"
          title="Escrita Seletiva"
          description={`${plan.safeBlocks.length} blocos seguros`}
          enabled={true}
        />
        <ProtectionItem
          icon="✅"
          title="Autenticação Obrigatória"
          description="Validação por setor antes de escrever"
          enabled={config.requireAuthentication}
        />
        <ProtectionItem
          icon="✅"
          title="Validação Byte a Byte"
          description="Leitura e comparação após escrita"
          enabled={mode === "WRITE"}
        />
      </View>

      {/* Statistics */}
      <View className="bg-background rounded-lg p-3 mb-3">
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-muted">Blocos Seguros:</Text>
          <Text className="text-sm font-semibold text-success">
            {plan.safeBlocks.length}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-sm text-muted">Blocos Protegidos:</Text>
          <Text className="text-sm font-semibold text-error">
            {plan.unsafeBlocks.length}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-sm text-muted">Total:</Text>
          <Text className="text-sm font-semibold text-foreground">
            {plan.blocks.length}
          </Text>
        </View>
      </View>

      {/* Mode Toggle */}
      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity
          onPress={() => onModeChange("TEST")}
          className={`flex-1 rounded-lg p-3 ${
            mode === "TEST" ? "bg-warning" : "bg-surface border border-border"
          }`}
        >
          <Text
            className={`font-semibold text-center ${
              mode === "TEST" ? "text-white" : "text-foreground"
            }`}
          >
            🧪 Modo Teste
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              mode === "TEST" ? "text-white" : "text-muted"
            }`}
          >
            Apenas simula
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onModeChange("WRITE")}
          className={`flex-1 rounded-lg p-3 ${
            mode === "WRITE" ? "bg-success" : "bg-surface border border-border"
          }`}
        >
          <Text
            className={`font-semibold text-center ${
              mode === "WRITE" ? "text-white" : "text-foreground"
            }`}
          >
            🔧 Modo Escrita
          </Text>
          <Text
            className={`text-xs text-center mt-1 ${
              mode === "WRITE" ? "text-white" : "text-muted"
            }`}
          >
            Grava + valida
          </Text>
        </TouchableOpacity>
      </View>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <TouchableOpacity
          onPress={() => setShowDetails(!showDetails)}
          className="bg-warning bg-opacity-10 rounded-lg p-3 border border-warning"
        >
          <View className="flex-row justify-between items-center">
            <Text className="text-warning font-semibold text-sm">
              ⚠️ {plan.warnings.length} Avisos
            </Text>
            <Text className="text-warning text-xs">
              {showDetails ? "▼" : "▶"}
            </Text>
          </View>

          {showDetails && (
            <View className="mt-2 gap-1">
              {plan.warnings.map((warning, i) => (
                <Text key={i} className="text-warning text-xs">
                  • {warning}
                </Text>
              ))}
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Errors */}
      {plan.errors.length > 0 && (
        <View className="bg-error bg-opacity-10 rounded-lg p-3 border border-error mt-2">
          <Text className="text-error font-semibold text-sm mb-1">
            ❌ Erros Críticos
          </Text>
          {plan.errors.map((error, i) => (
            <Text key={i} className="text-error text-xs mt-1">
              • {error}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

interface ProtectionItemProps {
  icon: string;
  title: string;
  description: string;
  enabled: boolean;
}

function ProtectionItem({
  icon,
  title,
  description,
  enabled,
}: ProtectionItemProps) {
  return (
    <View className="flex-row items-start gap-2">
      <Text className="text-base">{icon}</Text>
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold ${
            enabled ? "text-foreground" : "text-muted"
          }`}
        >
          {title}
        </Text>
        <Text className="text-xs text-muted">{description}</Text>
      </View>
      <View
        className={`w-2 h-2 rounded-full ${
          enabled ? "bg-success" : "bg-muted"
        }`}
      />
    </View>
  );
}
