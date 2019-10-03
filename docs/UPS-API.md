# Overview
For all the endpoints below if the user is not yet authenticated into our system, all requests must be sent with an app-secret, here is an example: 
```http
GET /auth/email/test@test.com/exists
Authorization: <APP-SECRET>
```

After the user is authenticated, requests will replace the app-scret with the `sessionId`, here is an example:
```http
GET profiles/1
Authorization: <SESSION-ID>
```

All endpoints on failure, return an error object `{ error: errorCode}`. For a full list of errors refer to our `errors.js`.

# Endpoints

## Data Types

```
LiteProfile = { 
  tagferId: str,
  fullName: str,
  jobTitle: str,
  companyName: str,
  photoURL: str
}

FullProfile = {}
```

## Auth
| Method | Endpoint                            | Usage                                                                  | Body                               | Returns                                                                 |
| ------ | ----------------------------------- | ---------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| GET    | [auth/token/twitter]()              | Fetches the access token for access to the twitter api                 | -                                  | token: str                                                              | 
| GET    | [auth/twitter/username]()           | Twitter callback url, on which the screen_name is appeneded to the url | -                                  | username: str                                                           |
| GET    | [/auth/session/:sessionId/exists]() | Checks if the session exists by session id                             | -                                  | result: bool                                                            |
| GET    | [auth/email/:email/exists]()        | Checks if the email exists                                             | -                                  | result: bool                                                            |
| GET    | [auth/tagferId/:tagferId/exists]()  | Checks if the tagfer id exists in our db                               | -                                  | result: bool                                                            |
| POST   | [auth/phone/code]()                 | Sends a verification SMS code                                          | phoneNumber: str                   | result: bool                                                            |
| POST   | [auth/phone/verify]()               | Verifies the verification code sent                                    | phoneNumber: str, code: str        | result: bool                                                            |
| POST   | [auth/signin]()                     | Sign in with email/tagferId and password                               | email|tagferId: str, password: str | sessionId: str                                                          |
| POST   | [auth/signout]()                    | Sign out, users session becomes invalid                                | -                                  | -                                                                       |
| POST   | [auth/passwordReset]()              | Reset user password                                                    | email: str                         | -                                                                       |
| POST   | [auth/findUsers/byPhone]()          | Finds the users by phone numbers                                       | phoneNumbers: [str]                | inNetwork: [TagferID], outNetwork: [PhoneNumber], failed: [PhoneNumber] |
| PUT    | [auth/signup]()                     | Sign up the user to tagfer                                             | **user**: { tagferId, email, password, phoneNumber }, **profile**: { fullName, jobTitle, companyName, companyEmail, companyPhoneNumber, photoBytes: str }, **invites**: { phoneNumnbers: [str], tagferIds: [str] } | sessionId: str                       |
 
## Profiles
| Method | Endpoint                  | Usage                                        | Body                    | Returns                                                                                  |
| ------ | ------------------------- | -------------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| GET    | [profiles/me/:profileN]() | Retrieves your own profile | empty           | -                       | Profile Model                                                                            |
| POST   | [profiles/me/:profileN]() | Creates or updates your own profile          | Optionals Profile Model |                                                                                          |
| GET    | [profiles/:tagferId]()    | Retrieves profile1 if there is no connection | -                       | { profile: Profile Model, isRequested: bool }                                            |
| GET    | [profiles/suggest]()      | Retrieves a set of random lite profiles      | -                       | profiles: [LiteProfile] |

## Connections

| Method | Endpoint                     | Usage                                               | Body                             | Returns                                                     |
| ------ | ---------------------------- | --------------------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| PUT    | [connections/me/:profileN]() | Adds a connection request from your own profileN    | toTagferId: str                  | -                                                           |
| POST   | [connections/me/:profileN]() | Accepts a connection request from your own profileN | toTagferId: str, toProfileN: int | -                                                           |
| GET    | [connections/me/requests]()  | Gets the requests received                          | -                                | received: [LiteProfile, profileN: int], sent: [LiteProfile] |
| GET    | [connections/all]()          | Gets all the connections                            | -                                | connections: [LiteProfile]                                  |

## Notes
| Method | Endpoint               | Usage               | Body                                      | Returns                                                |     
| ------ | ---------------------- | ------------------- | ----------------------------------------- | ------------------------------------------------------ | 
| PUT    | [notes/me/:tagferId]() | Creates a new note  | content: str, updatedAt: int              | { noteId: str }                                        |    
| GET    | [notes/me/:tagferId]() | Gets all notes      | -                                         | notes: [{ noteId: str, content: str, updatedAt: int }] |                                               
| DELETE | [notes/me/:tagferId]() | Deletes a note      | noteId: str                               | -                                                      |    
| POST   | [notes/me/:tagferId]() | Update a note       | noteId: str, content: str, updatedAt: int | { noteId: str }                                        |