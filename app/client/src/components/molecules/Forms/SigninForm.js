"use client";
import { useState } from "react";
import LinkAtom from "@/components/atoms/LinkAtom";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import instance from "@/axios/axios";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addUser } from "@/redux/features/user/userSlice";

const LoginForm = ({children}) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const user = useSelector((state) => state.user);
  console.log(user);


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        const response = await instance.post('/api/signin', {email, password});
        const token = response.data.token;
        if(response.data.message === "User signed in successfully"){
          setEmail("");
          setPassword("");
          const newUser = {
            email: email,
            token: token
          }
          dispatch(addUser(newUser));
          SuccessToast('Signin Successful!');
            router.push('/home');
        }
      } catch (error) {
        if(error?.response?.data?.error)
          ErrorToast(error.response.data.error);
        else
          ErrorToast('We are facing some issue. Try Again!')
      }
    } else {
      WarningToast("Must fill all fields!");
    }
  };

  return (
    // Removed overly complex width classes. Inherit width from parent.
    // Adjusted padding for a cleaner look.
    <div className="w-full flex flex-col justify-center items-center px-0">
      
      {/* Header text updated for dark theme */}
      <div className="font-Ubuntu self-start mb-6 w-full">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Get Started Now
        </h1>
        <p className="text-gray-400 mt-1">
          Enter your credentials to access your account
        </p>
      </div>
      
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full items-center font-Ubuntu"
      >
        <div className="w-full flex flex-col my-3">
          {/* Label updated to be light gray */}
          <label htmlFor="email" className="my-2 text-gray-300 font-semibold text-sm">
            Email
          </label>
          <input
            // Input styling updated for dark background, subtle border, and white text
            className="w-full px-4 py-3 h-12 outline-none rounded-lg 
                       bg-gray-900/80 border border-gray-800 text-white 
                       placeholder-gray-600 focus:ring-2 focus:ring-blue-500 transition"
            placeholder="example@gmail.com"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="w-full flex flex-col my-3">
          {/* Label updated to be light gray */}
          <label htmlFor="password" className="my-2 text-gray-300 font-semibold text-sm">
            Password
          </label>
          <input
            // Input styling updated for dark background, subtle border, and white text
            className="w-full px-4 py-3 h-12 outline-none rounded-lg 
                       bg-gray-900/80 border border-gray-800 text-white 
                       placeholder-gray-600 focus:ring-2 focus:ring-blue-500 transition"
            placeholder="••••••••"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        {/* Forget Password link styling fix */}
        <div className="w-full flex justify-end mb-4">
          <LinkAtom
            link={"/resetPassword"}
            text={"Forget Password?"}
            // Updated link color for visibility against the dark background
            properties="text-blue-400 hover:text-cyan-300 transition underline"
          />
        </div>
        
        <input
          // Button styling updated for hover effect and gradient color match
          className="bg-gradient-to-r from-blue-600 to-cyan-500 w-full text-white 
                     text-lg px-7 py-3 my-5 rounded-lg font-semibold 
                     hover:opacity-90 transition cursor-pointer"
          type="submit"
          value="LOGIN"
        />
      </form>
      {children}
    </div>
  );
};

export default LoginForm;