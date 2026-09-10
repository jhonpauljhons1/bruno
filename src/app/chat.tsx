import { useRef, useState } from "react";

import { router } from "expo-router";

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

  const menuAnimation = useRef(new Animated.Value(0)).current;

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

  const sendMessage = () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: cleanMessage,
      sender: "user",
    };

    setMessages((current) => [...current, newMessage]);
    setMessage("");
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
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View
              style={[
                styles.bubble,
                item.sender === "user" ? styles.userBubble : styles.brunoBubble,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
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
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },

  brunoLight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#E8EEFF",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#4169E1",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.22,
    shadowRadius: 8,

    elevation: 2,
  },

  brunoLightCore: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#4169E1",
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
});
