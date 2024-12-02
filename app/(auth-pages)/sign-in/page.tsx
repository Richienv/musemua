"use client";

import { signInAction, signInAsStreamerAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

export default function Login({ searchParams }: { searchParams: Message }) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningInAsStreamer, setIsSigningInAsStreamer] = useState(false);
  const [showStreamerLogin, setShowStreamerLogin] = useState(false);

  const handleSignIn = async (formData: FormData) => {
    setIsSigningIn(true);
    await signInAction(formData);
    setIsSigningIn(false);
  };

  const handleSignInAsStreamer = async (formData: FormData) => {
    setIsSigningInAsStreamer(true);
    await signInAsStreamerAction(formData);
    setIsSigningInAsStreamer(false);
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Logo for mobile */}
      <div className="mb-8 flex justify-center lg:hidden">
        <Image
          src="/images/salda.png"
          alt="Salda Logo"
          width={150}
          height={150}
          className="brightness-0 invert"
        />
      </div>

      {!showStreamerLogin ? (
        <div className="overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Client Login Form */}
          <div className="px-6 py-8 sm:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Selamat Datang Kembali</h1>
              <p className="mt-2 text-gray-600">
                Belum punya akun?{" "}
                <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-medium">
                  Daftar disini
                </Link>
              </p>
            </div>

            <form className="space-y-5">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-gray-700">Alamat Email</Label>
                <Input 
                  name="email" 
                  placeholder="nama@contoh.com" 
                  required 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700">Kata Sandi</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <Input
                  type="password"
                  name="password"
                  placeholder="Masukkan kata sandi"
                  required
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-5">
                <Button 
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.closest('form');
                    if (form) handleSignIn(new FormData(form));
                  }}
                  disabled={isSigningIn}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {isSigningIn ? "Sedang Masuk..." : "Masuk"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Atau</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowStreamerLogin(true)}
                  className="w-full h-11 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Masuk sebagai Streamer
                </Button>
              </div>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl">
          {/* Streamer Login Form */}
          <div className="px-6 py-8 sm:px-8">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                Masuk Streamer
              </h1>
              <p className="mt-2 text-gray-600">
                Ingin menjadi streamer?{" "}
                <Link href="/streamer-sign-up" className="text-red-600 hover:text-red-700 font-medium">
                  Daftar disini
                </Link>
              </p>
            </div>

            <form className="space-y-5">
              <div className="space-y-1">
                <Label htmlFor="streamerEmail" className="text-gray-700">Alamat Email</Label>
                <Input 
                  name="email" 
                  placeholder="nama@contoh.com" 
                  required 
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="streamerPassword" className="text-gray-700">Kata Sandi</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <Input
                  type="password"
                  name="password"
                  placeholder="Masukkan kata sandi"
                  required
                  className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
                />
              </div>

              <Button 
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget.closest('form');
                  if (form) handleSignInAsStreamer(new FormData(form));
                }}
                disabled={isSigningInAsStreamer}
                className="w-full h-11 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 transition-all duration-200"
              >
                {isSigningInAsStreamer ? "Sedang Masuk..." : "Masuk sebagai Streamer"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowStreamerLogin(false)}
                className="w-full h-11 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                Kembali ke Masuk Client
              </Button>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
