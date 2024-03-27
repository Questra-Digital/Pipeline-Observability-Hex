"use client";
import BackButton from "../atoms/BackButton";
import ImageAtom from "../atoms/ImageAtom";
import LinkAtom from "../atoms/LinkAtom";
import ResetPasswordForm from "../molecules/Forms/ResetPasswordForm";

const ResetPassword = () => {
  return (
    <div className="w-screen h-screen flex flex-col justify-center">
      <div className="mt-5 px-5 w-fit">
        <BackButton />
      </div>
      <ResetPasswordForm />
    </div>
  );
};

export default ResetPassword;
