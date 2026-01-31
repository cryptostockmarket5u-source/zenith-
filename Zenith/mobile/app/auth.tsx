import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import { Stack, useRouter } from 'expo-router';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            Alert.alert(error.message);
            setLoading(false);
        } else {
            // Success handled by auth state listener or navigation
            setLoading(false);
            router.replace('/');
        }
    }

    async function signUpWithEmail() {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            Alert.alert(error.message);
            setLoading(false);
        } else if (!session) {
            Alert.alert('Please check your inbox for email verification!');
            setLoading(false);
        } else {
            setLoading(false);
            router.replace('/');
        }
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.header}>
                <Text style={styles.title}>ZENITH</Text>
                <Text style={styles.subtitle}>Conquer the Streets</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    placeholder="email@address.com"
                    placeholderTextColor="#666"
                    autoCapitalize={'none'}
                />
                <TextInput
                    style={styles.input}
                    onChangeText={(text) => setPassword(text)}
                    value={password}
                    secureTextEntry={true}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    autoCapitalize={'none'}
                />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} disabled={loading} onPress={signInWithEmail}>
                        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>SIGN IN</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.signUpBtn]} disabled={loading} onPress={signUpWithEmail}>
                        <Text style={[styles.buttonText, { color: '#FFD700' }]}>SIGN UP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 48,
        fontWeight: '900',
        color: '#FFD700',
        letterSpacing: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.8,
        marginTop: 5,
        letterSpacing: 2,
    },
    form: {
        gap: 15,
    },
    input: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 8,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 20,
        gap: 10,
    },
    button: {
        backgroundColor: '#FFD700',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    signUpBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    buttonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#000',
    },
});
