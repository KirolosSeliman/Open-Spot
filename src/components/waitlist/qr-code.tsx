import QRCode from "qrcode";
import Image from "next/image";

export async function QrCode({
  value,
  alt = "Waitlist QR code"
}: {
  value: string;
  alt?: string;
}) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    width: 180,
    color: {
      dark: "#1f2933",
      light: "#ffffff"
    }
  });
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return (
    <Image
      alt={alt}
      className="h-44 w-44 rounded-md border border-[var(--line)] bg-white p-2"
      height={180}
      unoptimized
      src={dataUrl}
      width={180}
    />
  );
}
