import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>✦</Text>
      </View>

      {/* Nombre */}
      <Text style={styles.title}>Bruno</Text>

      {/* Botones */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.registerButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.registerText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.loginText}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071A2B",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#123B52",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },

  logo: {
    fontSize: 55,
    color: "#8DE0C4",
  },

  title: {
    fontSize: 42,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 60,
  },

  buttons: {
    width: "100%",
    gap: 15,
  },

  registerButton: {
    height: 55,
    borderRadius: 28,
    backgroundColor: "#8DE0C4",
    alignItems: "center",
    justifyContent: "center",
  },

  registerText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#071A2B",
  },

  loginButton: {
    height: 55,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#8DE0C4",
    alignItems: "center",
    justifyContent: "center",
  },

  loginText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#8DE0C4",
  },
});
