"use client";
import instance from "@/axios/axios";
import { ErrorToast, SuccessToast, WarningToast } from "@/components/atoms/toastUtils/Toast";
import { useState } from "react";

const ResetPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [newPassword, setnewPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email && newPassword) {
      try {
        
        const response = await instance.post("/api/forgetpass", {email, newPassword});
      if(response.status === 200){
        SuccessToast("Password reset successful");
        setEmail("");
        setnewPassword("");
      } else {
        ErrorToast("Password reset failed");
      }
      } catch (error) {
        console.error("Error resetting password", error.message);
        ErrorToast("Password reset failed"); 
      }
    } else {
      WarningToast("Must fill all fields");
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center px-5 lg:px-15 xl:px-20">
      <div className="justify-center  items-center flex flex-col w-[85%] sm:w-[60%] md:w-[45%] lg:w-[40%] border p-12 rounded-lg border-gray-700 shadow shadow-blue-700">
        <div className="font-Ubuntu w-full">
          <h1 className="text-3xl font-semibold">Stuck outside?</h1>
          <p className="text-gray-400">
          We'll get you back inside. Reset your password.
          </p>
        </div>
        <form
          action=""
          onSubmit={handleSubmit}
          className="flex flex-col mt-5 w-full items-center font-Ubuntu"
        >
          <div className="w-[100%] flex flex-col my-3">
            <label htmlFor="email" className="my-2">
              Registered Email
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

          <div className="w-[100%] flex flex-col mb-5">
            <label htmlFor="newPassword" className="my-2">
              New Password
            </label>
            <input
              className="border-2 w-full p-2 h-12 outline-none bg-transparent rounded-lg border-gray-400 focus:border-purple-600"
              placeholder="********"
              type="password"
              name=""
              value={newPassword}
              onChange={(e) => setnewPassword(e.target.value)}
            />
          </div>
          <input
            className="bg-gradient-to-br from-red-600 to-purple-700 w-full text-white text-lg px-7 py-2 my-5 rounded cursor-pointer"
            type="submit"
            value="RESET"
          />
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
