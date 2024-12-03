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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Upload, Check } from "lucide-react";

interface FileUploadResponse {
  url: string;
  error?: string;
}

const uploadFile = async (file: File): Promise<FileUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    return { url: '', error: 'Failed to upload file' };
  }
};

export default function Signup({ searchParams }: { searchParams: Message }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [productDoc, setProductDoc] = useState<File | null>(null);
  const [docError, setDocError] = useState('');

  useEffect(() => {
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setDocError('File size should not exceed 5MB');
        return;
      }
      // Check file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setDocError('Only PDF and DOC/DOCX files are allowed');
        return;
      }
      setProductDoc(file);
      setDocError('');
    }
  };

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
              <Label htmlFor="username" className="text-gray-700">Nama Brand</Label>
              <Input 
                name="username" 
                placeholder="Masukkan nama brand Anda" 
                required 
                className="h-11 bg-gray-50/50 border-gray-200 focus:bg-white"
              />
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
              <Label htmlFor="location" className="text-gray-700">Lokasi</Label>
              <Input 
                name="location" 
                type="text" 
                placeholder="Contoh: Jakarta, Surabaya, dll" 
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

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(value) => setAcceptedTerms(value)}
                className="mt-1"
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                >
                  Saya menyetujui{" "}
                  <Link 
                    href="/terms" 
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                    target="_blank"
                  >
                    persyaratan menggunakan aplikasi
                  </Link>
                  {" "}dan{" "}
                  <Link 
                    href="/privacy-notice" 
                    className="text-blue-600 hover:text-blue-700 font-medium underline"
                    target="_blank"
                  >
                    privacy agreement
                  </Link>
                  {" "}untuk menggunakan aplikasi ini
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="product_doc" className="text-gray-700">Brand Guideline PDF</Label>
              <div className="relative">
                <Input
                  type="file"
                  name="product_doc"
                  id="product_doc"
                  accept="application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleDocumentChange}
                  className="hidden"
                />
                <div 
                  onClick={() => document.getElementById('product_doc')?.click()}
                  className="cursor-pointer group flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/50"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
                    <span className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                      {productDoc ? productDoc.name : 'Click to upload Brand Guidelines'}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF or DOC up to 5MB
                    </p>
                  </div>
                </div>
              </div>
              {productDoc && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <Check className="h-4 w-4" />
                  File selected: {productDoc.name}
                </p>
              )}
              {docError && (
                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {docError}
                </p>
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
