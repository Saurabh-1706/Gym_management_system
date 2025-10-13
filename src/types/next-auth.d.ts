// src/types/next-auth.d.ts
import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // <- this ensures session.user.id exists
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string; // <- this ensures JWT has user.id
  }
}
