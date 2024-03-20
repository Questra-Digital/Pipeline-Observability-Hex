"use client";
import { TypeAnimation } from "react-type-animation";
import { useState } from "react";

const Typerwriter = () => {
  const [textColor, setTextColor] = useState("#C8D6EF");

  return (
    <>
      <div
        style={{
          fontSize: "35px",
          color: textColor,
          marginLeft: '20px'
        }}
        className="font-Ubuntu"
      >
        <TypeAnimation
          sequence={[
            "> Monitoring",
            1500,
            "> Observability",
            1500,
            "> Alerts",
            1500,
            "> Anomly Detection",
            1500,
            "> Multi-Platform Integration",
            1500,
            "> Data Visualization",
            1500,
            () => {
              console.log("Sequence completed");
            },
          ]}
          repeat={Infinity}
          style={{ fontSize: '.7em', display: 'block', minHeight:'70px' }}
        />
      </div>
    </>
  );
};

export default Typerwriter;
