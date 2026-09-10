function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(source: string) {
  let crc = 0xffff;
  for (let i = 0; i < source.length; i++) {
    crc ^= source.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(value: string, max: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .trim()
    .slice(0, max)
    .toUpperCase();
}

export function buildPixPayload(opts: {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txid: string;
  description?: string;
}) {
  const key = opts.pixKey.trim();
  if (!key) throw new Error("Chave PIX não cadastrada.");

  const gui = tlv("00", "br.gov.bcb.pix") + tlv("01", key);
  const desc = opts.description ? tlv("02", opts.description.slice(0, 72)) : "";
  const merchantAccount = tlv("26", gui + desc);
  const txid = tlv("05", opts.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "BARBEIROON");
  const additional = tlv("62", txid);

  const payload =
    tlv("00", "01") +
    tlv("01", "12") +
    merchantAccount +
    tlv("52", "0000") +
    tlv("53", "986") +
    tlv("54", (opts.amountCents / 100).toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", sanitize(opts.merchantName, 25) || "BARBEIRO ON") +
    tlv("60", sanitize(opts.merchantCity, 15) || "SAO PAULO") +
    additional +
    "6304";

  return payload + crc16(payload);
}
