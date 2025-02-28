import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { MantineProvider } from '@mantine/core';
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {ReactNode} from "react";
import { Notifications } from '@mantine/notifications';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "漫画AI よろず",
  description: "よろずが漫画創作をサポート！",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <MantineProvider>
          <Notifications />
            {children}
          </MantineProvider>
      </body>
    </html>
  );
}
