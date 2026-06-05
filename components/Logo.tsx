import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
}

export default function Logo({ size = "md" }: LogoProps) {
  const width = size === "sm" ? 27 : size === "lg" ? 42 : 33;
  const height = size === "sm" ? 18 : size === "lg" ? 28 : 22;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "inline-block", verticalAlign: "middle" }}
    >
      {/* 'i' dot */}
      <circle cx="12" cy="8" r="4.5" fill="#3b82f6" />
      {/* 'i' stem */}
      <rect x="7.5" y="16" width="9" height="24" rx="4.5" fill="#3b82f6" />
      
      {/* 'd' loop */}
      <path
        d="M36 40C29.3726 40 24 34.6274 24 28C24 21.3726 29.3726 16 36 16"
        stroke="#3b82f6"
        strokeWidth="9"
        strokeLinecap="round"
      />
      {/* 'd' stem */}
      <rect x="36" y="4.5" width="9" height="35.5" rx="4.5" fill="#3b82f6" />
    </svg>
  );
}
