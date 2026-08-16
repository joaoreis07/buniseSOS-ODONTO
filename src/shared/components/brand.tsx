import type { ReactNode } from "react";



type BrandProps = {

  light?: boolean;

  logoOnly?: boolean;

  className?: string;

};



function ToothIcon({ className }: { className?: string }) {

  return (

    <svg

      viewBox="0 0 24 24"

      fill="currentColor"

      className={className}

      aria-hidden

    >

      <path d="M12 2C9.2 2 7.2 3.8 6.6 6.3C6.1 8.5 6 10.4 6.4 12.5C6.8 14.6 7.6 16.5 8.6 18.2C9.2 19.3 10.4 20.5 12 20.5C13.6 20.5 14.8 19.3 15.4 18.2C16.4 16.5 17.2 14.6 17.6 12.5C18 10.4 17.9 8.5 17.4 6.3C16.8 3.8 14.8 2 12 2ZM12 7.2C12.8 7.2 13.4 7.8 13.4 8.6C13.4 9.4 12.8 10 12 10C11.2 10 10.6 9.4 10.6 8.6C10.6 7.8 11.2 7.2 12 7.2Z" />

    </svg>

  );

}



export function Brand({ light = false, logoOnly = false, className = "" }: BrandProps) {

  return (

    <div

      className={`flex items-center gap-2.5 font-semibold tracking-[-0.03em] ${

        light ? "text-white" : "text-foreground"

      } ${className}`}

    >

      <span

        className={`grid size-9 shrink-0 place-items-center rounded-lg ${

          light

            ? "bg-white/10 text-white ring-1 ring-white/15"

            : "bg-primary text-white"

        }`}

        aria-hidden

      >

        <ToothIcon className="size-5" />

      </span>

      {!logoOnly && (

        <span className="min-w-0 leading-tight">

          <span className="block text-[15px] font-semibold tracking-[-0.02em]">BusinessOS</span>

          <span

            className={`block text-[10px] font-medium uppercase tracking-[0.14em] ${

              light ? "text-white/50" : "text-primary"

            }`}

          >

            Odonto

          </span>

        </span>

      )}

    </div>

  );

}



export function Pill({ children }: { children: ReactNode }) {

  return (

    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-brand-50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-primary">

      {children}

    </span>

  );

}


