# Qwen Mobile Chat

A high-performance, dual-mode React Native chat application that allows users to toggle between cloud-based LLMs and local on-device inference using the **Qwen** model series.

## 🚀 Features

-   **Dual-Mode Architecture**:
    -   **Cloud Mode**: Connects to OpenRouter API (defaults to `qwen/qwen-2.5-72b-instruct`) for powerful, high-reasoning responses.
    -   **Local Mode**: Runs **Qwen 0.5B** directly on your device's processor using `llama.rn`. No internet required, 100% private.
-   **Zero-Dependency UI**: Built entirely with standard React Native components for maximum performance and minimal bundle size.
-   **Native Markdown Rendering**: Custom-built lightning-fast parser for code blocks (with syntax highlighting themes), inline code, and bold text.
-   **Streaming Responses**: Real-time word-by-word generation for both Cloud and Local modes.
-   **Optimized for Mobile**: Handled keyboard offsets, edge-to-edge layouts, and inverted list logic for a premium chat experience.

## 🛠 Prerequisites

-   **Node.js** (v18 or newer recommended)
-   **Expo CLI** (`npx expo`)
-   **Development Environment**:
    -   For Android: Android Studio & SDK.
    -   For iOS: macOS with Xcode & CocoaPods.
-   **Important**: This project uses `llama.rn`, which contains native C++ code. It **cannot** be run in the standard "Expo Go" app. You must use a **Development Build**.

## 📦 Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    EXPO_PUBLIC_OPENROUTER_API_KEY=your_openrouter_key_here
    ```

3.  **Local Model**:
    Ensure `qwen-0.5b.gguf` is present in the root directory. It will be bundled as an asset and loaded into RAM on demand.

## 🏃 How to Run

### 1. Start the Expo Dev Server
```bash
npx expo start
```

### 2. Run on Emulator/Device (Development Build)
Since this project uses native modules, you need to trigger a local native build:

**For Android:**
```bash
npm run android
```

**For iOS:**
```bash
npm run ios
```

*Note: The first build will take a few minutes as it compiles the Llama C++ engine.*

## 🏗 Technical Details

-   **Local Inference**: Powered by `llama.rn` (llama.cpp bindings for React Native). It utilizes `mlock` to keep the model in RAM for rapid response times.
-   **Markdown Parser**: Uses a regex-based splitting strategy to render `FlatList` items containing mixed text and code blocks without the overhead of heavy markdown libraries.
-   **Keyboard Handling**: Uses a hybrid approach with `KeyboardAvoidingView` on iOS and manual listener-based padding on Android to bypass common "edge-to-edge" layout bugs.
