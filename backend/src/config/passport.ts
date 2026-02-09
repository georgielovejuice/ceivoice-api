/**
 * Passport.js Configuration
 * Production-grade authentication strategies setup
 * - JWT Strategy: Validates Bearer tokens
 * - Local Strategy: Email/password authentication
 * - Google OAuth2 Strategy: Google authentication
 */

import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import config from "./environment";

const prisma = new PrismaClient();

// ===== INTERFACES =====

export interface JwtPayload {
  user_id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

export interface UserProfile {
  user_id: number;
  email: string;
  name: string | null;
  role: string;
}

// ===== JWT STRATEGY =====
/**
 * Validates JWT tokens from Authorization header
 * Header format: Authorization: Bearer <token>
 */
passport.use(
  "jwt",
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret,
      algorithms: config.passport.algorithms as any,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    },
    async (payload: JwtPayload, done: any) => {
      try {
        const user = await prisma.user.findUnique({
          where: { user_id: payload.user_id }
        });

        if (!user) {
          return done(null, false, { message: "User not found" });
        }

        // Attach user to request
        const userProfile: UserProfile = {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role
        };

        return done(null, userProfile);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ===== LOCAL STRATEGY =====
/**
 * Email/Password authentication
 * Validates credentials against database
 */
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: false
    },
    async (email: string, password: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          return done(null, false, { message: "Invalid email or password" });
        }

        if (!user.password) {
          return done(null, false, {
            message: "This account uses OAuth. Please sign in with Google."
          });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid email or password" });
        }

        const userProfile: UserProfile = {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role
        };

        return done(null, userProfile);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ===== GOOGLE OAUTH2 STRATEGY =====
/**
 * Google OAuth2 authentication
 * Handles user creation/update on first login
 */
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: config.google.clientID,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackURL
    },
    async (accessToken: string, refreshToken: string, profile: any, done) => {
      try {
        // Check if user exists by Google ID
        let user = await prisma.user.findUnique({
          where: { google_id: profile.id }
        });

        if (!user) {
          // Check if email exists
          const emailExists = await prisma.user.findUnique({
            where: { email: profile.emails?.[0]?.value }
          });

          if (emailExists) {
            // Link Google account to existing email account
            user = await prisma.user.update({
              where: { email: profile.emails?.[0]?.value },
              data: {
                google_id: profile.id,
                google_email: profile.emails?.[0]?.value
              }
            });
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: profile.emails?.[0]?.value || "",
                name: profile.displayName || null,
                google_id: profile.id,
                google_email: profile.emails?.[0]?.value || "",
                role: "USER"
              }
            });
          }
        }

        const userProfile: UserProfile = {
          user_id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role
        };

        return done(null, userProfile);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// ===== SERIALIZE/DESERIALIZE =====
/**
 * For stateless JWT auth, these are minimal
 * They're kept for compatibility with Passport
 */
passport.serializeUser((user: any, done) => {
  done(null, user.user_id);
});

passport.deserializeUser(async (user_id: number, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id }
    });
    if (!user) {
      return done(null, false);
    }

    const userProfile: UserProfile = {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    done(null, userProfile);
  } catch (error) {
    done(error);
  }
});

export default passport;
