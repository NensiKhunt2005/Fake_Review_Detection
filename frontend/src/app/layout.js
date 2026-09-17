import "./globals.css";

export const metadata = {
  title: "Fake Review Detector",
  description: "AI-powered fake review detection for e-commerce product reviews.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>{children}</body>
    </html>
  );
}
