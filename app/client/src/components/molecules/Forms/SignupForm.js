"use client";
import { useState } from "react";
import instance from "@/axios/axios";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useRouter } from "next/navigation";

const SignupForm = ({ children }) => {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  // --- API and Validation Logic (Unchanged) ---
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

            console.log(response);
            if (response.data.message === "User created successfully") {
              SuccessToast("Account Created Successfully!");
              setEmail("");
              setPassword("");
              setCompanyName("");
              setName("");
              setConfirmPassword("");
              setTimeout(() => {
                router.push('/login');
              }, 2000);
            }
          } catch (error) {
            if (error?.response?.data?.error === "User already exists") {
              ErrorToast('User Already Exist!')
            } else {
              ErrorToast('We are facing some issue. Try Again!')
            }
          }
        }
      } else {
        WarningToast("Password and Confirm Password must be same!");
      }
    } else {
      WarningToast("Must fill all fields!");
    }
  };

  const validateFields = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // NOTE: This is a strict password regex requiring letters, numbers, and symbols.
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,}$/;
    const nameRegex = /^[a-zA-Z ]*$/;

    if (!emailRegex.test(email)) {
      ErrorToast('Invalid Email!');
      return false;
    }

    if (!passwordRegex.test(password)) {
      ErrorToast('Password should be at least 8 characters long and contain at least one letter, one number, and one symbol!');
      return false;
    }

    if (!nameRegex.test(name)) {
      ErrorToast('Name should contain letters and spaces only!');
      return false;
    }

    if (!nameRegex.test(companyName)) {
      ErrorToast('Company Name should contain letters and spaces only!');
      return false;
    }

    return true;
  };
  // --- End API and Validation Logic ---

  
  return (
    // 1. WIDTH FIX: Removed restrictive width classes, setting it to full width.
    <div className="w-full flex flex-col justify-center items-center px-0">
      
      {/* Header text updated for dark theme */}
      <div className="font-Ubuntu self-start mb-6 w-full">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Join us Today!
        </h1>
        <p className="text-gray-400 mt-1">
          Create account to become a member
        </p>
      </div>
      
      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full items-center font-Ubuntu"
      >
        {/* Email Field - Full Width */}
        <div className="w-full flex flex-col my-3">
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
            id="email" // Added missing ID for better accessibility
          />
        </div>

        {/* Name and Company Name - Split Row */}
        <div className="w-full flex flex-col md:flex-row my-3 space-y-3 md:space-y-0 md:space-x-4">
          
          <div className="w-full md:w-1/2">
            <label htmlFor="name" className="my-2 text-gray-300 font-semibold text-sm">
              Full Name
            </label>
            <input
              className="w-full px-4 py-3 h-12 outline-none rounded-lg 
                       bg-gray-900/80 border border-gray-800 text-white 
                       placeholder-gray-600 focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Full Name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id="name"
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <label htmlFor="companyName" className="my-2 text-gray-300 font-semibold text-sm">
              Company Name
            </label>
            <input
              className="w-full px-4 py-3 h-12 outline-none rounded-lg 
                       bg-gray-900/80 border border-gray-800 text-white 
                       placeholder-gray-600 focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Datalogs"
              type="text"
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              id="companyName"
            />
          </div>
        </div>

        {/* Password and Confirm Password - Split Row */}
        <div className="w-full flex flex-col md:flex-row my-3 space-y-3 md:space-y-0 md:space-x-4">
          
          <div className="w-full md:w-1/2">
            <label htmlFor="password" className="my-2 text-gray-300 font-semibold text-sm">
              Password
            </label>
            <input
              className="w-full px-4 py-3 h-12 outline-none rounded-lg 
                       bg-gray-900/80 border border-gray-800 text-white 
                       placeholder-gray-600 focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
            />
          </div>
          
          <div className="w-full md:w-1/2">
            <label htmlFor="confirmPassword" className="my-2 text-gray-300 font-semibold text-sm">
              Confirm Password
            </label>
            <input
              className="w-full px-4 py-3 h-12 outline-none rounded-lg 
                       bg-gray-900/80 border border-gray-800 text-white 
                       placeholder-gray-600 focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              id="confirmPassword"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <input
          // Button styling updated for hover effect and gradient color match
          className="bg-gradient-to-r from-blue-600 to-cyan-500 w-full text-white 
                     text-lg px-7 py-3 mt-8 mb-5 rounded-lg font-semibold 
                     hover:opacity-90 transition cursor-pointer"
          type="submit"
          value="SIGN UP"
        />
      </form>
      {children}
    </div>
  );
};

export default SignupForm;