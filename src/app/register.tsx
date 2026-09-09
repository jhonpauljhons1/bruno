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
