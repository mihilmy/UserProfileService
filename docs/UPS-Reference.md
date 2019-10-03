# API Reference

## Profiles DAO

#### `getLiteProfiles(list)`
* **Description**: Utility function given some tagferIds and profile numbers fetches the profile information. Lite means [fullName, photoURL, title, companyName]
* **Parameters**:
    + **list**: Array of objects `{tagferId: String, profileN: Integer}`
* **Returns**: Array that contains [Profile](./UPS-Design.md) objects
* **Notes**: Use`promise.all` to allow for parallel execution of promises in data retrieval. See `filterContactsIntoBatches` for how to handle errors in such operaion.

## Connections DAO

#### `createConnectionRequest(from, to)`
* **Description**: Creates connection request under 'requests/sent/<FROM-TAGFERID>' and 'requests/received/<TO-TAGFERID>'. In other words, the function creates a connection request 'from.tagferId' with 'from.profileN' to 'to'.
* **Parameters**:
    + **from**: Object of `{tagferId: String, profileN: Integer}`
    + **to**: String of tagferId
* **Returns**: Promise
* **Throws**: Upon failure of any request throw firebase error.
* **Notes**: Consider using update here with (data-fan-out). This will allow one network request and one promise. [Here](https://firebase.google.com/docs/database/web/read-and-write#updating_or_deleting_data) is an example.

#### `createConnection(from, to)`
* **Description**: Creates a connection under the connections collection, one entry under each tagferId child, and increment the count of each.
* **Parameters**:
    + **from**: Object of `{tagferId: String, profileN: Integer}`
    + **to**: Object of `{tagferId: String, profileN: Integer}`
* **Returns**: Promise
* **Notes**: Use [transactions](https://firebase.google.com/docs/database/web/read-and-write#save_data_as_transactions) for the connection collection update.

#### `removeConnectionRequest(from, to)`
* **Description**: Removes connection request under 'requests/sent/_FROM-TAGFERID_' and 'requests/received/_TO-TAGFERID_'. 
* **Parameters**:
    + **from** String From-TagferID
    + **to** String  To-TagferID
* **Returns**: Promise
* **Notes**: Consider using update here and setting the connection request values to `null`. This will allow one network request and one promise. [Here](https://firebase.google.com/docs/database/web/read-and-write#updating_or_deleting_data) is an example.

#### `getConnectionRequests(tagferId)`
* **Description**: Get connection requests (sent or received) for a tagferId. Simple query from under 'requests/tagferId/'.
* **Parameters**: 
    + **tagferId**: String
* **Returns**: Array<Profile>
* **Throws**: Upon failure throw firebase error.
* **Notes**: Use the `getLiteProfiles` from the profile dao to get a lite profile.

#### `getAllConnections(tagferId)`
* **Description**: Gets all the connection for a tagferId.
* **Parameters**: 
    + **tagferId**: String
* **Returns**: Object `{profile1: [], profile2: [], profile3: [], profiel4: []}`
* **Notes**: Fetch all the connections, iterate and filter into the proper bucket.

#### `getAutoAccept(tagferId)`
* **Description**: Checks if the tagferId has auto accept turned on. 
* **Returns**: The auto accept profile number, 0 indicates false.
* **Notes**: 0 is falsy in Javascript.

#### `getConnectionProfile(from, to)`
* **Description**: Checks if two tagferIds are connected.
* **Parameters**: 
    + **from** String From-TagferID
    + **to** String To-TagferID
* **Returns**: Promise<Number>, 0 if not connected and [1,4] otherwise.

#### `deleteConnection(tagferId1, tagfeId2)`
* **Description**: Deletes a connection between two tagfers.
* **Parameters**:
    + **tagferId1**: String
    + **tagferId2**: String
* **Returns**: Promise
* **Notes**: Consider using update here and setting the connection request values to `null`. This will allow one network request and one promise. [Here](https://firebase.google.com/docs/database/web/read-and-write#updating_or_deleting_data) is an example.

## Connections Handler

For request and response variable names please see the [API](./UPS-API.md).

#### `createConnectionRequest(req, res)`
* **Description**: Gets the tagferId from Loki, then uses the url param of 'profileN' to create the 'from' object.Calls the DAO#getAutoAccept and if return value > 0, we call DAO#createConnection. Otherwise, passes it to the DAO#createConnectionRequest. 

#### `acceptConnectionRequest(req, res)`
* **Description**: Gets the tagferId from Loki, then uses the url param of 'profileN' to create the 'from' object. Then creates the 'to' object from the request body. Then calls the DAO for DAO#removeConnectionRequest and DAO#createConnection

#### `getConnectionRequests(req, res)`
* **Description**: Gets the tagferId from Loki, then passes it to the DAO#getConnectionRequests with a type of 'sent'

#### `getAllConnections(req, res)`
* **Description**: Gets the tagferId from Loki, then passes it to the DAO#getAllConnections

## Notes DAO
Notes are created between connected users, hence we use the `from` and `to` parameters to indicate that the note is 'from' a user directed 'to' another user. The parameter names mayb be confusing at first glance once you get this concent you will understand it.

#### `createNote(from, to, content)`
* **Description**: Creates a new note under the DB path 'notes/from/to/', uses `push()` to create a new noteId. We leverage that function since it provides a chronologic ordering for data. We add a createdAt timestamp that should be in the UTC format, to support clients in different regions.
* **Parameters**:
    + **from**: String of from-tagferID
    + **to**: String of to-tagferID
    + **content**: String of note content
* **Returns**: `Promise<void>`

#### `updateNote(from, to, oldNoteId, content)`
* **Description**: Updates the note by deleting the existing one with noteId and creates a new one, allows leveraging firebase's uuid chronologically ordered keys.
* **Parameters**:
    + **from**: String of from-tagferID
    + **to**: String of to-tagferID
    + **oldNoteId**: String of the noteId
    + **content**: String of note content
* **Returns**: `Promise<void>`

#### `deleteNote(from, to, noteId)`
* **Description**: Deletes the note under the DB path 'notes/from/to/noteId'.
* **Parameters**:
    + **from**: String of from-tagferID
    + **to**: String of to-tagferID
    + **noteId**: String of the noteId
* **Returns**: `Promise<void>`

#### `getAllNotes(from, to)`
* **Description**: Fetches all the notes under the DB path 'notes/from/to'.
* **Parameters**:
    + **from**: String of from-tagferID
    + **to**: String of to-tagferID
* **Returns**: `Promise<Array<Note>>`

## Notes Handler

For request and response variable names please see the [API](./UPS-API.md).

#### `createNote(req,res)`
* **Description**: Creates a new note by calling DAO#createNote, finds the 'from' by using the session and 'to' from the query paramter.

#### `updateNote(req,res)`
* **Description**: Updates an existing note by calling DAO#updateNote, finds 'nodeId' and 'content' from the request and the 'to' from the query parameter.

#### `deleteNote(req,res)`
* **Description**: Deletes an existing note by calling DAO#deleteNote, finds 'noteId' from the request.

#### `getAllNotes(req,res)`
* **Description**: Fetches all the notes for a given connection by calling DAO#getAllNotes.
