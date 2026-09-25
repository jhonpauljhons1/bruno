import { router } from "expo-router";
import { fetch } from "expo/fetch";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Keyboard,
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
function BrunoText({ text }: { text: string }) {
  return <Text style={styles.messageText}>{text}</Text>;
}
const EMOTION_COLORS = {
  neutral: "#4169E1",
  calma: "#64A8E8",
  alegria: "#9EDBC8",
  tristeza: "#5367B7",
  ansiedad: "#7667C9",
  enojo: "#C76878",
};

export default function ChatScreen() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isResponding, setIsResponding] = useState(false);
  const [emotion, setEmotion] = useState("neutral");

  const menuAnimation = useRef(new Animated.Value(0)).current;
  const calmBreath = useRef(new Animated.Value(0)).current;
  const activeBreath = useRef(new Animated.Value(0)).current;
  const activityAnimation = useRef(new Animated.Value(0)).current;
  const colorTransition = useRef(new Animated.Value(1)).current;
  const previousEmotionRef = useRef("neutral");
  const [fromEmotion, setFromEmotion] = useState("neutral");
  const [toEmotion, setToEmotion] = useState("neutral");
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  const flatListRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const calmLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(calmBreath, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(calmBreath, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ]),
    );

    const activeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(activeBreath, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(activeBreath, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    calmLoop.start();
    activeLoop.start();

    return () => {
      calmLoop.stop();
      activeLoop.stop();
    };
  }, [calmBreath, activeBreath]);

  useEffect(() => {
    Animated.timing(activityAnimation, {
      toValue: isThinking || isResponding ? 1 : 0,
      duration: isThinking || isResponding ? 650 : 1800,
      useNativeDriver: true,
    }).start();
  }, [isThinking, isResponding, activityAnimation]);

  useEffect(() => {
    if (emotion === previousEmotionRef.current) return;

    setFromEmotion(previousEmotionRef.current);
    setToEmotion(emotion);
    previousEmotionRef.current = emotion;

    colorTransition.stopAnimation();
    colorTransition.setValue(0);

    Animated.timing(colorTransition, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: true,
    }).start();
  }, [emotion, colorTransition]);

  useEffect(() => {
    if (!isThinking) {
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      return;
    }

    const animateWave = (wave: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(wave, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]);

    const waterWaves = Animated.loop(
      Animated.parallel([
        animateWave(wave1, 0),
        animateWave(wave2, 500),
        animateWave(wave3, 1000),
      ]),
    );

    waterWaves.start();

    return () => {
      waterWaves.stop();
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
    };
  }, [isThinking, wave1, wave2, wave3]);

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
  const loadActiveChat = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("bruno_active_chat")
      .select("messages")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.log("⚠️ Error cargando conversación:", error.message);
      return;
    }

    if (Array.isArray(data?.messages)) {
      setMessages(data.messages);
    }
  };

  useEffect(() => {
    loadActiveChat();
  }, []);

  const saveActiveChat = async (userId: string, chatMessages: Message[]) => {
    const { error } = await supabase.from("bruno_active_chat").upsert(
      {
        user_id: userId,
        messages: chatMessages,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (error) {
      console.log("⚠️ Error guardando conversación:", error.message);
    }
  };
  useEffect(() => {
    if (messages.length === 0) return;

    const saveTimer = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await saveActiveChat(user.id, messages);
    }, 1200);

    return () => {
      clearTimeout(saveTimer);
    };
  }, [messages]);

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;
    Keyboard.dismiss();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("⚠️ No se encontró el usuario para la memoria de Bruno.");
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: cleanMessage,
      sender: "user",
    };

    const conversation = [...messages, newMessage];

    setMessages(conversation);
    setMessage("");
    setIsThinking(true);
    setIsResponding(true);
    fetch("https://bruno-kblm.onrender.com/api/emotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        history: conversation,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.emotion) {
          setEmotion(data.emotion);
          console.log("🎨 Emoción recibida:", data.emotion);
        }
      })
      .catch((error) => {
        console.log("⚠️ Error detectando emoción:", error);
      });

    const thinkingStartedAt = Date.now();
    const MIN_THINKING_TIME = 3000;

    try {
      const brunoId = `${Date.now()}-bruno`;

      const response = await fetch(
        "https://bruno-kblm.onrender.com/api/chat-stream",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            history: conversation,
            userId: user.id,
          }),
        },
      );

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
      let displayedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, {
          stream: true,
        });

        if (!chunk) continue;

        fullText += chunk;

        if (!brunoMessageCreated) {
          const elapsed = Date.now() - thinkingStartedAt;
          const remaining = MIN_THINKING_TIME - elapsed;

          if (remaining > 0) {
            await new Promise((resolve) => setTimeout(resolve, remaining));
          }

          setIsThinking(false);
          brunoMessageCreated = true;

          const brunoMessage: Message = {
            id: brunoId,
            text: "",
            sender: "bruno",
          };

          setMessages((current) => [...current, brunoMessage]);
        }

        const targetText = fullText;
        const pendingText = targetText.slice(displayedLength);
        const words = pendingText.match(/\S+\s*/g) ?? [];

        let visibleText = targetText.slice(0, displayedLength);

        for (const word of words) {
          visibleText += word;

          setMessages((current) =>
            current.map((item) =>
              item.id === brunoId
                ? {
                    ...item,
                    text: visibleText,
                  }
                : item,
            ),
          );
          displayedLength = visibleText.length;

          await new Promise((resolve) => setTimeout(resolve, 55));
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
      setIsResponding(false);
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
                  opacity: Animated.add(
                    calmBreath.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.56, 0.68],
                    }),
                    Animated.multiply(
                      activityAnimation,
                      activeBreath.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-0.08, 0.32],
                      }),
                    ),
                  ),
                  transform: [
                    {
                      scaleX: Animated.add(
                        calmBreath.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.97, 1.05],
                        }),
                        Animated.multiply(
                          activityAnimation,
                          activeBreath.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.03, 0.6],
                          }),
                        ),
                      ),
                    },
                    {
                      scaleY: Animated.add(
                        calmBreath.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.97, 1.03],
                        }),
                        Animated.multiply(
                          activityAnimation,
                          activeBreath.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-0.05, 0.02],
                          }),
                        ),
                      ),
                    },
                  ],
                },
              ]}
            >
              <View style={StyleSheet.absoluteFill}>
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      opacity: colorTransition.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0],
                      }),
                    },
                  ]}
                >
                  <Svg width="100%" height="100%" viewBox="0 0 120 30">
                    <Defs>
                      <RadialGradient
                        id="brunoGlowFrom"
                        cx="50%"
                        cy="50%"
                        rx="50%"
                        ry="50%"
                      >
                        <Stop
                          offset="0%"
                          stopColor={
                            EMOTION_COLORS[
                              fromEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0.34"
                        />
                        <Stop
                          offset="35%"
                          stopColor={
                            EMOTION_COLORS[
                              fromEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0.18"
                        />
                        <Stop
                          offset="70%"
                          stopColor={
                            EMOTION_COLORS[
                              fromEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0.07"
                        />
                        <Stop
                          offset="100%"
                          stopColor={
                            EMOTION_COLORS[
                              fromEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0"
                        />
                      </RadialGradient>
                    </Defs>
                    <Ellipse
                      cx="60"
                      cy="15"
                      rx="58"
                      ry="13"
                      fill="url(#brunoGlowFrom)"
                    />
                  </Svg>
                </Animated.View>

                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    { opacity: colorTransition },
                  ]}
                >
                  <Svg width="100%" height="100%" viewBox="0 0 120 30">
                    <Defs>
                      <RadialGradient
                        id="brunoGlowTo"
                        cx="50%"
                        cy="50%"
                        rx="50%"
                        ry="50%"
                      >
                        <Stop
                          offset="0%"
                          stopColor={
                            EMOTION_COLORS[
                              toEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0.34"
                        />
                        <Stop
                          offset="35%"
                          stopColor={
                            EMOTION_COLORS[
                              toEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0.18"
                        />
                        <Stop
                          offset="70%"
                          stopColor={
                            EMOTION_COLORS[
                              toEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0.07"
                        />
                        <Stop
                          offset="100%"
                          stopColor={
                            EMOTION_COLORS[
                              toEmotion as keyof typeof EMOTION_COLORS
                            ]
                          }
                          stopOpacity="0"
                        />
                      </RadialGradient>
                    </Defs>
                    <Ellipse
                      cx="60"
                      cy="15"
                      rx="58"
                      ry="13"
                      fill="url(#brunoGlowTo)"
                    />
                  </Svg>
                </Animated.View>
              </View>
            </Animated.View>

            <Animated.View
              style={[
                styles.brunoLightCore,
                {
                  transform: [
                    {
                      scale: Animated.add(
                        calmBreath.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.96, 1.04],
                        }),
                        Animated.multiply(
                          activityAnimation,
                          activeBreath.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 0.08],
                          }),
                        ),
                      ),
                    },
                  ],
                },
              ]}
            >
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 9,
                    backgroundColor:
                      EMOTION_COLORS[
                        fromEmotion as keyof typeof EMOTION_COLORS
                      ],
                    opacity: colorTransition.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    borderRadius: 9,
                    backgroundColor:
                      EMOTION_COLORS[toEmotion as keyof typeof EMOTION_COLORS],
                    opacity: colorTransition,
                  },
                ]}
              />
            </Animated.View>
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
            if (isResponding) {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 120);
            }
          }}
          ListFooterComponent={
            isThinking ? (
              <View style={styles.thinkingIndicator}>
                {[wave1, wave2, wave3].map((wave, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.thinkingWave,
                      {
                        opacity: wave.interpolate({
                          inputRange: [0, 0.25, 0.65, 1],
                          outputRange: [0, 0.55, 0.25, 0],
                        }),
                        transform: [
                          {
                            scale: wave.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.15, 1.8],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) =>
            item.sender === "user" ? (
              <View style={[styles.bubble, styles.userBubble]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            ) : (
              <View style={styles.brunoMessage}>
                <BrunoText text={item.text} />
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
    width: 18,
    height: 18,
    borderRadius: 9,
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
  thinkingIndicator: {
    width: 34,
    height: 34,
    marginLeft: 8,
    marginTop: 8,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  thinkingWave: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#4169E1",
  },

  thinkingCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#4169E1",
  },
});
