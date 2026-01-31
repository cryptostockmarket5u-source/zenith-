import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
// import * as ImagePicker from 'expo-image-picker';

interface CreateClubModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (clubData: any) => void;
}

export default function CreateClubModal({ visible, onClose, onSubmit }: CreateClubModalProps) {
    const [step, setStep] = useState(1);
    const [clubName, setClubName] = useState('');
    const [clubLogo, setClubLogo] = useState<string | null>(null);
    const [clubColor, setClubColor] = useState('#CCFF00');
    const [country, setCountry] = useState('United States');
    const [isPublic, setIsPublic] = useState(true);

    const pickImage = async () => {
        // Temporarily disabled - install expo-image-picker to enable
        Alert.alert('Image Picker', 'Install expo-image-picker to enable this feature');
        // const result = await ImagePicker.launchImageLibraryAsync({
        //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
        //     allowsEditing: true,
        //     aspect: [1, 1],
        //     quality: 1,
        // });
        // if (!result.canceled) {
        //     setClubLogo(result.assets[0].uri);
        //     Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // }
    };

    const handleSubmit = () => {
        if (!clubName || !clubLogo) {
            Alert.alert('Missing Info', 'Please fill in all required fields');
            return;
        }

        onSubmit({
            name: clubName,
            logo: clubLogo,
            color: clubColor,
            country,
            isPublic
        });

        // Show success screen
        setStep(5);

        // Reset after 3 seconds
        setTimeout(() => {
            resetForm();
            onClose();
        }, 3000);
    };

    const resetForm = () => {
        setStep(1);
        setClubName('');
        setClubLogo(null);
        setClubColor('#CCFF00');
        setCountry('United States');
        setIsPublic(true);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>TERRA CLUBS MODE FORM</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Step 1: Club Name */}
                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.label}>Name of terra club</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter a club name"
                                placeholderTextColor="#999"
                                value={clubName}
                                onChangeText={setClubName}
                            />
                            <TouchableOpacity
                                style={styles.nextBtn}
                                onPress={() => {
                                    if (clubName) {
                                        setStep(2);
                                        Haptics.selectionAsync();
                                    }
                                }}
                            >
                                <Text style={styles.nextBtnText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 2: Upload Logo */}
                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <TouchableOpacity style={styles.uploadCircle} onPress={pickImage}>
                                {clubLogo ? (
                                    <Image source={{ uri: clubLogo }} style={styles.logoPreview} />
                                ) : (
                                    <Ionicons name="cloud-upload-outline" size={40} color="#666" />
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                                <Text style={styles.uploadBtnText}>Upload club logo</Text>
                            </TouchableOpacity>

                            <Text style={styles.helpText}>
                                Make sure your logo is a square image and doesn't have transparent edges as it won't display properly on the Terra map.
                            </Text>

                            <View style={styles.exampleRow}>
                                <View style={styles.exampleItem}>
                                    <View style={[styles.exampleBox, { backgroundColor: '#FF6B6B' }]}>
                                        <Text style={styles.exampleText}>INTVL</Text>
                                    </View>
                                    <Text style={styles.exampleLabel}>Good photo ✓</Text>
                                </View>
                                <View style={styles.exampleItem}>
                                    <View style={[styles.exampleBox, { backgroundColor: '#FF6B6B', borderRadius: 50 }]}>
                                        <Text style={styles.exampleText}>INTVL</Text>
                                    </View>
                                    <Text style={styles.exampleLabel}>Bad photo ✗</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.nextBtn}
                                onPress={() => {
                                    if (clubLogo) {
                                        setStep(3);
                                        Haptics.selectionAsync();
                                    }
                                }}
                            >
                                <Text style={styles.nextBtnText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 3: Color Picker */}
                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.label}>Enter the main colour of your run club</Text>
                            <Text style={styles.subLabel}>Type in the Hex code</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="#3b62c2"
                                placeholderTextColor="#999"
                                value={clubColor}
                                onChangeText={setClubColor}
                            />

                            <Text style={styles.subLabel}>Or select a colour from the picker below.</Text>

                            <View style={styles.colorPickerContainer}>
                                <View style={styles.colorGradient}>
                                    {/* Simplified color picker - in production use a proper color picker library */}
                                    <View style={styles.colorRow}>
                                        {['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'].map(color => (
                                            <TouchableOpacity
                                                key={color}
                                                style={[styles.colorSwatch, { backgroundColor: color }]}
                                                onPress={() => setClubColor(color)}
                                            />
                                        ))}
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.nextBtn}
                                onPress={() => {
                                    setStep(4);
                                    Haptics.selectionAsync();
                                }}
                            >
                                <Text style={styles.nextBtnText}>Next</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 4: Country & Privacy */}
                    {step === 4 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.label}>Select the Country your club is from</Text>

                            <TouchableOpacity style={styles.countrySelector}>
                                <Text style={styles.countryText}>🇺🇸 {country}</Text>
                                <Ionicons name="chevron-forward" size={20} color="#666" />
                            </TouchableOpacity>

                            <Text style={styles.label}>Is your Terra club open to the public for anyone to join or invite only?</Text>

                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => {
                                    setIsPublic(true);
                                    Haptics.selectionAsync();
                                }}
                            >
                                <Text style={styles.radioText}>Open to the public</Text>
                                <View style={[styles.radio, isPublic && styles.radioActive]}>
                                    {isPublic && <Ionicons name="checkmark" size={16} color="white" />}
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => {
                                    setIsPublic(false);
                                    Haptics.selectionAsync();
                                }}
                            >
                                <Text style={styles.radioText}>Invite only</Text>
                                <View style={[styles.radio, !isPublic && styles.radioActive]} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                                <Text style={styles.submitBtnText}>Submit Application</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 5: Success */}
                    {step === 5 && (
                        <View style={[styles.stepContainer, styles.successContainer]}>
                            <Text style={styles.successTitle}>APPLICATION{'\n'}SUBMITTED</Text>
                            <Text style={styles.successText}>
                                We will double check your application to make sure everything is correct and then you will receive a notification once your terra club has been approved.
                            </Text>
                            <Text style={styles.successSubtitle}>EDITING MY TERRA CLUB</Text>
                            <Text style={styles.successText}>
                                Once your club has been approved you can edit your terra club details by going to settings menu inside of Terra Clubs Mode.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { color: 'white', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

    content: { flex: 1, padding: 24 },
    stepContainer: { flex: 1 },

    label: { color: '#333', fontSize: 14, fontWeight: '600', marginBottom: 12 },
    subLabel: { color: '#666', fontSize: 13, marginBottom: 8 },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#000',
        marginBottom: 20
    },

    uploadCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: '#CCC',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 20,
        overflow: 'hidden'
    },
    logoPreview: { width: '100%', height: '100%' },
    uploadBtn: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 20
    },
    uploadBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    helpText: { color: '#666', fontSize: 13, lineHeight: 20, marginBottom: 20 },

    exampleRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    exampleItem: { alignItems: 'center' },
    exampleBox: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    exampleText: { color: 'white', fontWeight: '700' },
    exampleLabel: { color: '#666', fontSize: 12 },

    colorPickerContainer: { marginVertical: 20 },
    colorGradient: { height: 200, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F5F5F5', justifyContent: 'center', padding: 20 },
    colorRow: { flexDirection: 'row', justifyContent: 'space-around' },
    colorSwatch: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: 'white' },

    countrySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 8,
        marginBottom: 30
    },
    countryText: { fontSize: 16, color: '#000' },

    radioOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    radioText: { fontSize: 16, color: '#000' },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#CCC',
        justifyContent: 'center',
        alignItems: 'center'
    },
    radioActive: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },

    nextBtn: {
        backgroundColor: '#1C1C1E',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20
    },
    nextBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

    submitBtn: {
        backgroundColor: '#1C1C1E',
        padding: 18,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 40
    },
    submitBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },

    successContainer: { backgroundColor: '#FFE5E5', padding: 40, borderRadius: 12, marginTop: 100 },
    successTitle: { fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 30, color: '#000' },
    successSubtitle: { fontSize: 16, fontWeight: '900', marginTop: 30, marginBottom: 10, color: '#000' },
    successText: { fontSize: 14, lineHeight: 22, color: '#333', textAlign: 'center' }
});
