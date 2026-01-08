# NFC Dump & Apply - Design Document

## Overview
Aplicativo móvel para leitura de dumps binários brutos de TAGs NFC e emulação/escrita desse conteúdo usando o NFC do celular. O app permite importar arquivos de dump, visualizar seu conteúdo e aplicar em TAGs físicas.

## Screen List

1. **Home Screen** - Tela principal com opções de ação
2. **Import Dump Screen** - Importar arquivo de dump binário
3. **Dump Detail Screen** - Visualizar conteúdo do dump (hex, informações)
4. **Write/Emulate Screen** - Tela para escrever/emular o dump em uma TAG
5. **History Screen** - Histórico de dumps importados e operações realizadas
6. **Settings Screen** - Configurações do app

## Primary Content and Functionality

### Home Screen
- **Content**: Botões de ação principais (Importar Dump, Ver Histórico, Configurações)
- **Functionality**: 
  - Navegação para outras telas
  - Exibição de último dump importado (se existir)
  - Quick action para escrever/emular o último dump

### Import Dump Screen
- **Content**: 
  - Seletor de arquivo (file picker)
  - Preview do arquivo selecionado (tamanho, nome)
  - Validação do arquivo
- **Functionality**:
  - Importar arquivo binário (.bin, .hex, etc)
  - Validar formato do arquivo
  - Salvar dump localmente
  - Navegar para Dump Detail

### Dump Detail Screen
- **Content**:
  - Nome do arquivo
  - Tamanho em bytes
  - Visualização em hexadecimal (com scroll)
  - Visualização em ASCII (onde aplicável)
  - Informações técnicas (se detectadas - tipo de TAG, NDEF records, etc)
  - Botão "Write to TAG"
- **Functionality**:
  - Exibir dump em diferentes formatos (hex, ASCII)
  - Copiar conteúdo
  - Deletar dump
  - Iniciar processo de escrita

### Write/Emulate Screen
- **Content**:
  - Status da conexão NFC
  - Instruções para o usuário ("Aproxime a TAG do celular")
  - Indicador visual de progresso
  - Log de operação
- **Functionality**:
  - Ativar NFC reader
  - Detectar TAG próxima
  - Escrever dump na TAG
  - Emular TAG (se suportado)
  - Exibir resultado (sucesso/erro)

### History Screen
- **Content**:
  - Lista de dumps importados
  - Data/hora de importação
  - Tamanho do arquivo
  - Status da última operação (escrito com sucesso, erro, etc)
- **Functionality**:
  - Listar todos os dumps salvos
  - Abrir dump detail ao tocar
  - Deletar dump
  - Compartilhar dump (opcional)

### Settings Screen
- **Content**:
  - Toggle para modo de emulação vs escrita
  - Seleção de tipo de TAG (ISO14443-A, ISO14443-B, etc)
  - Preferências de UI (tema claro/escuro)
  - Sobre o app
- **Functionality**:
  - Alterar preferências
  - Limpar histórico
  - Exibir informações do app

## Key User Flows

### Flow 1: Import and Write Dump
1. User taps "Import Dump" on Home
2. File picker opens → User selects .bin file
3. App validates and saves dump
4. Dump Detail screen shows hex/ASCII preview
5. User taps "Write to TAG"
6. Write/Emulate screen shows "Aproxime a TAG"
7. User holds TAG near device
8. App detects TAG → Writes dump → Shows success/error
9. User can return to Home or try another TAG

### Flow 2: View History and Re-use Dump
1. User taps "History" on Home
2. List of previous dumps appears
3. User taps a dump → Dump Detail screen
4. User taps "Write to TAG" → Write/Emulate screen
5. Same as Flow 1 from step 6 onwards

### Flow 3: Settings and Preferences
1. User taps "Settings" on Home
2. Settings screen shows options
3. User toggles emulation mode or selects TAG type
4. Changes saved automatically
5. User returns to Home

## Color Choices

- **Primary**: `#0066CC` (Blue - professional, tech-focused)
- **Secondary**: `#00A86B` (Green - success, write operations)
- **Background**: `#FFFFFF` (Light) / `#1A1A1A` (Dark)
- **Surface**: `#F5F5F5` (Light) / `#2D2D2D` (Dark)
- **Text**: `#000000` (Light) / `#FFFFFF` (Dark)
- **Error**: `#FF3B30` (Red - write failures)
- **Warning**: `#FF9500` (Orange - NFC not available)
- **Success**: `#00A86B` (Green - write success)

## Technical Notes

- **NFC Library**: `expo-nfc` (if available) or `react-native-nfc-manager` for NFC operations
- **File Handling**: `expo-document-picker` for file selection, `expo-file-system` for file operations
- **Storage**: `AsyncStorage` for persisting dump history locally
- **Platform Support**: iOS (requires iOS 13.1+) and Android (API 21+)
- **Permissions**: NFC read/write permissions, file access permissions

## Design Principles

- **Mobile-First**: Portrait orientation, one-handed usage
- **iOS-Like**: Follow Apple HIG guidelines
- **Clear Feedback**: Visual and haptic feedback for NFC operations
- **Error Handling**: Clear error messages and recovery options
- **Accessibility**: Large touch targets, readable text sizes
