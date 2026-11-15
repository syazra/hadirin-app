export type InputIdentitas = {
    nama: string;
    nim: string;
};

export type InputRegistrasi = InputIdentitas & {
    email: string;
    password: string;
};

export function validasiIdentitas(input: InputIdentitas): string | null {
    const nama = input.nama.trim();
    const nim = input.nim.trim();

    if (!nama || nama.length > 100) {
        return 'Nama wajib diisi dan maksimal 100 karakter.';
    }

    if (!nim || nim.length > 32) {
        return 'NIM wajib diisi dan maksimal 32 karakter.';
    }

    return null;
}

export function validasiEmail(email: string): string | null {
    const emailBersih = email.trim();

    if (!emailBersih) {
        return 'Email wajib diisi.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailBersih)) {
        return 'Format email tidak valid.';
    }

    return null;
}

export function validasiPassword(password: string): string | null {
    if (!password) {
        return 'Kata sandi wajib diisi.';
    }

    if (password.length < 6) {
        return 'Kata sandi minimal 6 karakter.';
    }

    return null;
}

export function validasiLogin(
    email: string,
    password: string,
): string | null {
    return validasiEmail(email) ?? (!password ? 'Kata sandi wajib diisi.' : null);
}

export function validasiRegistrasi(input: InputRegistrasi): string | null {
    return (
        validasiIdentitas(input) ??
        validasiEmail(input.email) ??
        validasiPassword(input.password)
    );
}

export function normalisasiEmail(email: string): string {
    return email.trim().toLowerCase();
}
