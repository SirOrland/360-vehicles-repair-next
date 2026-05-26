import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || user.status !== "Active") return null;

        // Account lockout check
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const u = user as any;
        if (u.lockedUntil && u.lockedUntil > new Date()) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!valid) {
          const newAttempts = (u.failedAttempts ?? 0) + 1;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedAttempts: newAttempts,
              ...(newAttempts >= 5 && {
                lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
              }),
            },
          });
          return null;
        }

        // Successful login — reset lockout counters
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: 0, lockedUntil: null },
        });

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "Login",
            description: "User logged in successfully",
          },
        });

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
});

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: string;
    id?: string;
  }
}
