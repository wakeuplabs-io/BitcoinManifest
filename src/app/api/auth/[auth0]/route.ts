import { getUser } from "@/backend/entities/users/application/get/getUser";
import { apiUserRepository } from "@/backend/entities/users/infra/ApiUserRepository";
import { getOrCreateUser, UserCreateData } from "@/backend/services/auth/index"
import {
  Session,
  handleAuth,
  handleCallback,
  handleLogin,
  handleLogout,
  handleProfile
} from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

const userRepository = apiUserRepository();

// Use this to add or remove claims on session updates
const afterCallback = async (
  req: NextRequest,
  session: Session,
  state: any
) => {
  try {
    if (session?.user) {
      const user = session.user;
      const userCreateData: UserCreateData = {
        sid: user.sid as string,
        sub: user.sub as string,
        name: user.name as string,
        image: user.picture,
        displayName: user.nickname,
      };
      const currentUser = await getOrCreateUser(userRepository, userCreateData)
      return { ...session, user: { ...session.user, dbUser: currentUser } };
    }
    return session;
  } catch (error) {
    console.log("error", error);
    return session;
  }
};

const afterRefetch: any = async (
  req: NextApiRequest,
  session: Session,
  state: any
) => {
  try {
    let currentUser;
    if (session?.user) {
      const user = session.user;
      currentUser = await getUser(userRepository)(user.sub);
      return { ...session, user: { ...session.user, dbUser: currentUser } };
    }
    return session;
  } catch (error) {
    console.log("error", error);
    return session;
  }
};

export const GET = handleAuth({
  callback: handleCallback({ afterCallback: afterCallback as any }),
  logout: async (req: NextApiRequest, res: NextApiResponse) => {
    const callback = async () => {
      return await handleLogout(req, res);
    };
    return await callback();
    //return res.status(200).end(); // Return a response here
  },
  login: (req: NextApiRequest, res: NextApiResponse) => {
    return handleLogin(req, res, {
      returnTo: "/congrats",
    }) as NextResponse;
  },
  signup: (req: NextApiRequest, res: NextApiResponse) => {
    return handleLogin(req, res, {
      returnTo: "/congrats",
    }) as NextResponse;
  },
  me: async (req: any, res: any) => {
    try {
      return await handleProfile(req, res, {
        refetch: true,
        afterRefetch: afterRefetch,
      });
    } catch (err: unknown) {
      console.log("error", err);
      return handleLogin({
        authorizationParams: {
          screen_hint: "signin",
        },
        returnTo: "/congrats",
      });
    }
  },
  profile: async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handleProfile(req, res, { refetch: true });
    } catch (error) {
      console.error(error);
    }
  },
});
