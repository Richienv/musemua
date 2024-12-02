import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

export default function ForgotPassword({
  searchParams,
}: {
  searchParams: Message;
}) {
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
            width={150}
            height={150}
            className="brightness-0 invert"
          />
        </div>
      </section>

      {/* Right Section */}
      <section className="w-full lg:w-[40%] xl:w-[35%] bg-white">
        <div className="h-full flex flex-col justify-center px-8 lg:px-16">
          <div className="lg:hidden mb-12">
            <Image
              src="/images/salda.png"
              alt="Salda Logo"
              width={150}
              height={150}
            />
          </div>

          <div className="w-full">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-gray-900">Reset Kata Sandi</h1>
              <p className="text-gray-600 mt-2">
                Sudah ingat kata sandi?{" "}
                <Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-medium">
                  Masuk disini
                </Link>
              </p>
            </div>

            <form className="space-y-6">
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

              <SubmitButton 
                formAction={forgotPasswordAction}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Reset Kata Sandi
              </SubmitButton>

              <FormMessage message={searchParams} />
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
