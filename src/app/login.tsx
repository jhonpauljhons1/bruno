import { router } from "expo-router";
import { useState } from "react";

import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "../../utils/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        "Falta un poquito",
        "Parece que falta algo. Revisa tus datos e inténtalo de nuevo.",
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert(
          "Algo no salió bien",
          "Hmm... parece que algo no salió bien. Revisa tus datos e inténtalo de nuevo.",
        );
        return;
      }

      router.replace("/chat");
    } catch (error) {
      console.log("Error al iniciar sesión:", error);

      Alert.alert(
        "Ups...",
        "Algo no salió como esperábamos. Inténtalo de nuevo en un momento.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>Qué bueno verte de nuevo.</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#78909C"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#78909C"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Entrando..." : "Entrar"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFCFC",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#172033",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#6B7C93",
    marginBottom: 28,
  },

  input: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    color: "#172033",
    fontSize: 16,
    marginBottom: 14,
  },

  button: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#4169E1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  backButton: {
    marginTop: 18,
    alignItems: "center",
  },

  backText: {
    color: "#4682B4",
    fontSize: 15,
    fontWeight: "500",
  },
});
