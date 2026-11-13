import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '@/constants/theme';

type TextFieldProps = {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    error?: string;
    multiline?: boolean;
    maxLength?: number;
    editable?: boolean;
};

export function TextField({
    label, value, onChangeText, placeholder, error, multiline, maxLength, editable = true,
}: TextFieldProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={Colors.light.textSecondary}
                multiline={multiline}
                maxLength={maxLength}
                editable={editable}
                style={[styles.input, multiline && styles.multiline, error && styles.inputError]}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { gap: 7 },
    label: { color: Colors.light.text, fontSize: 14, fontWeight: '600' },
    input: { minHeight: 48, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 12, backgroundColor: Colors.light.card, color: Colors.light.text, fontSize: 14 },
    multiline: { minHeight: 120, textAlignVertical: 'top' },
    inputError: { borderColor: Colors.light.danger },
    error: { color: Colors.light.danger, fontSize: 12 },
});
