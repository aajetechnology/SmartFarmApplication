import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
    const navigation = useNavigation();

    return (
        <LinearGradient colors={['#1B5E20', '#4CAF50']} style={styles.container}>
            <StatusBar style="light" />
            <SafeAreaView style={styles.safeArea}>
                
                {/* Visual Accent - Can be replaced with an Icon/Image */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={{fontSize: 50}}>🌱</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>SmartFarm</Text>
                    <Text style={styles.subtitle}>
                        Revolutionizing your harvest with real-time data and insights.
                    </Text>
                </View>

                <View style={styles.buttonGroup}>
                    <TouchableOpacity 
                        style={[styles.button, styles.registerButton]}
                        onPress={() => navigation.navigate('Register')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.registerText}>Get Started</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.button, styles.loginButton]}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.loginText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
                
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 60,
    },
    logoContainer: {
        marginTop: 40,
        alignItems: 'center',
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    content: {
        paddingHorizontal: 40,
        alignItems: 'center',
    },
    title: {
        color: '#fff',
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 12,
    },
    subtitle: {
        color: '#E8F5E9',
        fontSize: 17,
        lineHeight: 24,
        textAlign: 'center',
        opacity: 0.9,
    },
    buttonGroup: {
        width: '100%',
        paddingHorizontal: 30,
        gap: 15, // Modern layout property
    },
    button: {
        width: '100%',
        height: 60,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    registerButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 8,
    },
    registerText: {
        color: '#1B5E20',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    loginText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});