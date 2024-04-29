import { GraphQLFormattedError } from "graphql"

// Creating our own type for Error
type Error = {
  message: string,
  statusCode: string
}

/* 
This customFetch will work as a wrap around the fetch function and adds 
the Authorization header.

The creation of a custom fetch is very useful for making request to the GraphQL API
improving code reusability. This define some specifics that are going to happen every
single time a fetch is made. In this case, we'll add Authorization headers.
*/
const customFetch = async (url: string, options: RequestInit) => {
  // Gets the access token from the local storage
  const accessToken = localStorage.getItem('access_token');

  // We retrieve the headers from the options object provided as parameter
  const headers = options.headers as Record<string, string>;

  // Fetching the url passed as a parameter, and passing additional options
  return await fetch(url, {
    // We spread all the options passed to any request, then provide the headers
    ...options,
    headers: {
      // In here, we spread all the headers obtain before
      ...headers,

      // Here we add the Authorization header, notice that we are getting the Auth header
      // from the headers we obtained before, and if there's none, we proceed with 
      // the access token as a Bearer for this header
      Authorization: headers?.Authorization || `Bearer ${accessToken}`,
      "Content-Type": "application/json",

      // CORS policy is manage with Apollo which is GraphQL client used in the front-end
      // to make request to the GrahpQL API
      "Apollo-Require-Preflight": "true",
    }
  })
}

/* 
Comprehensive Error Handling solution 
As we'll manage a lot of data, we want to know if we are getting data back from our
graphQL queries or not.
*/

/* This function will different params: 
body: Takes a record containing an error key, in which this can be an array of GraphQL errors
or undefined.
*/
const getGraphQLErrors = (body: Record<"errors", GraphQLFormattedError[] | undefined>): Error | null => {
  // If there's no body meaning that there's not a response from GraphQL or the response is unexpected.
  if (!body) {
    return {
      message: "Unknown error",
      statusCode: "INTERNAL_SERVER_ERROR"
    }
  }

  // If the body parameter exist and has errors
  if ("errors" in body) {
    // We need the errors from the body
    const errors = body?.errors;

    // We need the errors into a single string, for this we'll use the map function to iterate
    // through the object and then use the .join() function
    const messages = errors?.map((error) => error?.message)?.join("");

    // Get the error code
    const code = errors?.[0]?.extensions?.code;

    // We'll return an object with the messages concatenated into one string or a stringify
    // version of the errors
    return {
      message: messages || JSON.stringify(errors),
      statusCode: code || 500
    }
  }

  return null;
}

/* Creating our fetch wrapper */

// We need an url and options as parameters
export const fetchWrapper = async (url: string, options: RequestInit) => {
  // Here we use the customFetch we created before, passing the url and options from the parameters
  const response = await customFetch(url, options);

  // The response when is read (like response JSON) it can't be read again, for this we will create
  // a clone that will allow us to process the response in multiple ways.
  const responseClone = response.clone();

  // We get the body from the response
  const body = await responseClone.json();

  // We pass the body into the function that handles errors
  const error = getGraphQLErrors(body);

  // If errors exists, we throw it
  if (error) {
    throw error;
  }

  // Else, we return the response
  return response;
}