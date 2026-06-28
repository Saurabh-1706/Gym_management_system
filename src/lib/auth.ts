import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import User, { IUser } from "@/models/User";
import Tenant from "@/models/Tenant";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();
 
        if (!credentials?.email || !credentials?.password) return null;
 
        const user = (await User.findOne({ email: credentials.email }).exec()) as IUser | null;
        if (!user) return null;
 
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;
 
        // Fetch tenant details to ensure tenant exists, is active, and retrieve its slug
        const tenant = await Tenant.findById(user.tenantId).exec();
        if (!tenant || !tenant.isActive) return null;
 
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          tenantId: user.tenantId.toString(),
          role: user.role || "gym_admin",
          tenantSlug: tenant.slug,
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.tenantId = (user as any).tenantId;
        token.role = (user as any).role;
        token.tenantSlug = (user as any).tenantSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.tenantId = token.tenantId as string;
        session.user.role = token.role as string;
        session.user.tenantSlug = token.tenantSlug as string;
      }
      return session;
    },
  },

  pages: { signIn: "/auth" },
  secret: process.env.NEXTAUTH_SECRET,
};
