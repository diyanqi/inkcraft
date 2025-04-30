'use server'

import { signIn } from "@/auth"

export async function handleEmailLogin(formData: FormData) {
  await signIn("loops", {
    email: formData.get("email") as string,
    callbackUrl: "/dashboard"
  })
}