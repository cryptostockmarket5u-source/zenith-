import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type SortOption = 'members_desc' | 'members_asc' | 'name_asc' | 'name_desc' | 'country_asc' | 'country_desc';

interface FilterSortModalProps {
    visible: boolean;
    onClose: () => void;
    type: 'filter' | 'sort';
    activeOption: string;
    onSelect: (option: any) => void;
    countries?: string[];
}

export default function FilterSortModal({ visible, onClose, type, activeOption, onSelect, countries = [] }: FilterSortModalProps) {
    const sortOptions = [
        { label: 'Members (High to Low)', value: 'members_desc' },
        { label: 'Members (Low to High)', value: 'members_asc' },
        { label: 'Name (A to Z)', value: 'name_asc' },
        { label: 'Name (Z to A)', value: 'name_desc' },
        { label: 'Country (A to Z)', value: 'country_asc' },
        { label: 'Country (Z to A)', value: 'country_desc' },
    ];

    const handleSelect = (value: string) => {
        Haptics.selectionAsync();
        onSelect(value);
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.dismissArea} onPress={onClose} />
                <View style={styles.sheet}>
                    <View style={styles.header}>
                        <View style={styles.indicator} />
                        <Text style={styles.title}>{type === 'sort' ? 'Sort by' : 'Filter by Country'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        {type === 'sort' ? (
                            sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={[styles.option, activeOption === option.value && styles.optionSelected]}
                                    onPress={() => handleSelect(option.value)}
                                >
                                    <Text style={[styles.optionText, activeOption === option.value && styles.optionTextSelected]}>
                                        {option.label}
                                    </Text>
                                    {activeOption === option.value && (
                                        <Ionicons name="checkmark" size={20} color="#CCFF00" />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={[styles.option, activeOption === 'All' && styles.optionSelected]}
                                    onPress={() => handleSelect('All')}
                                >
                                    <Text style={[styles.optionText, activeOption === 'All' && styles.optionTextSelected]}>All Countries</Text>
                                    {activeOption === 'All' && (
                                        <Ionicons name="checkmark" size={20} color="#CCFF00" />
                                    )}
                                </TouchableOpacity>
                                {countries.map((country) => (
                                    <TouchableOpacity
                                        key={country}
                                        style={[styles.option, activeOption === country && styles.optionSelected]}
                                        onPress={() => handleSelect(country)}
                                    >
                                        <Text style={[styles.optionText, activeOption === country && styles.optionTextSelected]}>{country}</Text>
                                        {activeOption === country && (
                                            <Ionicons name="checkmark" size={20} color="#CCFF00" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    sheet: {
        backgroundColor: '#000000',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        height: SCREEN_HEIGHT * 0.9,
        paddingTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    header: {
        alignItems: 'center',
        paddingBottom: 24,
    },
    indicator: {
        width: 36,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        marginBottom: 20,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    closeBtn: {
        position: 'absolute',
        right: 20,
        top: -4,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    optionSelected: {
        backgroundColor: 'rgba(204, 255, 0, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(204, 255, 0, 0.3)',
    },
    optionText: {
        color: '#8E8E93',
        fontSize: 16,
        fontWeight: '600',
    },
    optionTextSelected: {
        color: '#CCFF00',
        fontWeight: '700',
    },
});
