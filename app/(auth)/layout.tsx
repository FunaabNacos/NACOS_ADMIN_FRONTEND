import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm sm:max-w-md">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="relative size-8 shrink-0 overflow-hidden rounded-lg">
            <Image
              src="/admin/nacos.png"
              alt="NACOS Logo"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
