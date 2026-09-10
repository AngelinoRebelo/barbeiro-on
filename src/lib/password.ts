import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function passwordRules(password: string) {
  if (password.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (!/[A-Z]/.test(password)) return "Inclua ao menos uma letra maiúscula.";
  if (!/[0-9]/.test(password)) return "Inclua ao menos um número.";
  return null;
}
