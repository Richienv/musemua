"use client";

import { signUpAction, checkUsernameAvailability } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="h-screen w-full flex">
      {/* Left Section */}
      <section className="hidden lg:block w-[60%] xl:w-[65%] relative">
        <div className="absolute inset-0 bg-black/10" />
        <Image
          src="/images/login.png"
          alt="Login background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute top-16 left-16">
          <Image
            src="/images/salda.png"
            alt="Salda Logo"
            width={120}
            height={120}
            className="brightness-0 invert"
          />
        </div>
      </section>

      {/* Right Section */}
      <section className="w-full lg:w-[40%] xl:w-[35%] bg-white">
        <div className="h-full flex flex-col justify-center px-8 lg:px-16 overflow-y-auto">
          <div className="lg:hidden mb-12">
            <Image
              src="/images/salda.png"
              alt="Salda Logo"
              width={90}
              height={90}
            />
          </div>

          <div className="w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">Buat Akun Baru</h1>
              <p className="text-gray-600 mt-2">
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
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="last_name" className="text-gray-700">Nama Belakang</Label>
                  <Input 
                    name="last_name" 
                    placeholder="Masukkan nama belakang" 
                    required 
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
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
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
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
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
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
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
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
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
                {!passwordsMatch && (
                  <p className="text-sm text-red-500 mt-1">Kata sandi tidak cocok</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="user_type" className="text-gray-700">Saya ingin bergabung sebagai</Label>
                <Select name="user_type" required>
                  <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white">
                    <SelectValue placeholder="Pilih tipe pengguna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="streamer">Streamer</SelectItem>
                  </SelectContent>
                </Select>
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
      </section>
    </div>
  );
}
