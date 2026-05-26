import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        verifiedToken: { label: "Verified Token", type: "text" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.verifiedToken) return null;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = await (prisma.user as any).findFirst({
          where: {
            email: credentials.email as string,
            otpVerifiedToken: credentials.verifiedToken as string,
            otpVerifiedExpiry: { gt: new Date() },
            status: "Active",
          },
        });

        if (!user) return null;

        // Consume the one-time token so it can't be reused
        await prisma.user.update({
          where: { id: user.id },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { otpVerifiedToken: null, otpVerifiedExpiry: null } as any,
        });

        await prisma.activityLog.create({
          data: {
            userId: user.id,
            action: "Login",
            description: "User logged in with email OTP",
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
