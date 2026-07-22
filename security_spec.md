# Security Specification for Tic-Tac-Toe Game

## 1. Data Invariants
- A user profile can only be read/written by its owner.
- A room can be created by any authenticated user.
- A player can only make a move if it is their turn and the cell is empty.
- Once a room's status/gameOver becomes true (terminal state), no further board edits can be made.
- The `players` array can have at most 2 players.
- Message sender ID must match the currently authenticated user.

## 2. The "Dirty Dozen" Payloads (Security Audit Scenarios)
1. **Identity Spoofing in Users Collection**: Attempting to write a user profile with a different UID.
2. **Reading Another User's Private Stats**: Attempting to read another user's profile statistics.
3. **Double Room Creation**: Creating a room with a pre-filled second player who didn't sign up.
4. **Board Manipulation Out-of-Turn**: Player 'O' trying to make a move when it is Player 'X's turn.
5. **Overwriting Existing Board Marks**: Trying to change an already marked cell.
6. **Self-Assigning Both Symbols**: One user joining a room as both player 'X' and 'O'.
7. **Bypassing Game End (Post-Terminal Writes)**: Changing the board after `gameOver` is true.
8. **Impersonating Sender in Chat**: Creating a chat message with a senderId different from the authenticated user.
9. **Junk ID Poisoning**: Trying to create a room with a 50KB string as ID.
10. **Shadow Field Injection**: Writing a room document with unapproved fields like `isAdminRoom: true`.
11. **Bypassing Timestamp Validation**: Passing a custom static future/past date for `updatedAt` instead of `request.time`.
12. **Malicious Room Join (Third Player)**: A third player trying to join a room with 2 players.

## 3. Security Rules
Rules are designed to prevent all these malicious payloads.
