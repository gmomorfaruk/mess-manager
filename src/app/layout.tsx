import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "MessManager — Smart Hostel Mess Management",
  description: "Effortlessly manage your hostel mess — meals, costs, deposits, and balances in one place.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-surface-50 text-ink-900 antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: "12px",
                background: "#fff",
                color: "#0f172a",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                fontSize: "14px",
                fontFamily: "var(--font-dm-sans, system-ui)",
              },
              success: {
                iconTheme: { primary: "#22c55e", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
