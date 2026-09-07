import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./firebase", () => ({
  db: null,
  USER_ID: "me",
  isFirebaseConfigured: () => false,
}));

test("asks for Firebase config when keys are missing", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Add your Firebase web app keys/i)).toBeInTheDocument();
});
