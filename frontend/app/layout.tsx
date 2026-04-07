import "./globals.css";
import ClientOnlyRoot from "@/components/ClientOnlyRoot";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="relative">
          <ClientOnlyRoot>{children}</ClientOnlyRoot>
        </div>
      </body>
    </html>
  );
}