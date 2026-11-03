import React from "react";

const AntiCopyPattern = () => {
  return (
    <svg
      width="100%"
      height="100%"
      style={styles.svg}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id="antiCopyPattern"
          width="20"
          height="20"
          patternUnits="userSpaceOnUse"
        >
          <g fill="none" stroke="rgba(0, 102, 204, 0.2)" strokeWidth="1">
            <path d="M 10 0 L 20 10 L 10 20 L 0 10 Z" />
            <path d="M 5 0 L 15 10 L 5 20 L -5 10 Z" />
            <path d="M 15 0 L 25 10 L 15 20 L 5 10 Z" />
            <path d="M -5 0 L 5 10 L -5 20 L -15 10 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#antiCopyPattern)" />
    </svg>
  );
};

const styles = {
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    opacity: 0.9, // Adjust for visibility
    zIndex: 2, // Ensure it overlays the text
  },
};

export default AntiCopyPattern;
