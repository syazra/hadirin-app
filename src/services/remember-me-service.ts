import * as SecureStore from 'expo-secure-store';

const KEY_REMEMBER_ME = 'hadirin.remember-me';

/**
 * Membaca preferensi Remember Me.
 * Default false jika belum pernah disimpan.
 */
export async function ambilRememberMe(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(KEY_REMEMBER_ME);
    return value === 'true';
}

/**
 * Menyimpan pilihan Remember Me.
 */
export async function simpanRememberMe(
    aktif: boolean,
): Promise<void> {
    await SecureStore.setItemAsync(
        KEY_REMEMBER_ME,
        aktif ? 'true' : 'false',
    );
}

/**
 * Menghapus preferensi Remember Me.
 */
export async function hapusRememberMe(): Promise<void> {
    await SecureStore.deleteItemAsync(KEY_REMEMBER_ME);
}