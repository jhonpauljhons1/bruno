import { router } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/bruno-logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Bruno</Text>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FCFCFC",
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#172033",
    textAlign: "center",
    marginBottom: 42,
  },

  buttons: {
    gap: 14,
  },

  registerButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#4169E1",
    alignItems: "center",
    justifyContent: "center",
  },

  registerText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  loginButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FCFCFC",
    borderWidth: 1.5,
    borderColor: "#4682B4",
    alignItems: "center",
    justifyContent: "center",
  },

  loginText: {
    color: "#355F8A",
    fontSize: 16,
    fontWeight: "600",
  },
});
