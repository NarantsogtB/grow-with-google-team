import { z } from "zod";

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Нэр 2-оос дээш тэмдэгт байх ёстой").optional(),
  address_text: z
    .string()
    .min(5, "Хаягаа бүрэн бичнэ үү")
    .optional(),
  telegram_chat_id: z.string().optional(),
});

export type ProfileUpdateFormValues = z.infer<typeof profileUpdateSchema>;
