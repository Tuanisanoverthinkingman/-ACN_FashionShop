import "./globals.css";
import ClientOnlyRoot from "@/components/ClientOnlyRoot";
import ChatBox from "@/components/ChatBox";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="relative">
          <ClientOnlyRoot>{children}</ClientOnlyRoot>
          <ChatBox />
        </div>
      </body>
    </html>
  );
}