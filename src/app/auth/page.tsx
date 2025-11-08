'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) router.push('/');
    else alert(res?.error || 'Invalid credentials');

    setLoading(false);
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left side - Logo Section */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-b from-[#0A2463] to-[#1A3B8F] items-center justify-center relative">
        <img
          src="/logo-removebg-preview.png"
          alt="Mojad Fitness Logo"
          className="max-w-xs md:max-w-md object-contain animate-fadeIn"
        />
        <div className="absolute bottom-10 text-white text-center px-4">
          <h2 className="text-3xl font-semibold">Mojad Fitness</h2>
          <p className="text-base opacity-80 mt-1">
            Empowering your fitness journey every day
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-gray-50">
        <form
          onSubmit={handleSubmit}
          className="p-10 bg-white rounded-2xl shadow-2xl w-140 max-w-2xl h-105 space-y-6"
        >
          <h1 className="text-5xl font-bold text-[#0A2463] text-center mb-4">
            Welcome Back
          </h1>
          <p className="text-center text-gray-500 text-xl mb-6">
            Enter your credentials to access your dashboard
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-300 p-3 rounded-xl w-full text-lg focus:outline-none focus:ring-2 focus:ring-[#0A2463] transition"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 p-3 pr-12 rounded-xl w-full text-lg focus:outline-none focus:ring-2 focus:ring-[#0A2463] transition"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-semibold text-white text-lg transition-all duration-300 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#0A2463] hover:bg-[#0F3C78] shadow-md hover:shadow-lg'
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>
      </div>
    </div>
  );
}
