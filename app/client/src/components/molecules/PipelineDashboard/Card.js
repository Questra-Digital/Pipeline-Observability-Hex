import { useState, useEffect } from "react";
import Tilt from "react-parallax-tilt";
import ImageAtom from "../../atoms/ImageAtom";
import TextAtom from "../../atoms/TextAtom";

function Card({ key, status, title, colors, imageURL }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Triggering the animation by setting isMounted to true after a delay
    const timeout = setTimeout(() => {
      setIsMounted(true);
    }, 500); // Adjust the delay time as needed

    // Cleanup function to clear the timeout
    return () => clearTimeout(timeout);
  }, []);

  // Check if colors exists and contains necessary properties
  const leftColor = colors?.leftColor || "#8B2BE2"; // Default color if not provided
  const betweenColor = colors?.betweenColor || "#5F15E2";
  const rightColor = colors?.rightColor || "#6C17E1";

  const cardStyle = {
    backgroundImage: `linear-gradient(to right, ${leftColor} 10%, ${betweenColor} 40%, ${rightColor} 90%)`,
    backgroundSize: "100% 100%",
    height: "150px",
    width: "250px",
    opacity: isMounted ? 1 : 0,
    transform: isMounted ? "translateX(0)" : "translateX(-50px)", // Slide-in effect
    transition: "opacity 0.8s ease-in-out, transform .8s ease-in-out", // Transition properties
  };

  return (
    <Tilt scale={1.2} glareMaxOpacity={1}>
      <div
        style={cardStyle}
        className="rounded-3xl flex flex-row justify-center items-center px-5 my-3"
      >
        <ImageAtom
          src={imageURL}
          alt={""}
          width={70}
          height={70}
          properties={["mr-3", "md:mr-5"]}
        />
        <div className="">
          <TextAtom
            properties={"text-2xl font-semibold font-Ubuntu capitalize"}
            text={status}
          />
          <TextAtom properties={"mt-3"} text={title} />
        </div>
      </div>
    </Tilt>
  );
}

export default Card;
