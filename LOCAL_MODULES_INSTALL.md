# Local module installation

Use these commands when you want to install dependencies only inside each project folder, not globally.

## From the repository root

```bash
cd app-frontend && npm install
cd ../app-backend && npm install
```

## If you are already inside one folder

Frontend:

```bash
npm install
```

Backend:

```bash
npm install
```

## Notes

- Run the frontend command inside `app-frontend/`.
- Run the backend command inside `app-backend/`.
- These commands install each project's local `node_modules/` folder.
