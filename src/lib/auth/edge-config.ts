// Edge-compatible auth config (no database adapter — JWT only)
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

export const { auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
});
