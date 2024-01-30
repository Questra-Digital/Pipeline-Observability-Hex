"use client";
import { CategoryContext } from "@/context/CategoryContext";
import React, { useContext } from "react";

const CategoryCard = ({ cat }: any) => {
  const { category, changeCategory } = useContext(CategoryContext);

  return (
    <div
      className={`${
        cat.attributes.Title === category
          ? "bg-[#ffffff] text-black"
          : "bg-[#af8533]"
      } p-4 rounded-lg shadow-md cursor-pointer`}
      onClick={() => changeCategory(cat.attributes.Title)}
    >
      {cat.attributes.Title}
    </div>
  );
};

export default CategoryCard;
