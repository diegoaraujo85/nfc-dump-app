# NFC Dump & Apply - Project TODO

## Core Features

- [x] Setup NFC library (react-native-nfc-manager)
- [x] Setup file picker (expo-document-picker)
- [x] Setup file system operations (expo-file-system)
- [x] Setup AsyncStorage for persistence
- [x] Create NFC operations hook (use-nfc-operations.ts)
- [x] Create dumps management hook (use-nfc-dumps.ts)

## Home Screen

- [x] Create Home screen layout
- [x] Add "Import Dump" button
- [x] Add "History" button
- [x] Add "Settings" button
- [x] Display last imported dump (if exists)
- [x] Quick action to write last dump

## Import Dump Screen

- [x] Create Import screen layout
- [x] Implement file picker integration
- [x] Add file validation (binary format)
- [x] Display file preview (name, size)
- [x] Save dump to AsyncStorage
- [x] Navigate to Dump Detail on success

## Dump Detail Screen

- [x] Create Dump Detail screen layout
- [x] Display dump name and size
- [x] Implement hex viewer
- [x] Implement ASCII viewer
- [x] Add tab switcher between hex/ASCII
- [x] Add "Write to TAG" button
- [x] Add "Delete Dump" button
- [x] Add "Copy" functionality
- [ ] Detect and display TAG type info (if possible)

## Write/Emulate Screen

- [x] Create Write/Emulate screen layout
- [x] Implement NFC reader initialization
- [x] Add "Aproxime a TAG" instructions
- [x] Add visual progress indicator
- [x] Implement TAG detection
- [x] Implement dump writing logic
- [x] Add operation log display
- [x] Handle write success/error states
- [ ] Add haptic feedback for operations

## History Screen

- [x] Create History screen layout
- [x] Implement dump list from AsyncStorage
- [x] Display dump info (name, size, date, status)
- [x] Add tap-to-open functionality
- [x] Add delete functionality
- [ ] Add search/filter (optional)

## Settings Screen

- [x] Create Settings screen layout
- [x] Add emulation mode toggle
- [x] Add theme toggle (light/dark)
- [x] Add "Clear History" option
- [x] Add "About" section
- [ ] Add TAG type selector

## UI/UX Polish

- [x] Generate custom app icon
- [x] Update app.config.ts with branding
- [x] Implement color scheme from design.md
- [x] Add loading states
- [x] Add error handling and user feedback
- [ ] Test on iOS and Android
- [ ] Implement haptic feedback
- [ ] Add animations (optional)

## Testing & Documentation

- [ ] Write unit tests for core functions
- [ ] Test NFC read/write operations
- [ ] Test file import flow with EyeBrawl.dump
- [ ] Create user documentation
- [ ] Test on real devices
