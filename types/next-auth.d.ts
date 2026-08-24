import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isManager: boolean;
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    id: string;
    isManager: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isManager: boolean;
  }
}
