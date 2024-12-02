export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-gray-800/80 to-gray-900/80">
      <div className="absolute inset-0 bg-[url('/images/bg-sign-in.png')] bg-cover bg-center mix-blend-overlay opacity-70" />
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  );
}
