import QRCode from "qrcode";

export async function ClientsQrDownloadButton({ value }: { value: string }) {
  const svg = await QRCode.toString(value, {
    type: "svg",
    margin: 1,
    width: 512,
    color: {
      dark: "#07142f",
      light: "#ffffff"
    }
  });
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return (
    <a
      className="inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-full border border-[#2563ff] bg-white px-4 text-sm font-bold text-[#2563ff] transition hover:bg-[#eef4ff]"
      download="liste-attente-qr.svg"
      href={dataUrl}
    >
      Télécharger le QR code
    </a>
  );
}
