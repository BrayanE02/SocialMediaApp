// app/styles/TabsStyles.ts
import { StyleSheet, Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export default StyleSheet.create({
  container: {
    flex: 1,
    width: width, // or simply '100%'
    height: height, // or simply '100%'
    backgroundColor: "black", // or any background color you prefer
    paddingHorizontal: 20,
    paddingTop: 50, // adjust for status bar or any header if needed
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
});
