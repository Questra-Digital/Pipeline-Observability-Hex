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
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*_=+-]).{8,}$/;
    const nameRegex = /^[a-zA-Z ]*$/;

    if (!emailRegex.test(email)) {
      ErrorToast('Invalid Email!');
      return false;
    }

    if (!passwordRegex.test(password)) {
      ErrorToast('Password should be strong!');
      return false;
    }

    if (!nameRegex.test(name)) {
      ErrorToast('Name should contain letters only!');
      return false;
    }

    if (!nameRegex.test(companyName)) {
      ErrorToast('Company Name should contain letters only!');
      return false;
    }

    return true;
  };

  
  return (
    <div className="w-[100%] lg:w-[50%] flex flex-col justify-center items-center px-5 lg:px-15 xl:px-20">
      <div className="font-Ubuntu self-start">
        <h1 className="text-3xl font-semibold">Join us Today!</h1>
        <p className="text-gray-400">Create account to become a member</p>
      </div>
      <form
        action=""
        onSubmit={handleSubmit}
        className="flex flex-col mt-5 w-[100%] items-center font-Ubuntu"
      >
        <div className="w-[100%] flex flex-col my-2">
          <label htmlFor="email">Email</label>
          <input
            className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="example@gmail.com"
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            id=""
          />
        </div>
        <div className="w-[100%] flex flex-col md:flex-row my-2">
          <div className="w-full md:w-[50%] mr-3">
            <label htmlFor="name" className="my-2">
              Name
            </label>
            <input
              className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="Full Name"
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              id=""
            />
          </div>
          <div className="w-full md:w-[50%]">
            <label htmlFor="company" className="my-2">
              Company Name
            </label>
            <input
              className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="Datalogs"
              type="text"
              name="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              id=""
            />
          </div>
        </div>

        <div className="w-[100%] flex flex-col md:flex-row my-2">
          <div className="w-full md:w-[50%] mr-3">
            <label htmlFor="password" className="my-2">
              Password
            </label>
            <input
              className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="********"
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="w-full md:w-[50%]">
            <label htmlFor="confirmPassword" className="my-2">
              Confirm Password
            </label>
            <input
              className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="********"
              type="password"
              name=""
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <input
          className="bg-gradient-to-br from-blue-600 to-purple-700 w-full text-white text-lg px-7 py-2 my-5 rounded cursor-pointer"
          type="submit"
          value="SIGNUP"
        />
      </form>
      {children}
    </div>
  );
};

export default SignupForm;
