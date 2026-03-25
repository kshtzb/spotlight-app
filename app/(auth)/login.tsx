import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/auth.styles";
import { useAuth, useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";

export default function login() {
  const { startSSOFlow } = useSSO();
  const { signOut, isSignedIn } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      if (isSignedIn) {
        Alert.alert("You're already signed in", "Please log out first.");
        return;
      }
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      });

      if (setActive && createdSessionId) {
        setActive({ session: createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("OAuth error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      Alert.alert("Logged out", "You have successfully signed out.");
    } catch (error) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to log out. Try again.");
    }
  };

  return (
    <View style={styles.container}>
      {/* BRAND SECTION */}
      <View style={styles.brandSection}>
        <View style={styles.logoContainer}>
          <Ionicons name="leaf" size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.appName}>spotlight</Text>
        <Text style={styles.tagline}>don't miss anything</Text>
      </View>

      {/* ILLUSTRATION */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require("../../assets/images/online-wishes.png")}
          style={styles.illustration}
          resizeMode="cover"
        />
      </View>

      {/* LOGIN SECTION */}
      <View style={styles.loginSection}>
        {!isSignedIn ? (
          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            activeOpacity={0.9}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color={COLORS.surface} />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.googleButton, { backgroundColor: COLORS.error }]}
            onPress={handleLogout}
            activeOpacity={0.9}
          >
            <View style={styles.googleIconContainer}>
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COLORS.surface}
              />
            </View>
            <Text style={styles.googleButtonText}>Logout</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.termsText}>
          By continuing, you agree to our Terms and Privacy Policy
        </Text>
      </View>
    </View>
  );
}
