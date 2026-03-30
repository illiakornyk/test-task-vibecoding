import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Switch,
} from 'react-native';
import { initLlama } from 'llama.rn';
import { Asset } from 'expo-asset';

// API Configuration securely referencing the OpenRouter Key from Expo environment variables
const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export default function App() {
  // State for the conversation history
  const [messages, setMessages] = useState([]);
  // State for the current input field value
  const [inputText, setInputText] = useState('');
  // State for the loading indicator when Qwen is fetching a response
  const [isLoading, setIsLoading] = useState(false);

  // Toggle for local on-device mode vs cloud OpenRouter
  const [isLocalMode, setIsLocalMode] = useState(false);
  // Store the active Llama context
  const [localLlama, setLocalLlama] = useState(null);

  // Initialize the native C++ LLaMA engine directly on the phone
  const initializeLocalModel = async (value) => {
    setIsLocalMode(value);
    if (value && !localLlama) {
      try {
        console.log("Initializing local model...");
        
        // 1. Resolve and download the bundled asset to the device's native file system
        const modelAsset = Asset.fromModule(require('./qwen-0.5b.gguf'));
        if (!modelAsset.localUri) {
           await modelAsset.downloadAsync();
        }
        
        // 2. Pass the absolute file system path to the Native C++ LLaMA Engine
        const modelPath = modelAsset.localUri.replace('file://', '');

        const llamaContext = await initLlama({
          model: modelPath,
          use_mlock: true, // Keep it locked in RAM for fast generation
          n_ctx: 2048,     // Context window suited for Qwen
        });
        setLocalLlama(llamaContext);
        console.log("Local model ready!");
      } catch (e) {
        console.error("Failed to initialize Llama locally:", e);
      }
    }
  };

  // Function to handle sending a message to the Qwen model via OpenRouter
  const handleSend = async () => {
    // Prevent sending empty messages or sending while a request is already loading
    if (!inputText.trim() || isLoading) return;

    // Create the user message object
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
    };

    // Append the new user message to the beginning of the list
    // (This is necessary because we are using an inverted FlatList for chat UI)
    setMessages((prevMessages) => [userMessage, ...prevMessages]);
    setInputText('');
    setIsLoading(true);

    try {
      // We format the history for the API. Keep in mind that for this simple scope,
      // we'll send the entire history to maintain conversational context.
      const apiMessages = [userMessage, ...messages]
        .reverse()
        .map((msg) => ({ role: msg.role, content: msg.content }));

      // Create a placeholder message ID for the AI response
      const aiMessageId = (Date.now() + 1).toString();

      // Add an empty AI message to the list immediately
      setMessages((prev) => [
        { id: aiMessageId, role: 'assistant', content: '' },
        ...prev
      ]);

      if (isLocalMode) {
        if (!localLlama) throw new Error("Local model not initialized yet");

        // Format history exactly into Qwen's ChatML Prompt format native expectations
        let prompt = "";
        apiMessages.forEach((msg) => {
          prompt += `<|im_start|>${msg.role}\n${msg.content}<|im_end|>\n`;
        });
        prompt += `<|im_start|>assistant\n`;

        // Direct C++ invocation on phone processor
        localLlama.completion({
          prompt,
          n_predict: 400,
        }, (streamData) => {
           // Direct callback stream updating the chat list organically
           setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + streamData.token }
                  : msg
              )
            );
        }).then(() => {
           setIsLoading(false);
        }).catch((e) => {
           console.error("Local inference error:", e);
           setIsLoading(false);
        });

      } else {
        // --- EXISTING CLOUD OPENROUTER XHR IMPLEMENTATION ---
        const xhr = new XMLHttpRequest();
      xhr.open('POST', 'https://openrouter.ai/api/v1/chat/completions');
      xhr.setRequestHeader('Content-Type', 'application/json');
      // Bearer token extracted from EXPO_PUBLIC environment variables
      xhr.setRequestHeader('Authorization', `Bearer ${OPENROUTER_API_KEY}`);
      xhr.setRequestHeader('HTTP-Referer', 'https://github.com/expo/expo');
      xhr.setRequestHeader('X-Title', 'Qwen Mobile Chat');

      let seenBytes = 0;

      xhr.onreadystatechange = () => {
        // readyState 3 is LOADING (partial data), 4 is DONE
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const newData = xhr.responseText.substring(seenBytes);
          seenBytes = xhr.responseText.length;

          const lines = newData.split('\n');
          for (let line of lines) {
            line = line.trim();
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6);
              if (dataStr === '[DONE]') continue;

              try {
                const data = JSON.parse(dataStr);
                if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                  const chunk = data.choices[0].delta.content;

                  // Update the specific streaming message by appending the chunk
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, content: msg.content + chunk }
                        : msg
                    )
                  );
                }
              } catch (e) {
                // Incomplete JSON chunk, ignore and wait for next progress event stream
              }
            }
          }

          // Re-enable the send button when request is completely finished
          if (xhr.readyState === 4) {
             setIsLoading(false);
          }
        }
      };

      xhr.onerror = () => {
        console.error('XHR Error fetching streaming completion');
        setMessages((prev) => [
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: `Sorry, there was an error processing your request. Please try again.`,
          },
          ...prev
        ]);
        setIsLoading(false);
      };

        // Send the payload enabling streaming
        xhr.send(JSON.stringify({
          model: 'qwen/qwen-2.5-72b-instruct',
          messages: apiMessages,
          stream: true, // Enables Server-Sent Events from OpenRouter
        }));
      }

    } catch (error) {
      console.error('Error preparing request:', error);
      setIsLoading(false);
    }
  };

  // A simple Markdown parser to parse code blocks, inline code, and bold text using core React Native components (zero dependencies)
  const renderMarkdownText = (text, isUser) => {
    // 1. Split by block code formatting (```...```)
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);

    return parts.map((part, index) => {
      // Odd indices are the code blocks
      if (index % 2 !== 0) {
        return (
          <View key={index} style={styles.codeBlockContainer}>
            <Text style={styles.codeBlockText}>{part.trim()}</Text>
          </View>
        );
      }

      // 2. Parse inline text elements on the non-codeblock parts
      const inlineCodeRegex = /`([^`]+)`/g;
      const inlineParts = part.split(inlineCodeRegex);

      return (
        <Text key={index} style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {inlineParts.map((subPart, subIndex) => {
            // Odd indices in inline parts are inline `code`
            if (subIndex % 2 !== 0) {
              return <Text key={subIndex} style={[styles.inlineCode, isUser ? styles.userInlineCode : styles.aiInlineCode]}>{subPart}</Text>;
            }

            // 3. Parse bold text on the normal chunks
            const boldRegex = /\*\*([^*]+)\*\*/g;
            const boldParts = subPart.split(boldRegex);

            return boldParts.map((bPart, bIndex) => {
              // Odd indices in boldParts are bold text
              if (bIndex % 2 !== 0) {
                return <Text key={bIndex} style={styles.boldText}>{bPart}</Text>;
              }

              // Standard unformatted string text
              return bPart;
            });
          })}
        </Text>
      );
    });
  };

  // Component to render individual message bubbles
  const renderMessageBubble = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
        {renderMarkdownText(item.content, isUser)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/*
        ANDROID KEYBOARD TRAP FIX:
        For iOS, `padding` works well to shift view above the keyboard.
        For Android, `undefined` prevents double-shifting or squishing because Android
        windowSoftInputMode automatically adjusts the layout.
      */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Chat Title bar with Toggle */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Qwen Chat</Text>
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>{isLocalMode ? 'Local Mode' : 'Cloud Mode'}</Text>
            <Switch
              value={isLocalMode}
              onValueChange={initializeLocalModel}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isLocalMode ? '#007BFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/*
          LIST INVERSION:
          Using `inverted={true}` displays the latest items at the bottom of the screen automatically.
          This behaves naturally like iMessage or WhatsApp without complex scrolling logic.
        */}
        <FlatList
          style={styles.chatList}
          contentContainerStyle={styles.chatListContent}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageBubble}
          inverted={true}
          showsVerticalScrollIndicator={false}
        />

        {/* Loading Indicator when Qwen is processing */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007BFF" />
            <Text style={styles.loadingText}>Qwen is typing...</Text>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            multiline
          />
          {/* Disable send interaction if input is empty or request is loading */}
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// -------------------------------------------------------------
// STYLING (Zero Third-Party dependencies)
// -------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F7F8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  chatListContent: {
    paddingVertical: 15,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 10,
  },
  userBubble: {
    backgroundColor: '#007BFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#000000',
  },
  boldText: {
    fontWeight: 'bold',
  },
  inlineCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  userInlineCode: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiInlineCode: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  codeBlockContainer: {
    backgroundColor: '#1E1E1E',
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    width: '100%',
  },
  codeBlockText: {
    color: '#D4D4D4',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEC',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: '#333',
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A0C6FF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
