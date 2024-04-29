import { AuthProvider } from "@refinedev/core";

// import { User } from "@/graphql/schema.types";

import { API_URL, dataProvider } from "./data";

/**
 * For demo purposes and to make it easier to test the app, you can use the following credentials:
 */
export const authCredentials = {
  email: "michael.scott@dundermifflin.com",
  password: "demodemo",
};

/* 
Auth Provider takes care of letting users log in and control what they can do based in their permissions.

*/

export const authProvider: AuthProvider = {
  login: async ({ email }) => {
    try {
      // Call the login mutation
      // dataProvider.custom is used to make a custom request to the GraphQL API
      // this will call dataProvider which will go through the fetchWrapper function
      const { data } = await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          variables: { email },
          // This will return the accessToken of the user
          rawQuery: `
                mutation Login($email: String!) {
                    login(loginInput: {
                      email: $email
                    }) {
                      accessToken,
                    }
                  }
                `,
        },
      });

      // And we will save it into the Local storage
      localStorage.setItem("access_token", data.login.accessToken);

      return {
        success: true, // We set the flag to True
        redirectTo: "/", // And Redirect the user to the home page
      };
    } catch (e) {
      const error = e as Error;

      return {
        success: false,
        error: {
          message: "message" in error ? error.message : "Login failed",
          name: "name" in error ? error.name : "Invalid email or password",
        },
      };
    }
  },

  // Deletes the access token from the Local storage
  logout: async () => {
    localStorage.removeItem("access_token");

    return {
      success: true,
      redirectTo: "/login", // Redirects to the login page
    };
  },

  // Handles any error occurred, checking if the error is of type Authentication
  // If so, set logout to true
  onError: async (error) => {
    if (error.statusCode === "UNAUTHENTICATED") {
      return {
        logout: true,
      };
    }

    return { error };
  },

  // Gets the identity of the user and this way knowing if the user is authenticated or not
  check: async () => {
    try {
      await dataProvider.custom({
        url: API_URL,
        method: "post",
        headers: {},
        meta: {
          rawQuery: `
                    query Me {
                        me {
                          name
                        }
                      }
                `,
        },
      });

      return {
        authenticated: true,
        redirectTo: "/", // If authenticated, redirect to Home
      };
    } catch (error) {
      return {
        authenticated: false,
        redirectTo: "/login", // If not authenticated, redirect to login
      };
    }
  },

  // Gets all the informatino of the user (name, email, etc)
  getIdentity: async () => {
    const accessToken = localStorage.getItem("access_token");

    try {
      const { data } = await dataProvider.custom<{ me: any /*: User*/ }>({
        url: API_URL,
        method: "post",
        headers: accessToken
          ? {
            Authorization: `Bearer ${accessToken}`,
          }
          : {},
        meta: {
          rawQuery: `
                    query Me {
                        me {
                            id,
                            name,
                            email,
                            phone,
                            jobTitle,
                            timezone
                            avatarUrl
                        }
                      }
                `,
        },
      });

      return data.me;
    } catch (error) {
      return undefined;
    }
  },
};