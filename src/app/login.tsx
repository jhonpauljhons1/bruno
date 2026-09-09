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
      Alert.alert("Faltan datos", "Escribe tu correo y contraseña.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        Alert.alert("No pudimos iniciar sesión", error.message);
        return;
      }

      Alert.alert("Bienvenido", "Sesión iniciada correctamente.");

      router.replace("/chat");
    } catch (error) {
      console.log("Error al iniciar sesión:", error);

      Alert.alert("Error", "Ocurrió un problema al iniciar sesión.");
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
    backgroundColor: "#071A2B",
    paddingHorizontal: 30,
    justifyContent: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    color: "#8DE0C4",
    marginBottom: 35,
  },

  input: {
    height: 55,
    backgroundColor: "#123B52",
    borderRadius: 12,
    paddingHorizontal: 18,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 15,
  },

  button: {
    height: 55,
    borderRadius: 28,
    backgroundColor: "#8DE0C4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#071A2B",
  },

  backButton: {
    alignItems: "center",
    marginTop: 25,
  },

  backText: {
    fontSize: 16,
    color: "#8DE0C4",
  },
});
