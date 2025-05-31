import { auth } from "@/auth"
 
export default auth((req) => {
  const allowedPaths = ["/login", "/", "/register", "/verify-request", "/api/inngest"]
  if (!req.auth && !allowedPaths.includes(req.nextUrl.pathname)) {
    const newUrl = new URL("/login", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }

  if (req.auth && req.nextUrl.pathname === "/login") {
    const newUrl = new URL("/dashboard", req.nextUrl.origin)
    return Response.redirect(newUrl)
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|shared-correction|favicon.ico).*)"],
}