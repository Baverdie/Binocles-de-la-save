import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import path from "path";

export const alt = "Binocles de la Save - Opticien à Levignac";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoPath = path.join(process.cwd(), "public/logo/Full/bds-full.png");
  const logoData = readFileSync(logoPath);
  const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#E7DAC6",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          padding: "60px 80px",
        }}
      >
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          alt="Binocles de la Save"
          style={{ height: 180, objectFit: "contain" }}
        />

        {/* Separator */}
        <div
          style={{
            width: 48,
            height: 2,
            background: "#C48F50",
            borderRadius: 2,
          }}
        />

        {/* Tagline */}
        <p
          style={{
            color: "#412A1C",
            fontSize: 32,
            fontFamily: "serif",
            margin: 0,
            opacity: 0.6,
            letterSpacing: "0.05em",
          }}
        >
          Opticien indépendant à Levignac
        </p>
      </div>
    ),
    { ...size }
  );
}
