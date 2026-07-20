"use client";

import React from "react";

export type FundiExpression = "default" | "thinking" | "sad" | "celebrating";

export function FundiCharacter({
  expression = "default",
  size = 100,
  style: extraStyle = {},
}: {
  expression?: FundiExpression;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={`/characters/fundi-${expression}.png`}
      alt={`Fundi ${expression}`}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block", ...extraStyle }}
    />
  );
}
