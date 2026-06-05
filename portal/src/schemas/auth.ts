import { z } from "zod";

export const loginSchema = z.object({
  phone_number: z
    .string()
    .min(8, "Утасны дугаар 8-аас дээш тэмдэгт байх ёстой"),
  password: z.string().min(6, "Нууц үг 6-аас дээш тэмдэгт байх ёстой"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Нэр 2-оос дээш тэмдэгт байх ёстой"),
    phone_number: z
      .string()
      .min(8, "Утасны дугаар 8-аас дээш тэмдэгт байх ёстой"),
    password: z.string().min(6, "Нууц үг 6-аас дээш тэмдэгт байх ёстой"),
    confirm_password: z.string().min(1, "Нууц үгээ давтан оруулна уу"),
    address_text: z.string().min(5, "Хаягаа бүрэн бичнэ үү"),
    telegram_chat_id: z.string().optional(),
    hospital_id: z.string().min(1, "Харьяа өрхийн эмнэлэгээ сонгоно уу"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Нууц үг таарахгүй байна",
    path: ["confirm_password"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
