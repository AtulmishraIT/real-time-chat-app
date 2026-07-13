import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';
import { hashPassword, verifyPassword, createToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const body = await request.json();
    const { action, username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (action === 'register') {
      // Check if user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 409 }
        );
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        username,
        password: hashedPassword,
        status: 'online',
      });

      // Create token
      const token = createToken(user._id.toString(), username);

      return NextResponse.json(
        {
          success: true,
          token,
          user: { _id: user._id, username: user.username },
        },
        { status: 201 }
      );
    }

    if (action === 'login') {
      // Find user by username
      const user = await User.findOne({ username });
      if (!user) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      // Verify password
      const passwordMatch = await verifyPassword(password, user.password);
      if (!passwordMatch) {
        return NextResponse.json(
          { error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      // Set user online
      user.status = 'online';
      await user.save();

      // Create token
      const token = createToken(user._id.toString(), username);

      return NextResponse.json({
        success: true,
        token,
        user: { _id: user._id, username: user.username },
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
