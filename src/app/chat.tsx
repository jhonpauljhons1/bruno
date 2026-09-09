import { StyleSheet, Text, View } from "react-native";

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bruno</Text>
      <Text style={styles.subtitle}>Aquí comenzará la conversación.</Text>
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

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    color: "#8DE0C4",
  },
});
