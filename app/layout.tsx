import type { Metadata } from "next";
import "./globals.css";
import "./playground.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = { title: "Prompt 实战学习站", description: "面向零基础用户的中文提示词工程学习站" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN" data-scroll-behavior="smooth"><body><SiteHeader /><main>{children}</main><SiteFooter /></body></html>; }
