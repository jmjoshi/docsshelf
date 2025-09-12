# Windows Setup Script for DocsShelf Testing
# Run this in PowerShell as Administrator

# Function to check if a command exists
function Test-CommandExists {
    param($command)
    $null = Get-Command $command -ErrorAction SilentlyContinue
    return $?
}

Write-Host "=== DocsShelf Development Environment Setup ===" -ForegroundColor Green

# Check Node.js
if (Test-CommandExists "node") {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js is not installed. Please install from https://nodejs.org/" -ForegroundColor Red
}

# Check npm
if (Test-CommandExists "npm") {
    $npmVersion = npm --version
    Write-Host "✓ npm is installed: $npmVersion" -ForegroundColor Green
} else {
    Write-Host "✗ npm is not installed." -ForegroundColor Red
}

# Check Expo CLI
if (Test-CommandExists "expo") {
    Write-Host "✓ Expo CLI is installed" -ForegroundColor Green
} else {
    Write-Host "Installing Expo CLI..." -ForegroundColor Yellow
    npm install -g @expo/cli
}

# Check EAS CLI
if (Test-CommandExists "eas") {
    Write-Host "✓ EAS CLI is installed" -ForegroundColor Green
} else {
    Write-Host "Installing EAS CLI..." -ForegroundColor Yellow
    npm install -g @expo/eas-cli
}

# Check Java (for Android development)
if (Test-CommandExists "java") {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✓ Java is installed: $javaVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Java is not installed. Required for Android development." -ForegroundColor Red
    Write-Host "  Please install JDK 11 or 17 from https://adoptium.net/" -ForegroundColor Yellow
}

# Check Android SDK
$androidHome = $env:ANDROID_HOME
if ($androidHome -and (Test-Path $androidHome)) {
    Write-Host "✓ Android SDK found at: $androidHome" -ForegroundColor Green
} else {
    Write-Host "✗ Android SDK not found or ANDROID_HOME not set" -ForegroundColor Red
    Write-Host "  Please install Android Studio and set ANDROID_HOME" -ForegroundColor Yellow
}

# Check ADB
if (Test-CommandExists "adb") {
    Write-Host "✓ ADB is available" -ForegroundColor Green
} else {
    Write-Host "✗ ADB not found in PATH" -ForegroundColor Red
}

Write-Host "`n=== Project Setup ===" -ForegroundColor Green

# Navigate to project directory
$projectPath = "c:\Users\Jayant\Documents\projects\docsshelf"
if (Test-Path $projectPath) {
    Set-Location $projectPath
    Write-Host "✓ Project directory found" -ForegroundColor Green
    
    # Install dependencies
    Write-Host "Installing project dependencies..." -ForegroundColor Yellow
    npm install
    
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "✗ Project directory not found at: $projectPath" -ForegroundColor Red
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start Android emulator from Android Studio" -ForegroundColor White
Write-Host "2. Run: npm start" -ForegroundColor White
Write-Host "3. Run: npm run android (in another terminal)" -ForegroundColor White
Write-Host "4. For iOS: Use 'expo start --tunnel' and Expo Go app" -ForegroundColor White
