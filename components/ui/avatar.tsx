import * as React from "react";

import { cn } from "@/lib/utils";

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const result = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return result.toUpperCase() || "?";
}

function Avatar({
  name,
  src,
  className,
  ...props
}: React.ComponentProps<"span"> & {
  name?: string | null;
  src?: string | null;
}) {
  return (
    <span
      data-slot="avatar"
      className={cn(
        "inline-flex size-7 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--purple)_18%,white)] text-[0.7rem] font-semibold text-purple-deep",
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export { Avatar };
