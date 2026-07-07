import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "@/components/admin/LoginForm";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-background relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-saffron to-transparent"></div>
      
      <Card className="w-full max-w-md border-gold/20 shadow-xl bg-white/95 backdrop-blur z-10 animate-fade-in-up">
        <CardHeader className="text-center pb-6 border-b border-gold/10 bg-gradient-to-br from-saffron/5 to-transparent">
          <CardTitle className="font-serif text-3xl font-bold text-copper mb-2">GuruSeva</CardTitle>
          <CardDescription>Enter your credentials to access the temple admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
