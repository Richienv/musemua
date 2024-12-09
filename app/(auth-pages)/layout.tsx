export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen w-full flex items-center justify-center relative p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 -z-10" />
      <div className="absolute inset-0 bg-grid-black/[0.02] -z-10" />
      {children}
    </main>
  );
}
