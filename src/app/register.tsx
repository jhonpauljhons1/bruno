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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Faltan datos", "Completa todos los campos.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Contraseña muy corta",
        "La contraseña debe tener al menos 6 caracteres.",
      );
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
          },
        },
      });

      if (error) {
        Alert.alert("No pudimos crear la cuenta", error.message);
        return;
      }

      console.log("Usuario creado:", data.user?.id);

      Alert.alert(
        "Cuenta creada",
        "Revisa tu correo para confirmar tu cuenta.",
      );
    } catch (error) {
      console.log("Error al registrar:", error);

      Alert.alert("Error", "Ocurrió un problema al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <Text style={styles.subtitle}>Comencemos a conocernos.</Text>

      <TextInput
        style={styles.input}
        placeholder="Tu nombre"
        placeholderTextColor="#78909C"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#78909C"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#78909C"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
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
