import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./playground.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const geist = localFont({ src: "../public/fonts/geist-latin.woff2", variable: "--font-geist", display: "swap", weight: "100 900" });

export const metadata: Metadata = { title: "Prompt 实战学习站", description: "面向零基础用户的中文提示词工程学习站" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN" data-scroll-behavior="smooth"><body className={geist.variable}><a className="skip-link" href="#main-content">跳到主要内容</a><SiteHeader /><main id="main-content">{children}</main><SiteFooter /></body></html>; }
