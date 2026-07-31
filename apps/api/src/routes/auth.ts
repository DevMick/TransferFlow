import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/index.js';
import { type AuthEnv, requireAuth } from '../auth/middleware.js';
import { db } from '../db/index.js';
import { user } from '../db/schema.js';

/**
 * Auth routes - better-auth provides core auth endpoints via /api/auth/*
 * These routes provide user profile management
 */

const authRouter = new Hono<AuthEnv>()
  // Get current user profile
  .get('/me', requireAuth, async (c) => {
    const currentUser = c.get('user');
    return c.json({ user: currentUser });
  })
  // Update user profile
  .put(
    '/me',
    requireAuth,
    zValidator(
      'json',
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional(),
      }),
    ),
    async (c) => {
      const currentUser = c.get('user');
      const updates = c.req.valid('json');

      const [updatedUser] = await db
        .update(user)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(user.id, currentUser.id))
        .returning();

      return c.json({ user: updatedUser });
    },
  )
  // Change password
  .put(
    '/me/password',
    requireAuth,
    zValidator(
      'json',
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }),
    ),
    async (c) => {
      const { currentPassword, newPassword } = c.req.valid('json');

      // Use better-auth to change password
      const response = await auth.api.changePassword({
        body: {
          newPassword,
          currentPassword,
        },
      });

      if (!response) {
        return c.json({ error: 'Failed to change password' }, 400);
      }

      return c.json({ message: 'Password changed successfully' });
    },
  );

export { authRouter };
