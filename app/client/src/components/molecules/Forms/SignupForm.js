"use client";
import { useState } from "react";
import instance from "@/axios/axios";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useRouter } from "next/navigation";

const SignupForm = () => {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const validateFields = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,}$/;
    const nameRegex = /^[a-zA-Z ]*$/;

    if (!emailRegex.test(email)) {
      ErrorToast('Invalid email address.');
      return false;
    }

    if (!passwordRegex.test(password)) {
      ErrorToast('Password must be 8+ characters with a letter, number, and symbol.');
      return false;
    }

    if (!nameRegex.test(name)) {
      ErrorToast('Name must contain only letters and spaces.');
      return false;
    }

    if (!nameRegex.test(companyName)) {
      ErrorToast('Company Name must contain only letters and spaces.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password && companyName && name && confirmPassword) {
      if (password === confirmPassword) {
        if (validateFields()) {
          try {
            const response = await instance.post("/api/signup", {
              name,
              email,
              companyName,
              password,
            });

            if (response.data.message === "User created successfully") {
              SuccessToast("Registration Successful");
              setEmail("");
              setPassword("");
              setCompanyName("");
              setName("");
              setConfirmPassword("");
              setTimeout(() => {
                window.location.reload(); // Reload to toggle back to signin or handled by parent state
              }, 2000);
            }
          } catch (error) {
            if (error?.response?.data?.error === "User already exists") {
              ErrorToast('User already exists in our records.');
            } else {
              ErrorToast('Registration failed. Please try again later.')
            }
          }
        }
      } else {
        WarningToast("Passwords do not match.");
      }
    } else {
      WarningToast("Please complete all required fields.");
    }
  };

  return (
    <div className="w-full flex flex-col font-Ubuntu">
      <div className="mb-8">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Create Account</h3>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Register a new platform account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Email Address</label>
          <input
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-700 outline-none focus:border-red-600/40 transition-all duration-500"
            placeholder="NAME@COMPANY.COM"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Full Name</label>
            <input
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-700 outline-none focus:border-red-600/40 transition-all duration-500 uppercase font-bold text-[10px]"
              placeholder="YOUR NAME"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Company</label>
            <input
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-700 outline-none focus:border-red-600/40 transition-all duration-500 uppercase font-bold text-[10px]"
              placeholder="ORGANIZATION"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Password</label>
            <input
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-700 outline-none focus:border-red-600/40 transition-all duration-500 font-mono"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest ml-1">Confirm Password</label>
            <input
              className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-700 outline-none focus:border-red-600/40 transition-all duration-500 font-mono"
              placeholder="••••••••"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-red-600/10 active:scale-95 mt-6"
          type="submit"
        >
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignupForm;