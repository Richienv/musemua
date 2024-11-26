"use client";

import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { ArrowRight, Star, Users, Shield } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface UserData {
  first_name: string;
  profile_picture_url: string;
}

// iPhone Mockup Component - You can reuse this for all sections
const IPhoneMockup = ({ imageSrc, altText, padding = "p-0" }: { imageSrc: string; altText: string; padding?: string }) => (
  <div className="relative mx-auto w-[300px] h-[600px]">
    <div className="absolute inset-0 bg-black rounded-[3rem] shadow-xl">
      <div className="absolute inset-[8px] bg-white rounded-[2.5rem] overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 inset-x-0 h-7 bg-black z-10 rounded-b-3xl" />
        {/* Screen Content */}
        <div className={`relative w-full h-full ${padding}`}>
          <Image
            src={imageSrc}
            alt={altText}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  </div>
);

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("users")
          .select("first_name, profile_picture_url")
          .eq("id", user.id)
          .single();
        setUserData(data);
      }
    };

    fetchUserData();
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Image
            src="/images/salda.png"
            alt="Salda Logo"
            width={90}
            height={90}
            className="brightness-0 invert"
          />
        </div>
      </nav>

      <main className="flex flex-col min-h-screen bg-white">
        {/* Updated Hero Section */}
        <section className="min-h-screen flex items-end justify-center bg-gradient-to-bl from-red-800 via-red-500 to-white rounded-3xl mx-4 my-4 pt-16 md:pt-32">
          <div className="container mx-auto px-4 pb-0">
            <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white px-4 leading-tight">
                Temukan Streamer
                <br />
                Favoritmu di{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-white">
                  Salda
                </span>
              </h1>
              <p className="text-lg md:text-xl text-white mb-8 max-w-2xl px-4">
                Platform yang menghubungkan kamu dengan streamer terbaik untuk pengalaman live streaming yang lebih interaktif.
              </p>
              <div className="mb-8 w-full max-w-xl px-4">
                <button 
                  onClick={() => router.push('/sign-in')}
                  className="px-8 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all hover:scale-105 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.2)]"
                >
                  Mulai Sekarang
                </button>
              </div>
              <div className="relative w-full max-w-3xl">
                <Image
                  src="/images/18.png"
                  alt="Hero Image"
                  width={600}
                  height={400}
                  className="rounded-2xl w-full"
                  priority
                />
                <div className="absolute top-[55%] -translate-y-[55%] -left-4 bg-white/95 p-4 rounded-xl max-w-xs backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] hidden md:block">
                  <p className="text-sm text-red-950">250+ Host Profesional Terverifikasi siap membantu</p>
                  <div className="flex items-center mt-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                    <span className="text-xs text-gray-700">Tim Salda Professional</span>
                  </div>
                </div>
                <div className="absolute top-[40%] -translate-y-[40%] right-4 bg-white/95 p-4 rounded-xl max-w-xs backdrop-blur-sm shadow-[0_4px_12px_-2px_rgba(0,0,0,0.12)] hidden md:block">
                  <p className="text-sm text-red-950">Tingkatkan penjualan hingga 10x lipat</p>
                  <div className="flex items-center mt-2">
                    <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
                    <span className="text-xs text-gray-700">Salda Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* iPhone Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <IPhoneMockup 
                imageSrc="/images/16.png"
                altText="Streaming demo"
              />

              {/* Content */}
              <div className="space-y-6 text-center lg:text-left">
                <h2 className="text-3xl lg:text-4xl font-bold">
                  Host Profesional untuk Livestream Anda
                </h2>
                <p className="text-lg text-gray-600">
                  Kami menyediakan host terlatih dan berpengalaman untuk membantu meningkatkan penjualan Anda di TikTok Shop dan Shopee Live. Dengan pengalaman dan keahlian mereka, tingkatkan engagement dan konversi penjualan Anda secara signifikan.
                </p>
                <ul className="space-y-4 text-gray-600">
                  <li className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-red-500" />
                    Host berpengalaman dan terverifikasi
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-red-500" />
                    Spesialis dalam meningkatkan engagement
                  </li>
                  <li className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-500" />
                    Jaminan keamanan dan profesionalitas
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About Salda Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="space-y-6">
                <div className="inline-block">
                  <h2 className="text-3xl lg:text-4xl font-bold mb-2">
                    Apa itu <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Salda</span>?
                  </h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-red-400 to-red-600" />
                </div>
                
                <p className="text-lg text-gray-600">
                  Salda adalah solusi inovatif yang dikembangkan oleh Trollife, sebuah agensi terpercaya dengan pengalaman lebih dari 5 tahun dalam industri live streaming commerce.
                </p>

                <div className="grid grid-cols-2 gap-6 py-6">
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-red-500">250+</h3>
                    <p className="text-gray-600">Host Profesional Terverifikasi</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-red-500">200+</h3>
                    <p className="text-gray-600">Brand Terpercaya</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-red-500">10x</h3>
                    <p className="text-gray-600">Peningkatan Revenue</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-bold text-red-500">5+</h3>
                    <p className="text-gray-600">Tahun Pengalaman</p>
                  </div>
                </div>

                <p className="text-gray-600">
                  Dipercaya oleh berbagai brand ternama, Salda telah membantu meningkatkan pendapatan brand hingga 10 kali lipat melalui layanan live streaming commerce yang profesional dan terukur.
                </p>
              </div>

              <IPhoneMockup 
                imageSrc="/images/salda.png"
                altText="Salda Logo"
                padding="p-8"
              />
            </div>
          </div>
        </section>

        {/* How to Use Salda Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Cara Menggunakan <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Salda</span>
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Platform yang mudah digunakan untuk menghubungkan Anda dengan streamer profesional
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
              {/* Step 1: Choose & Verify */}
              <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-2xl font-bold">Pilih & Verifikasi</h3>
                <p className="text-gray-600">
                  Pilih streamer yang sesuai dengan kebutuhan Anda. Lakukan verifikasi akun melalui Trollife untuk mendapatkan akses penuh ke platform kami.
                </p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Verifikasi cepat dan aman
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Pilihan streamer terverifikasi
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Profil lengkap dan portofolio
                  </li>
                </ul>
              </div>
              
              <IPhoneMockup 
                imageSrc="/images/step1.png"
                altText="Choose & Verify"
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-20 items-center mb-20">
              {/* Step 2: Book */}
              <IPhoneMockup 
                imageSrc="/images/step2.png"
                altText="Book a Streamer"
              />

              <div className="space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-2xl font-bold">Pilih Paket & Jadwal</h3>
                <p className="text-gray-600">
                  Tentukan durasi streaming sesuai kebutuhan Anda. Tersedia pilihan paket per jam atau paket khusus dengan harga kompetitif.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">Paket Per Jam</h4>
                    <p className="text-sm text-gray-600">Fleksibel sesuai kebutuhan</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <h4 className="font-semibold mb-2">Paket Khusus</h4>
                    <p className="text-sm text-gray-600">Harga lebih hemat</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Step 3: Stream */}
              <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-2xl font-bold">Mulai Streaming</h3>
                <p className="text-gray-600">
                  Setelah booking dikonfirmasi, streamer akan melakukan sesi live streaming sesuai jadwal. Nikmati layanan profesional dengan jaminan kualitas.
                </p>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h4 className="font-semibold mb-4">Keunggulan Platform</h4>
                  <ul className="space-y-3 text-gray-600">
                    <li className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-red-500" />
                      Platform terpercaya
                    </li>
                    <li className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-red-500" />
                      Streamer berkualitas
                    </li>
                    <li className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-red-500" />
                      Dukungan 24/7
                    </li>
                  </ul>
                </div>
              </div>

              <IPhoneMockup 
                imageSrc="/images/step3.png"
                altText="Start Streaming"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-blue-900 to-blue-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-10" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center text-white">
              <h2 className="text-4xl font-bold mb-6">
                Siap Untuk Memulai Pengalaman Streaming Terbaik?
              </h2>
              <p className="text-xl text-gray-200 mb-10">
                Bergabung dengan Salda sekarang dan nikmati pengalaman live streaming yang lebih interaktif
              </p>
              <Button 
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white px-12 h-12 rounded-full"
                onClick={() => router.push('/sign-in')}
              >
                Mulai Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
