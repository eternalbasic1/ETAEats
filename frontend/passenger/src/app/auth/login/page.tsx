"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const { requestOTP, loading } = useAuth();

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated) router.replace("/home");
  }, [hasHydrated, isAuthenticated, router]);

  async function handleContinue() {
    const normalized = phone.replace(/\D/g, "").slice(0, 10);
    if (normalized.length !== 10) return;
    const ok = await requestOTP(`+91${normalized}`);
    if (!ok) return;
    toast.success("OTP sent");
    router.push(`/auth/otp?phone=${normalized}`);
  }

  return (
    <div className="min-h-screen bg-bg px-6 py-10 flex flex-col">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex flex-col items-center text-center">
          <img
            src="/brand/Gemini_Generated_Image_yfra66yfra66yfra.png"
            alt="ETAEats logo"
            className="h-36 w-46 object-contain"
          />
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-e2">
          <h1 className="text-[28px] leading-[34px] font-semibold tracking-tight text-text-primary">
            Welcome Back
          </h1>
          <p className="text-sm text-text-secondary mt-2">
            Login with your mobile number
          </p>

          <label className="block mt-6 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            Mobile Number
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface2 px-4 py-3.5 focus-within:border-border-strong">
            <span className="text-sm font-medium text-text-secondary">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="10-digit number"
              className="w-full bg-transparent text-base text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </div>

          <Button
            className="w-full mt-6"
            onClick={handleContinue}
            loading={loading}
            disabled={phone.length < 10 || loading}
          >
            Continue
          </Button>

          <p className="mt-4 text-xs text-text-secondary text-center">
            By continuing you agree to secure OTP verification for your ETAEats
            account.
          </p>
        </div>
      </div>
    </div>
  );
}
