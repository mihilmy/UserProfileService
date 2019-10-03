# High Level

On a high level to handle all authentication and user creation we will be using `firebase.admin.auth` to manage all the users information. To manage state we will be using sessions local to a small fast in-memory storage named `loki.js`. Firebase admin will manage the following fields: email, phone number, password, uid (tagferId), display name. The rest of the information will be managed with firebase Realtime database.

Below is our current architecture that details the tech stack we are using.

```
                                                   +-----------+ 
                                                   |           |
                                        +--------->| fireabase |
+--------+          +------------+      |          |           |
|        |          |            |      |          +-----------+
| client |--------->| express.js |------+ 
|        |          |            |      |          +---------+
+--------+          +------------+      |          |         |
                                        +--------->| loki.js | 
                                                   |         |
                                                   +---------+
```

In all authentication stages, clients must have the app's secret key to access the API, this prevents any attacks on our system by any client. Only app users are able to make requests or other authorized parties.

Once the user is authenticated a session is created in Loki, this session is an object that hold information such as the `tagferId`, ALL other requests now **MUST** pass the `sessionId` in the Authorization header.

# Data Models

## Users Collection

The users are not modeled in our database, since we rely on firebase authentication to handle the users for us. However, we provide an explaination how we use the fields. For reference here is the firebase link explaining their [model](https://firebase.google.com/docs/reference/admin/node/admin.auth.UserRecord).

* uid: `String` lower case string that represents that TagferID
* displayName: `String` representing the fullName
* email: `String` 
* phoneNumber: `String` only accepts the E.164 format
* photoURL: `String` storage url of the photo

## Profiles Collection

A profile contains all the information about a specific TagferID.

* Profiles [Collection Name]
* TagferID [Document ID]
    * profile1 `Object`
        + profileName `String`
        + fullName `String`
        + photoURL `String`
        + bizCardPhotoURL `String`
        + about `String`
        + help `String`
        + need `String`
        + experience  `Object`
            + jobTitle `String`
            + companyName `String`
            + companyLocation `String`
            + summary `String`
            + startDate `Integer`
            + endDate `Integer`
        + education  `Object`
            + school `String`
            + degree `String`
            + fieldOfStudy `String`
            + startDate `Integer`
            + endDate `Integer`
            + summary `String`
        + website  `String`
        + emails `Object`
            + company `String`
        + phoneNumbers `Object`
            + company `String`
        + skills `Object`
            + skillName: `Integer` (default is 1)
    * profile2 `Object`
    * profile3 `Object`
    * profile4 `Object`

## Connections Collection

Connections are made at the user level with a one-to-one relationship (e.g. User1 is connected to User2). A connection is represented as follows; each side has an entry in the collection with a number represnting what profile that you have granted access from your side of the connection. Here is an example:

![](./images/ex_connections.png)

user1 is connected to user2 with profile 2, that means that if user2 wants to view user1's profile he will see profile 2. Similarly, user2 is connected to user1 with profile 1, meaning that if user1 wants to view user2's profile he will view profile 4.

The choice of a simplistic schema is perfect for our needs since it allows a fast check to see if two people are connected and count retrieval. We can also replicate the information under each tagfer to follow the principle of store what you query for. However, for now we will filter on the backend into groups[1,2,3,4].

* Connections [Collection Name]
* From-TagferID [Document ID]
    + autoAccept `Integer`
    + count: `Integer` total count of all connections
    + to: `Object` all the connections
        + To-TagferID: `Integer` representing the profile number the *from* connection has granted.

## Requests Collection

This is a sibling of the connections collections, it's not a child to avoid deeply nested structures. Here is an exmaple:
![](./images/ex_requests.png)

user1 has requested to connect with user2 with profile1, you can see that the same data is replectaed to allow for fast retrieval. We also, see that user1 has a request from user4 with profile4.

* Requests [Collection Name]
* TagferID [Document ID]
    + sent: `Object`
        - TagferID: `Integer` representing the profile number the *outgoing* connection granted.
    + received: `Object`
        - TagferID: `Integer` representing the profile number the *incoming* connection has granted.

## Notes Collections

This is a sibling of the connections, limiting the size of a given node in the tree.

* Notes [Collection Name]
* From-TagferID: [Document ID]
    + To-TagferID: [Sub-Collection]
        + NoteID `String` uuid generated by firebase
            + content: `String`
            + updatedAt: `Integer` timestamp

## Keywords Collection

* Skills [Collection Name]
* SkillName [Document ID]
    * Count `Integer`