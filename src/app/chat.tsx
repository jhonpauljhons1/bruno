import { router } from "expo-router";
import { fetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";
import { supabase } from "../../utils/supabase";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bruno";
};

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const menuAnimation = useRef(new Animated.Value(0)).current;
  const thinkingAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    if (isThinking) {
      const breathing = Animated.loop(
        Animated.sequence([
          Animated.timing(thinkingAnimation, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(thinkingAnimation, {
            toValue: 0,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );

      breathing.start();

      return () => {
        breathing.stop();
      };
    }

    thinkingAnimation.stopAnimation();
    thinkingAnimation.setValue(0);
  }, [isThinking, thinkingAnimation]);

  const handleBrunoLightPress = () => {
    if (menuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setMenuVisible(false);
      });

      return;
    }

    setMenuVisible(true);

    Animated.spring(menuAnimation, {
      toValue: 1,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.log("Error al cerrar sesión:", error);
      return;
    }

    router.replace("/");
  };

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: cleanMessage,
      sender: "user",
    };

    const conversation = [...messages, newMessage];

    setMessages(conversation);
    setMessage("");
    setIsThinking(true);

    try {
      const brunoId = `${Date.now()}-bruno`;

      const response = await fetch("http://192.168.1.74:3000/api/chat-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          history: conversation,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al hablar con Bruno.");
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("No se pudo iniciar el streaming.");
      }

      const decoder = new TextDecoder();

      let fullText = "";
      let brunoMessageCreated = false;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        if (!chunk) continue;

        fullText += chunk;

        if (!brunoMessageCreated) {
          brunoMessageCreated = true;

          const brunoMessage: Message = {
            id: brunoId,
            text: fullText,
            sender: "bruno",
          };

          setMessages((current) => [...current, brunoMessage]);
        } else {
          setMessages((current) =>
            current.map((item) =>
              item.id === brunoId
                ? {
                    ...item,
                    text: fullText,
                  }
                : item,
            ),
          );
        }
      }

      const finalChunk = decoder.decode();

      if (finalChunk) {
        fullText += finalChunk;

        setMessages((current) =>
          current.map((item) =>
            item.id === brunoId
              ? {
                  ...item,
                  text: fullText,
                }
              : item,
          ),
        );
      }

      if (!brunoMessageCreated && fullText.trim()) {
        const brunoMessage: Message = {
          id: brunoId,
          text: fullText,
          sender: "bruno",
        };

        setMessages((current) => [...current, brunoMessage]);
      }
    } catch (error) {
      console.log("Error al hablar con Bruno:", error);

      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        text: "Hmm... tuve un problema para responder. Inténtalo otra vez en un momento.",
        sender: "bruno",
      };

      setMessages((current) => [...current, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.brunoLight}
            onPress={handleBrunoLightPress}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Opciones de Bruno"
          >
            <Animated.View
              style={[
                styles.brunoHalo,
                {
                  opacity: isThinking
                    ? thinkingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.45, 1],
                      })
                    : 0.55,

                  transform: [
                    {
                      scaleX: isThinking
                        ? thinkingAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1.12],
                          })
                        : 1,
                    },
                    {
                      scaleY: isThinking
                        ? thinkingAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.92, 1.05],
                          })
                        : 1,
                    },
                  ],
                },
              ]}
            >
              <Svg width="100%" height="100%" viewBox="0 0 120 30">
                <Defs>
                  <RadialGradient
                    id="brunoGlow"
                    cx="50%"
                    cy="50%"
                    rx="50%"
                    ry="50%"
                  >
                    <Stop offset="0%" stopColor="#4169E1" stopOpacity="0.34" />
                    <Stop offset="35%" stopColor="#4169E1" stopOpacity="0.18" />
                    <Stop offset="70%" stopColor="#4169E1" stopOpacity="0.07" />
                    <Stop offset="100%" stopColor="#4169E1" stopOpacity="0" />
                  </RadialGradient>
                </Defs>

                <Ellipse
                  cx="60"
                  cy="15"
                  rx="58"
                  ry="13"
                  fill="url(#brunoGlow)"
                />
              </Svg>
            </Animated.View>

            <View style={styles.brunoLightCore} />
          </TouchableOpacity>

          {menuVisible && (
            <Animated.View
              style={[
                styles.brunoMenu,
                {
                  opacity: menuAnimation,
                  transform: [
                    {
                      scale: menuAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.92, 1],
                      }),
                    },
                    {
                      translateY: menuAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-6, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.menuTitle}>¿Quieres cerrar sesión?</Text>

              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleBrunoLightPress}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 120);
          }}
          renderItem={({ item }) =>
            item.sender === "user" ? (
              <View style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            ) : (
              <View style={styles.brunoMessage}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )
          }
        />

        <View style={styles.inputArea}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe algo..."
              placeholderTextColor="#829BB5"
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FCFCFC",
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  brunoLight: {
    width: 74,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },

  brunoHalo: {
    position: "absolute",
    width: 110,
    height: 28,
  },

  brunoLightCore: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4169E1",
    shadowColor: "#4169E1",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 4,
  },

  brunoMenu: {
    position: "absolute",
    top: 46,
    alignSelf: "center",
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,

    borderWidth: 1,
    borderColor: "#E7ECF2",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 6,
    zIndex: 30,
  },

  menuTitle: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 14,
  },

  logoutButton: {
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    color: "#4169E1",
    fontSize: 15,
    fontWeight: "600",
  },

  cancelButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  cancelText: {
    color: "#7A8797",
    fontSize: 14,
  },

  messages: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    justifyContent: "flex-end",
  },

  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    marginBottom: 10,
  },

  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "78%",
    backgroundColor: "#E4EEFA",
  },

  brunoBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#F0F5FA",
  },

  messageText: {
    color: "#172033",
    fontSize: 16,
    lineHeight: 22,
  },

  inputArea: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    paddingLeft: 4,
    paddingRight: 6,
    paddingVertical: 5,

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 11,
    color: "#172033",
    fontSize: 16,
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#4169E1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },

  sendText: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
  },

  brunoMessage: {
    alignSelf: "stretch",
    width: "100%",
    paddingHorizontal: 8,
    paddingVertical: 14,
    marginVertical: 4,
  },
});
