import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (query) {
      // Search users by username
      const users = await User.find({
        username: { $regex: query, $options: 'i' },
      }).select('username status -password');
      return NextResponse.json({ users });
    }

    // Get all online users
    const users = await User.find({ status: 'online' }).select('username status -password');

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { action, username } = body;

    if (action === 'logout') {
      const user = await User.findOne({ username });
      if (user) {
        user.status = 'offline';
        await user.save();
      }
      return NextResponse.json({ success: true });
    }

    if (!username) {
      return NextResponse.json(
        { error: 'username is required' },
        { status: 400 }
      );
    }

    let user = await User.findOne({ username });

    if (!user) {
      user = await User.create({
        username,
        status: 'online',
      });
    } else {
      user.status = 'online';
      await user.save();
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
