import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Informe o nome.").max(80),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "Mínimo de 8 caracteres."),
  phone: z.string().max(20).optional().default(""),
  role: z.enum(["BARBER", "CLIENT"]),
  shopName: z.string().max(80).optional().default(""),
});

export const serviceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().default(""),
  category: z.enum(["HAIR", "BEARD", "COMBO", "OTHER"]),
  durationMin: z.coerce.number().int().min(10).max(240),
  priceCents: z.coerce.number().int().min(0),
  active: z.boolean().optional().default(true),
});

export const clientSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().max(20).optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  notes: z.string().max(400).optional().default(""),
});

export const appointmentSchema = z.object({
  clientId: z.string().min(1),
  serviceId: z.string().min(1),
  date: z.string().min(8),
  time: z.string().min(4),
  notes: z.string().max(240).optional().default(""),
});

export const paymentSettingsSchema = z.object({
  pixKey: z.string().max(80).optional().default(""),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM"]),
  mpPublicKey: z.string().max(200).optional().default(""),
  mpAccessToken: z.string().max(300).optional().default(""),
});
