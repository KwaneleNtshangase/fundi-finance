"use client";

import React from "react";

export type CosmoExpression = "default" | "thinking" | "sad" | "celebrating";

export function CosmoCharacter({
  expression = "default",
  size = 100,
  style: extraStyle = {},
}: {
  expression?: CosmoExpression;
  size?: number;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={`/characters/cosmo-${expression}.png`}
      alt={`Cosmo ${expression}`}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block", ...extraStyle }}
    />
  );
}
