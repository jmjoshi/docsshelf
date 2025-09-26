# Quick Emulator Testing - DocsShelf

## Current Status ✅

- Android emulator (Pixel_9a) is running and showing home screen
- Expo development server is running with QR code displayed

## Next Steps

### Try Direct Launch First

1. In your Expo terminal, **press `a`**
2. This should automatically install and launch your app on the emulator
3. Wait for the app to build and install (may take 1-2 minutes first time)

### If Direct Launch Fails, Use Expo Go

1. **Press `s`** in Expo terminal to switch to Expo Go mode
2. In emulator: Play Store → Search "Expo Go" → Install
3. Open Expo Go → Scan QR code from terminal
4. App loads instantly

### Testing Checklist

Once app loads:

- [ ] App launches without crashes
- [ ] Navigation works (tabs, screens)
- [ ] Camera functionality (document scanning)
- [ ] Document storage and retrieval
- [ ] Text recognition (OCR)
- [ ] Search features
- [ ] Performance is smooth

### Keyboard Shortcuts in Expo Terminal

- `a` - Launch on Android
- `s` - Switch to Expo Go mode
- `r` - Reload app
- `j` - Open debugger
- `m` - Toggle developer menu
- `Ctrl+C` - Stop server

### Troubleshooting

- **App won't launch**: Try Expo Go method instead
- **Slow performance**: Normal on emulator, test on device later
- **Network errors**: Check Windows firewall settings
- **Build errors**: Use tunnel mode with `--tunnel` flag

## Commands for Future Reference

```powershell
# Start emulator
& "$env:ANDROID_HOME\emulator\emulator.exe" -avd Pixel_9a

# Start development server
npx @expo/cli start

# Start with tunnel (if network issues)
npx @expo/cli start --tunnel
```
