import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

export async function getUserFromToken() {
  try {
    const cookieStore = await cookies() 
    const token = cookieStore.get("token")?.value

    if (!token) return null

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    return decoded
  } catch (error) {
    return null
  }
}