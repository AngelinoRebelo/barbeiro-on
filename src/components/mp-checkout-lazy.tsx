"use client";

import dynamic from "next/dynamic";

export const MpCheckout = dynamic(
  () => import("./mp-checkout").then((mod) => mod.MpCheckout),
  {
    ssr: false,
    loading: () => <p className="text-sm text-[#8b93a7]">Abrindo Mercado Pago...</p>,
  },
);
