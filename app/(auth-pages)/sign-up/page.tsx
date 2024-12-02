"use client";

import { signUpAction, checkUsernameAvailability } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { debounce } from "lodash";
import Image from "next/image";

export default function Signup({ searchParams }: { searchParams: Message }) {
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }
      try {
        const result = await checkUsernameAvailability(username);
        setUsernameAvailable(result.available);
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameAvailable(null);
      }
    }, 300),
    []
  );

  useEffect(() => {
    checkUsername(username);
  }, [username, checkUsername]);

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  return (
    <div className="w-full max-w-[480px]">
      <div className="mb-8 flex justify-center lg:hidden">
        <Image
          src="/images/salda.png"
          alt="Salda Logo"
          width={150}
          height={150}
          className="brightness-0 invert"
        />
      </div>

      <div className="overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="px-6 py-8 sm:px-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Buat Akun Baru</h1>
            <p className="mt-2 text-gray-600">
              Sudah punya akun?{" "}
              <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
                Masuk disini
              </Link>
            </p>
          </div>

          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="first_name" className="text-gray-700">Nama Depan</Label>
                <Input 
                  name="first_name" 
                  placeholder="Masukkan nama depan" 
                  required 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="last_name" className="text-gray-700">Nama Belakang</Label>
                <Input 
                  name="last_name" 
                  placeholder="Masukkan nama belakang" 
                  required 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="username" className="text-gray-700">Nama Pengguna</Label>
              <Input 
                name="username" 
                placeholder="Pilih nama pengguna" 
                required 
                minLength={3}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
              {username.length >= 3 && (
                <p className={`text-sm mt-1 ${
                  usernameAvailable === null ? 'text-gray-500' :
                  usernameAvailable ? 'text-green-500' : 'text-red-500'
                }`}>
                  {usernameAvailable === null
                    ? 'Memeriksa nama pengguna...'
                    : usernameAvailable
                    ? 'Nama pengguna tersedia'
                    : 'Nama pengguna sudah digunakan'}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-gray-700">Alamat Email</Label>
              <Input 
                name="email" 
                type="email" 
                placeholder="nama@contoh.com" 
                required 
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-gray-700">Kata Sandi</Label>
              <Input
                type="password"
                name="password"
                placeholder="Buat kata sandi"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm_password" className="text-gray-700">Konfirmasi Kata Sandi</Label>
              <Input
                type="password"
                name="confirm_password"
                placeholder="Konfirmasi kata sandi"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
              {!passwordsMatch && (
                <p className="text-sm text-red-500 mt-1">Kata sandi tidak cocok</p>
              )}
            </div>

            <div className="pt-2">
              <SubmitButton 
                formAction={signUpAction} 
                pendingText="Membuat akun..."
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Buat Akun
              </SubmitButton>
            </div>

            <FormMessage message={searchParams} />
          </form>
        </div>
      </div>
    </div>
  );
}
