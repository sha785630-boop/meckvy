import { ImageResponse } from "next/og";

export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(145deg, #12898c 0%, #0d6b6e 45%, #084e51 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: size * 0.17,
            right: size * 0.19,
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: "50%",
            background: "#f08a6c",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: size * 0.18,
            right: size * 0.18,
            bottom: size * 0.2,
            height: size * 0.035,
            borderRadius: size,
            background: "rgba(250, 248, 244, 0.55)",
          }}
        />
        <div
          style={{
            display: "flex",
            color: "#faf8f4",
            fontSize: size * 0.5,
            fontWeight: 800,
            letterSpacing: -size * 0.02,
            marginTop: -size * 0.04,
          }}
        >
          M
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=604800, immutable" },
    },
  );
}
