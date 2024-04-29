
import graphqlDataProvider, {
  GraphQLClient,
  liveProvider as graphqlLiveProvider
} from "@refinedev/nestjs-query";

import { createClient } from 'graphql-ws'
import { fetchWrapper } from "./fetch-wrapper";

export const API_BASE_URL = 'https://api.crm.refine.dev'
export const API_URL = `${API_BASE_URL}/graphql` //Connects with the GraphQL API
export const WS_URL = 'wss://api.crm.refine.dev/graphql'

/* 
GraphQL client to make request to the GraphQL API
GraphQLClient will take an URL and a set of options {}
*/
export const client = new GraphQLClient(API_URL, {
  fetch: (url: string, options: RequestInit) => {
    // Trying to make a successful request
    try {
      // Pass the arguments and the function we made will handle the headers and the Auth layer
      // Also this function will manage the errors
      return fetchWrapper(url, options);
    } catch (error) {
      return Promise.reject(error as Error);
    }
  }
})

// Websocket
/*  This piece of code will listen to subscriptions to the GraphQL API, so when changes happen
    we want to listen immediately to them.

    We are doing this inside the Data Provider because in Refine there is a built in provider named
    Live Provider that allows our app to update in realtime, when ever a change is made other can see
    it without refreshing the web. 
*/

// This ternary is evaluating if we are in the web browser, where the window object is different than undefined
export const wsClient = typeof window !== "undefined"
  ? createClient({ // We create a client and pass a object with options
    url: WS_URL, // We pass the URL provided by Refine for GraphQL API
    connectionParams: () => { // We pass an callback function to the connection Params
      const accessToken = localStorage.getItem("access_token"); // We look for the access Token inside the local storage
      return {
        // We return the Authorization header with the accessToken as Bearer
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    }
  })
  : undefined // If we are not inside the browser, then we return undefined

// Data Provider - Make request to the GraphQL API
// We pass the client created from before
export const dataProvider = graphqlDataProvider(client);

// Live Provider - Make subscriptions to the GraphQL API
// We pass the websocket created before
// We make sure that the wsClient exist using a ternary operator
export const liveProvider = wsClient ? graphqlLiveProvider(wsClient) : undefined;