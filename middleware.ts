// import { type NextRequest, NextResponse } from "next/server"

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl

//   // Public routes that don't require authentication
//   const publicRoutes = ["/login", "/api/auth/login", "/api/auth/verify", "/api/setup-auth"]

//   // API routes that should be accessible (for functionality)
//   const apiRoutes = ["/api/beehives", "/api/dashboard", "/api/sensor-data", "/api/devices"]

//   // Check if the current path is public or API
//   const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
//   const isApiRoute = apiRoutes.some((route) => pathname.startsWith(route))

//   if (isPublicRoute) {
//     return NextResponse.next()
//   }

//   // For API routes, check session but don't redirect
//   if (isApiRoute) {
//     const sessionToken = request.cookies.get("farmer_session")?.value
//     if (!sessionToken) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
//     }
//     return NextResponse.next()
//   }

//   // For dashboard routes, check session and redirect if needed
//   const sessionToken = request.cookies.get("farmer_session")?.value
//   if (!sessionToken) {
//     return NextResponse.redirect(new URL("/login", request.url))
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// }

// Middleware temporarily disabled for debugging
export function middleware() {
  // Do nothing for now
}

export const config = {
  matcher: [],
}
