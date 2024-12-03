"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/sign-up')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Syarat & Ketentuan</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-semibold mb-6">Syarat dan Ketentuan Penggunaan Salda</h2>
            
            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold mb-4">1. Ketentuan Umum</h3>
                <p className="text-gray-600 mb-4">
                  Dengan menggunakan platform Salda, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak setuju dengan syarat dan ketentuan ini, mohon untuk tidak menggunakan layanan kami.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">2. Definisi</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>"Platform" merujuk pada aplikasi dan website Salda</li>
                  <li>"Pengguna" adalah individu atau entitas yang menggunakan Platform</li>
                  <li>"Streamer" adalah penyedia layanan live streaming di Platform</li>
                  <li>"Klien" adalah pengguna yang menggunakan layanan Streamer</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">3. Penggunaan Platform</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Pengguna wajib berusia minimal 18 tahun</li>
                  <li>Informasi yang diberikan harus akurat dan lengkap</li>
                  <li>Dilarang menggunakan Platform untuk kegiatan ilegal</li>
                  <li>Wajib menjaga kerahasiaan akun dan password</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">4. Layanan Streaming</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Streamer wajib memberikan layanan sesuai kesepakatan</li>
                  <li>Pembatalan harus dilakukan sesuai kebijakan yang berlaku</li>
                  <li>Dilarang melakukan transaksi di luar Platform</li>
                  <li>Konten streaming harus sesuai dengan hukum yang berlaku</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">5. Pembayaran dan Biaya</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Semua pembayaran wajib melalui Platform</li>
                  <li>Biaya layanan sesuai dengan yang tercantum</li>
                  <li>Platform berhak memotong komisi sesuai kesepakatan</li>
                  <li>Pengembalian dana sesuai kebijakan yang berlaku</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">6. Hak Kekayaan Intelektual</h3>
                <p className="text-gray-600 mb-4">
                  Seluruh konten dan materi di Platform adalah milik Salda atau pemberi lisensinya. Pengguna dilarang menyalin, memodifikasi, atau mendistribusikan konten tanpa izin tertulis.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">7. Pembatasan Tanggung Jawab</h3>
                <p className="text-gray-600 mb-4">
                  Salda tidak bertanggung jawab atas kerugian yang timbul dari penggunaan Platform atau layanan yang disediakan oleh Streamer.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">8. Sanksi dan Penghentian</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600">
                  <li>Platform berhak memberikan sanksi atas pelanggaran</li>
                  <li>Akun dapat dinonaktifkan jika melanggar ketentuan</li>
                  <li>Pengguna dapat mengajukan banding atas sanksi</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">9. Perubahan Ketentuan</h3>
                <p className="text-gray-600 mb-4">
                  Salda berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui Platform dan berlaku sejak tanggal yang ditentukan.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-4">10. Hukum yang Berlaku</h3>
                <p className="text-gray-600 mb-4">
                  Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia. Setiap perselisihan akan diselesaikan melalui musyawarah atau pengadilan yang berwenang.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 