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

        // A demo/trial login never keeps real data around: wipe its own
        // leave requests and overtime entries clean on every sign-in, so
        // each person who tries it starts from the same blank slate.
        if (user.isDemo) {
          await Promise.all([
            prisma.leaveRequest.deleteMany({ where: { userId: user.id } }),
            prisma.overtimeEntry.deleteMany({ where: { userId: user.id } }),
          ]);
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isManager: user.isManager,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isManager = (user as { isManager: boolean }).isManager;
        token.organizationId = (user as { organizationId: string | null }).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isManager = token.isManager as boolean;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
};