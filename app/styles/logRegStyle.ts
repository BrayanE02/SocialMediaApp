import { StyleSheet } from "react-native";

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  backArrow: {
    position: "absolute",
    top: 60, // device's safe area
    left: 20,
  },
  backColor: {
    fontSize: 24,
    color: "white",
  },
  title: {
    fontSize: 80,
    fontWeight: "bold",
    color: "white",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: "80%",
    height: 40,
    borderColor: "#D3D3D3",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "white",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#A9A9A9",
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  link: {
    color: "white",
    marginTop: 20,
    textDecorationLine: "underline",
  },
  errorText: {
    color: "white",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 5,
    marginLeft: "10%",
  },
});

export default Styles;
