import passport from "passport";
import { Request } from "express";
import {
  Strategy as GoogleStrategy,
  StrategyOptions,
  VerifyCallback,
} from "passport-google-oauth20";
import User, { IUser } from "../models/userModel";
import dotenv from "dotenv";
import { Profile, GoogleCallbackParameters } from "passport-google-oauth20";

dotenv.config();

// Correct the strategy options and callback types
const googleStrategyOptions: StrategyOptions = {
  clientID: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  callbackURL: "http://localhost:5000/auth/google/callback",
};

passport.use(
  new GoogleStrategy(
    googleStrategyOptions,
    async (
      accessToken: string,
      refreshToken: string,
      profile: Profile,
      done: VerifyCallback
    ) => {
      try {
        // Check if emails exist on profile and ensure it's safely accessed
        const email = profile.emails && profile.emails[0]?.value;

        if (!email) {
          return done(new Error("Email not found in Google profile"));
        }

        // Find or create a user with the Google profile info
        const user = (await User.findOne({
          googleId: profile.id,
        })) as IUser | null;

        if (!user) {
          // Create a new user if not found
          const newUser = new User({
            googleId: profile.id,
            name: profile.displayName,
            email,
            profilePicture: profile.photos?.[0]?.value, // Safe access for photos
          });
          await newUser.save();
          return done(null, newUser);
        }

        return done(null, user);
      } catch (err) {
        console.error(err);
        return done(err);
      }
    }
  )
);
passport.serializeUser(((
  user: IUser,
  done: (err: any, id?: unknown) => void
) => {
  done(null, user._id);
}) as (user: Express.User, done: (err: any, id?: unknown) => void) => void);

// Deserialize the user from the session
passport.deserializeUser((id: string, done: Function) => {
  User.findById(id, (err: Error, user: IUser | null) => {
    done(err, user);
  });
});

export default passport;
