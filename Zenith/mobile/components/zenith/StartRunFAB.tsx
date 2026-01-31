import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StartRunFAB() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={() => router.push('/run')}
            >
                <Text style={styles.text}>START RUN</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 24,
        alignSelf: 'center',
        width: width - 32, // Full width minus padding
        zIndex: 100,
    },
    button: {
        backgroundColor: '#CCFF00', // Hyper-Volt
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4, // Sharp corners for brutalism (or slight rounded) - Prompt said "massive typography" so clean box works well
        shadowColor: '#CCFF00',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    text: {
        fontFamily: 'Unbounded_700Bold',
        fontSize: 24,
        color: '#000',
        letterSpacing: 2,
    }
});
