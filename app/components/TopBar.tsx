"use client";

import Image from "next/image";
import Link from "next/link";
import { imageDataUrl, initials } from "../lib/format";
import type { Employee } from "../lib/types";
import { Brand } from "./Brand";

export function Avatar({
  employee,
  size = 44,
}: {
  employee?: Employee;
  size?: number;
}) {
  const src = imageDataUrl(employee?.image);
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-ink-800 font-extrabold text-gold-500"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={size}
          height={size}
          unoptimized
          className="size-full object-cover"
        />
      ) : employee ? (
        initials(employee.name).slice(0, size < 60 ? 1 : 2)
      ) : null}
    </span>
  );
}

export function TopBar({ employee }: { employee?: Employee }) {
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 pt-6 md:px-10 lg:hidden">
      <Brand />
      <Link
        href="/perfil"
        aria-label="Mi perfil"
        className="rounded-full transition active:scale-95"
      >
        <Avatar employee={employee} />
      </Link>
    </header>
  );
}
