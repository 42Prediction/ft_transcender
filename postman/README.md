# Postman requests

This folder contains a reusable Postman collection for the user flow used by the frontend profile page.

## What it covers

- `POST /users` to create a user
- `GET /users/:username` to open the profile consumed by `app-frontend/src/pages/Profile.tsx`

## How to use

1. Import `ft_transcender_users.postman_collection.json` into Postman.
2. Make sure the backend is running at `http://localhost:3000` or change the `baseUrl` collection variable.
3. Update the collection variables if needed:
   - `username`
   - `email`
   - `password`
   - `avatarUrl`
4. Send `Create user`.
5. Open the frontend at `/users/<username>` to see the profile page.

## Curl example

You can also create the same user directly from the terminal with:

```bash
curl -s -X POST http://localhost:3000/users -H 'Content-Type: application/json' -d '{"username":"postman_user_20260521","email":"postman_user_20260521@example.com","password":"ChangeMe123!","avatar_url":"https://i.imgur.com/6VBx3io.png","is_online":true}'
```

## Example body

```json
{
  "username": "new_user",
  "email": "new_user@example.com",
  "password": "ChangeMe123!",
  "avatar_url": "https://i.imgur.com/6VBx3io.png",
  "is_online": true
}
```

## Notes

- `FriendsList.tsx` is currently static on the frontend, so it does not depend on the created user yet.
- The backend route is `POST /users`, and the profile route is `GET /users/:username`.
