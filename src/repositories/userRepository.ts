import User, { IUser } from "../models/userModel";

export class UserRepository {
  // Find user by email
  async findByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  // Find user by OTP
  async findByOtp(otp: string): Promise<IUser | null> {
    return User.findOne({ otp });
  }
  //Find by ID

  async findById(userId: string | undefined): Promise<IUser | null> {
    return await User.findById(userId);
  }

  // Save a new user
  async save(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  // Update user data
  async updateById(
    userId: string,
    updateData: Partial<IUser>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  // Update user password
  async updatePassword(email: string, newPassword: string): Promise<void> {
    const user = await User.findOne({ email });
    if (user) {
      user.password = newPassword;
      await user.save();
    }
  }
  // Find or create Google user
  async findOrCreateGoogleUser(
    googleId: string,
    userData: Partial<IUser>
  ): Promise<IUser> {
    let user = await User.findOne({ googleId });
    if (!user) {
      user = new User(userData);
      await user.save();
    }
    return user;
  }
  //Find an admin by email

  async findAdminByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email, is_Admin: true });
  }

  //Find all users

  async findAllUsers(): Promise<IUser[]> {
    return User.find({ is_Admin: false });
  }

  //Save a user
  async saveUser(user: IUser): Promise<IUser> {
    return user.save();
  }
}
