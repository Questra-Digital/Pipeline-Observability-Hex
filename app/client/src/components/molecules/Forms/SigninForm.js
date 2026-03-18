"use client";
import { useState } from "react";
import LinkAtom from "@/components/atoms/LinkAtom";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import instance from "@/axios/axios";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addUser } from "@/redux/features/user/userSlice";

const LoginForm = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        const response = await instance.post('/api/signin', { email, password });
        const token = response.data.token;
        if (response.data.message === "User signed in successfully") {
          setEmail("");
          setPassword("");
          const newUser = {
            email: email,
            token: token
          }
          dispatch(addUser(newUser));
          SuccessToast('Authentication Successful');
          router.push('/home');
        }
      } catch (error) {
        if (error?.response?.data?.error)
          ErrorToast(error.response.data.error);
        else
          ErrorToast('Authentication failed. Please verify credentials.')
      }
    } else {
      WarningToast("Please complete all required fields.");
    }
  };

  return (
    <div className="w-full flex flex-col font-Ubuntu">
      <div className="mb-8">
        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Welcome Back</h3>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Please sign in to your accounts</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Password</label>
            <LinkAtom
              link={"/resetPassword"}
              text={"Recover Key"}
              properties="text-[10px] text-red-600 hover:text-red-500 font-black uppercase tracking-widest transition-colors"
            />
          </div>
          <input
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder-gray-700 outline-none focus:border-red-600/40 transition-all duration-500 font-mono"
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-red-600 hover:bg-red-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-red-600/10 active:scale-95 mt-4"
          type="submit"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};

export default LoginForm;