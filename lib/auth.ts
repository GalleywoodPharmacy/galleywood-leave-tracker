import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

/**
 * Real per-person auth (spec section 5), replacing the prototype's
 * "pick your name from a dropdown" + manager-PIN model.
 *
 * is_manager is read from the database on every login and stamped into the
 * JWT/session — it is never trusted from the client. Route protection that
 * depends on it (manager-only pages, manager-only API routes) must re-check
 * `session.user.isManager` server-side; see middleware.ts.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isManager: user.isManager,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isManager = (user as { isManager: boolean }).isManager;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isManager = token.isManager as boolean;
      }
      return session;
    },
  },
};
