import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db/mongodb";
import AdminModel from "@/models/Admin";
import { authConfig } from "./auth.config";

/**
 * Configuration NextAuth complète avec providers
 * Utilisé dans les API routes et Server Components
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const admin = await AdminModel.findOne({
            email: credentials.email,
          }).lean();

          if (!admin) {
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            admin.passwordHash
          );

          if (!passwordMatch) {
            return null;
          }

          return {
            id: admin._id.toString(),
            email: admin.email,
            name: admin.name,
          };
        } catch (error) {
          console.error("[Auth] Error:", error);
          return null;
        }
      },
    }),
  ],
});
