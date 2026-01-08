import { checkCardCompatibility, testCard } from "@/hooks/use-nfc-operations";
import { analyzeDump } from "@/utils/analyzeDump";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { checkDumpCompatibility } from "@/utils/checkDumpCompatibility";


export default function ImportScreen() {

  const [fileName, setFileName] = useState<string | null>(null);
  const [dumpHex, setDumpHex] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [dumpCompatibility, setDumpCompatibility] = useState<any>(null);
  const [cardCompatibility, setCardCompatibility] = useState<any>(null);


  useEffect(() => {
    if (!dumpHex) {
      setAnalysis(null);
      setTestResult(null);
      setFileName(null); 
      return;
    }

    const result = analyzeDump(dumpHex);    
    setAnalysis(result);
  }, [dumpHex]);

  useEffect(() => {
    if (!dumpHex) return;

    setDumpCompatibility(checkDumpCompatibility(dumpHex));
  }, [dumpHex]);



  // Simulação: dumpHex já foi carregado
  // setDumpHex(hex)

  const runTest = async () => {
    if (testing) return; // 🔒 bloqueia duplo clique

    setTesting(true);
    try {
      const result = await testCard(analysis.totalBlocks);
      setTestResult(result);
    } catch (err) {
      console.error("Erro no teste NFC:", err);
    } finally {
      setTesting(false);
    }
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const file = result.assets[0];
    setFileName(file.name);

    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const hex = base64
      .split("")
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    setDumpHex(hex); // 🔥 ÚNICO ponto que dispara a análise
  };

  const canWrite =
  dumpCompatibility?.ok &&
  cardCompatibility?.ok &&
  testResult &&
  !testResult.testedBlocks.some((b: any) => b.status === "ERROR");

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity
        onPress={async () => {
          const result = await checkCardCompatibility(
            dumpCompatibility.totalBlocks
          );
          setCardCompatibility(result);
        }}
        style={{
          marginTop: 16,
          padding: 14,
          backgroundColor: "#0ea5e9",
        }}
      >
        <Text style={{ color: "#fff", textAlign: "center" }}>
          🔍 VERIFICAR COMPATIBILIDADE DO CARTÃO
        </Text>
      </TouchableOpacity>

      {cardCompatibility && (
        <View style={{ marginTop: 16, padding: 12, borderWidth: 1 }}>
          <Text style={{ fontWeight: "bold" }}>📋 Compatibilidade</Text>

          {cardCompatibility.ok ? (
            <Text style={{ color: "green", marginTop: 8 }}>
              ✅ Cartão compatível ({cardCompatibility.authenticatedSectors} setores autenticáveis)
            </Text>
          ) : (
            <Text style={{ color: "red", marginTop: 8 }}>
              ❌ Cartão incompatível: {cardCompatibility.reason}
            </Text>
          )}
        </View>
      )}


      {!dumpHex && (
        <View style={{ marginTop: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
            📥 Importar Dump NFC
          </Text>

          <Text style={{ marginTop: 8, color: "#6b7280" }}>
            Nenhum dump carregado ainda.
          </Text>

          <TouchableOpacity
            onPress={handleImport}
            style={{
              marginTop: 16,
              padding: 14,
              backgroundColor: "#2563eb",
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              📂 IMPORTAR DUMP
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {fileName && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: "bold" }}>📄 Arquivo carregado</Text>
          <Text style={{ color: "#374151" }}>{fileName}</Text>
        </View>
      )}


      {/* ANÁLISE OFFLINE */}
      {analysis && (
        <View style={{ marginTop: 16, padding: 12, borderWidth: 1 }}>
          <Text style={{ fontWeight: "bold" }}>📊 Análise do Dump</Text>
          <Text>Blocos totais: {analysis.totalBlocks}</Text>
          <Text>Blocos seguros: {analysis.safeBlocks}</Text>
          <Text>Blocos protegidos: {analysis.unsafeBlocks}</Text>

          <Text style={{ marginTop: 8, color: "#b45309" }}>
            ⚠️ Bloco 0 e Sector Trailers NÃO serão gravados
          </Text>
        </View>
      )}

      {/* BOTÃO TESTE */}
      {analysis && (
        <TouchableOpacity
          onPress={runTest}
          disabled={testing}
          style={{
            marginTop: 16,
            padding: 14,
            backgroundColor: testing ? "#9ca3af" : "#2563eb",
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            {testing ? "⏳ Aproximar o cartão..." : "🧪 TESTAR CARTÃO (sem gravação)"}
          </Text>
        </TouchableOpacity>
      )}

      {/* RESULTADO DO TESTE */}
      {testResult && (
        <View style={{ marginTop: 16, padding: 12, borderWidth: 1 }}>
          <Text style={{ fontWeight: "bold" }}>
            🔐 Resultado do Teste
          </Text>

          <Text style={{ marginTop: 8 }}>
            Setores OK:{" "}
            {testResult.sectors.filter(Boolean).length}
          </Text>
          <Text>
            Setores com erro:{" "}
            {testResult.sectors.filter((s: boolean) => !s).length}
          </Text>

          <Text style={{ marginTop: 8 }}>
            Blocos OK:{" "}
            {
              testResult.testedBlocks.filter(
                (b: any) => b.status === "OK"
              ).length
            }
          </Text>
          <Text>
            Blocos pulados:{" "}
            {
              testResult.testedBlocks.filter(
                (b: any) => b.status === "SKIPPED"
              ).length
            }
          </Text>
          <Text>
            Blocos com erro:{" "}
            {
              testResult.testedBlocks.filter(
                (b: any) => b.status === "ERROR"
              ).length
            }
          </Text>

          <Text style={{ marginTop: 12, fontWeight: "bold" }}>
            {testResult.testedBlocks.some(
              (b: any) => b.status === "ERROR"
            )
              ? "❌ NÃO É SEGURO GRAVAR AINDA"
              : "✅ CARTÃO COMPATÍVEL – pode gravar"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
