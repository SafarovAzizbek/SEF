import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study Extreme Focus - SEF",
  description: "Professional extreme-focus study dashboard. 90-day challenges, custom Pomodoro, goal tracking, and daily schedules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
