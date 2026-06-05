import Link from "next/link";

export default function RootNotFound() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        gap: "1rem",
      }}
    >
      <p
        style={{
          fontSize: "clamp(6rem, 15vw, 10rem)",
          fontWeight: 800,
          margin: 0,
          lineHeight: 1,
          color: "hsl(227, 72%, 21%)",
          opacity: 0.15,
        }}
      >
        404
      </p>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
        Page not found
      </h1>
      <p style={{ color: "#555", margin: 0 }}>
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "1rem",
          padding: "0.75rem 2rem",
          background: "hsl(227, 72%, 21%)",
          color: "#fff",
          borderRadius: "0.5rem",
          textDecoration: "none",
          fontWeight: 600,
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
