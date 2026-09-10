import Link from "next/link";
import { Logo, Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="grid-bg grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <Logo />
        <h1 className="mt-8 text-3xl">Página fora do mapa</h1>
        <div className="mt-6">
          <Link href="/"><Button>Voltar</Button></Link>
        </div>
      </div>
    </div>
  );
}
