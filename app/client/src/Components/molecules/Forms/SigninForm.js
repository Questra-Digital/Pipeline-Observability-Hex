"use client";
import { useState } from "react";
import LinkAtom from "@/Components/atoms/LinkAtom";

const LoginForm = ({children}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      alert("Login");
    } else {
      alert("Must fill all fields");
    }
  };

  return (
    <div className="w-[100%] xl:w-[70] lg:w-[50%] flex flex-col justify-center items-center px-5 lg:px-15 xl:px-20">
      <div className="font-Ubuntu self-start">
        <h1 className="text-3xl font-semibold">Get Started Now</h1>
        <p className="text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>
      <form
        action=""
        onSubmit={handleSubmit}
        className="flex flex-col mt-5 w-[100%] items-center font-Ubuntu"
      >
        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="email" className="my-2">
            Email
          </label>
          <input
            className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="example@gmail.com"
            type="email"
            name=""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="w-[100%] flex flex-col my-3">
          <label htmlFor="password" className="my-2">
            Password
          </label>
          <input
            className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
            placeholder="********"
            type="password"
            name=""
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="w-full flex justify-end">
          <LinkAtom
            link={"/resetPassword"}
            text={"Forget Password?"}
            properties="underline"
          />
        </div>
        <input
          className="bg-gradient-to-br from-blue-600 to-purple-700 w-full text-white text-lg px-7 py-2 my-5 rounded cursor-pointer"
          type="submit"
          value="LOGIN"
        />
      </form>
        {children}
    </div>
  );
};

export default LoginForm;
