import { z } from 'zod';

export const statusSchema = z.object({
  status: z.enum(['pending', 'paid', 'packed', 'shipped', 'completed', 'cancelled']),
});