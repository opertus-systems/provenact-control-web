import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { isLoginRateLimited } from "./auth-rate-limit";
import { getDbPool } from "./db";

type AuthUserRow = {
  id: string;
  email: string;
  password_hash: string;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }
        if (await isLoginRateLimited(req?.headers, email)) {
          return null;
        }

        const result = await getDbPool().query<AuthUserRow>(
          "SELECT id::text, email, password_hash FROM users WHERE lower(email) = $1 LIMIT 1",
          [email]
        );
        const user = result.rows[0];
        if (!user) {
          return null;
        }

        const matches = await compare(password, user.password_hash);
        if (!matches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
};
