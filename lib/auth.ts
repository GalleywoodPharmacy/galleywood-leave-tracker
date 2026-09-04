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

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // Email is unique per organization now, not globally, so the same
        // address can match more than one account across different
        // businesses. Try each in turn (oldest first, for a deterministic
        // result) and use whichever one's password actually verifies —
        // the standard pattern for this in multi-tenant apps. In the
        // overwhelming majority of cases there's only one match anyway.
        const candidates = await prisma.user.findMany({
          where: { email: normalizedEmail },
          orderBy: { createdAt: "asc" },
        });

        let user: (typeof candidates)[number] | null = null;
        for (const candidate of candidates) {
          if (!candidate.passwordHash) continue;
          if (await verifyPassword(credentials.password, candidate.passwordHash)) {
            user = candidate;
            break;
          }
        }

        if (!user) return null;

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
          isPlatformAdmin: user.isPlatformAdmin,
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
        token.isPlatformAdmin = (user as { isPlatformAdmin: boolean }).isPlatformAdmin;
        token.organizationId = (user as { organizationId: string | null }).organizationId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isManager = token.isManager as boolean;
        session.user.isPlatformAdmin = token.isPlatformAdmin as boolean;
        session.user.organizationId = token.organizationId as string | null;
      }
      return session;
    },
  },
};