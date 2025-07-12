"use client";

import { useEffect, useState } from "react";
import { Navbar } from "./components/navbar";
import Hero from "./sections/hero/page";
import About from "./sections/about/page";
import Preview from "./sections/preview/page";
import FAQ from "./sections/faq/page";
import Wrapup from "./sections/wrapup/page";
import Footer from "./sections/footer/page";
import { useRouter } from "next/navigation";
import { MockAuth, MockAuthUser } from "@/utils/mock-auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<MockAuthUser | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      // Use mock authentication
      const currentUser = MockAuth.getCurrentUser();
      setUser(currentUser);
    };

    fetchUserData();
  }, []);

  return (
    <main className="flex flex-col min-h-screen bg-white w-full">
      <Hero />
      <Navbar />
      <Preview />
      <About />
      <Wrapup />
      <FAQ />
      <Footer />
    </main>
  );
}
