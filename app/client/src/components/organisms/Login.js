"use client";
import { useState } from "react";
// Assuming these are the components for your forms and back button
import LoginForm from "../molecules/Forms/SigninForm";
import SignupForm from "../molecules/Forms/SignupForm";
import BackButton from "../atoms/BackButton";

const Login = () => {
  const [form, setForm] = useState("signin");

  const toggleForm = () => {
    setForm(form === "signin" ? "signup" : "signin");
  };

  return (
    // Outer Container: Dark background covering the full screen
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-blue-950 px-4">
      {/* BackButton remains accessible */}
      <BackButton />

      {/* Main Content Area: Increased max-w-7xl for a wider overall layout */}
      <div className="md:w-[80%] max-w-7xl w-full flex justify-center self-center py-10">
        
        {/* Left side: Video display (Wider space for visual content) */}
        <div className="hidden w-0 lg:w-1/2 lg:flex justify-center items-center p-8">
          <video
            width="450px"
            autoPlay
            muted
            loop
            className="object-cover rounded-2xl shadow-2xl border border-gray-800"
          >
            <source
              src="http://localhost:1337/uploads/animation_8ada309af0.webm"
              type="video/webm"
            />
            Your browser does not support the video tag.
          </video>
        </div>
        
        {/* Right side: Login/Signup Form container */}
        <div className="w-full lg:w-1/2 flex justify-center items-center">

          <div className="relative w-full max-w-lg bg-gray-950/70 backdrop-blur-lg border border-gray-800 rounded-2xl p-10 shadow-lg">
            
            {form === "signin" ? (
              <LoginForm>
                <div className="mt-4 text-center">
                  <span className="text-gray-400 font-Ubuntu mx-2">
                    {"Don't Have an Account?"}
                  </span>
                  <button className="text-blue-400 underline hover:text-cyan-400 transition" onClick={toggleForm}>
                    SignUp
                  </button>
                </div>
              </LoginForm>
            ) : (
              <SignupForm>
                <div className="mt-4 text-center">
                  <span className="text-gray-400 font-Ubuntu mx-2">
                    {"Already Have an Account?"}
                  </span>
                  <button className="text-blue-400 underline hover:text-cyan-400 transition" onClick={toggleForm}>
                    SignIn
                  </button>
                </div>
              </SignupForm>
            )}
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;