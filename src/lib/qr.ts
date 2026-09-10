import QRCode from "qrcode";

export async function qrDataUrl(value: string) {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 360,
    color: { dark: "#07080c", light: "#f7f1de" },
  });
}
