import { useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  auth,
  db,
  isFirebaseConfigured,
  signInWithGoogle,
  logoutUser,
} from "./firebase";
import { computeBudget, toDateString } from "./lib/budget";
import { getFriendlyErrorMessage } from "./lib/authErrors";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import AddExpense from "./pages/AddExpense";
import Metrics from "./pages/Metrics";
import "./App.css";

const emptyPreferences = {
  startDay: 1,
  endDay: 31,
  monthlyAmount: "",
};

function SetupBanner() {
  return (
    <div className="setup">
      <h1>Monthly Expenses</h1>
      <p>
        Add your Firebase web app keys to <code>.env</code>, then restart the app.
      </p>
      <pre>{`REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=`}</pre>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [connected, setConnected] = useState(false);
  const [bootError, setBootError] = useState("");
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [draft, setDraft] = useState(emptyPreferences);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Active Group States
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [activeGroupName, setActiveGroupName] = useState("");
  const [activeGroupData, setActiveGroupData] = useState(null);
  const [memberEmail, setMemberEmail] = useState("");

  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [type, setType] = useState("Other");

  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [authError, setAuthError] = useState("");
  const [formError, setFormError] = useState("");

  // 1. Authentication Listener
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoadingAuth(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoadingAuth(false);
      },
      (error) => {
        setAuthError(getFriendlyErrorMessage(error));
        setLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function handleGoogleLogin() {
    setAuthError("");
    try {
      await signInWithGoogle();
    } catch (error) {
      if (error.code !== "auth/popup-closed-by-user") {
        setAuthError(getFriendlyErrorMessage(error));
      }
    }
  }

  async function handleLogout() {
    try {
      await logoutUser();
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    }
  }

  // 2. Resolve Active Group by Member Email and Extract 'name' (e.g. "me")
  useEffect(() => {
    if (!user?.email || !isFirebaseConfigured()) return undefined;

    const userEmail = user.email.toLowerCase();
    const groupsQuery = query(
      collection(db, "groups"),
      where("members", "array-contains", userEmail)
    );

    const unsubGroups = onSnapshot(
      groupsQuery,
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-create default group with name "me"
          const defaultGroupId = `${user.uid}_me`;
          const defaultGroupRef = doc(db, "groups", defaultGroupId);
          const initialData = {
            name: "me",
            ownerId: user.uid,
            members: [userEmail],
            createdAt: serverTimestamp(),
          };

          await setDoc(defaultGroupRef, initialData);
          setActiveGroupId(defaultGroupId);
          setActiveGroupName("me");
          setActiveGroupData(initialData);
        } else {
          const firstGroupDoc = snapshot.docs[0];
          const data = firstGroupDoc.data();
          setActiveGroupId(firstGroupDoc.id);
          setActiveGroupName(data.name || "me");
          setActiveGroupData(data);
        }
      },
      (error) => setBootError(getFriendlyErrorMessage(error))
    );

    return () => unsubGroups();
  }, [user]);

  // 3. Listen to Subcollections Under users/{activeGroupName}/...
  useEffect(() => {
    if (!user || !activeGroupName) return undefined;

    let cancelled = false;

    const prefsRef = doc(db, "users", activeGroupName, "preferences", "current");
    const expensesQuery = query(
      collection(db, "users", activeGroupName, "expenses"),
      orderBy("date", "desc")
    );
    const categoriesQuery = query(
      collection(db, "users", activeGroupName, "categories"),
      orderBy("name", "asc")
    );

    const unsubPrefs = onSnapshot(
      prefsRef,
      (snapshot) => {
        setConnected(true);
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const next = {
          startDay: data.startDay ?? 1,
          endDay: data.endDay ?? 31,
          monthlyAmount: data.monthlyAmount ?? "",
        };
        setPreferences(next);
        setDraft(next);
      },
      (error) => !cancelled && setBootError(getFriendlyErrorMessage(error))
    );

    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        setConnected(true);
        setExpenses(
          snapshot.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              ...data,
              type: data.type || "Other",
            };
          })
        );
      },
      (error) => !cancelled && setBootError(getFriendlyErrorMessage(error))
    );

    const unsubCategories = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const catList = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (!catList.some((c) => c.name.toLowerCase() === "other")) {
          catList.push({ id: "default-other", name: "Other" });
        }
        setCategories(catList);
      },
      (error) => !cancelled && setBootError(getFriendlyErrorMessage(error))
    );

    return () => {
      cancelled = true;
      unsubPrefs();
      unsubExpenses();
      unsubCategories();
    };
  }, [user, activeGroupName]);

  const budget = useMemo(
    () =>
      computeBudget({
        monthlyAmount: Number(preferences.monthlyAmount) || 0,
        startDay: Number(preferences.startDay) || 1,
        endDay: Number(preferences.endDay) || 31,
        expenses,
      }),
    [preferences, expenses]
  );

  // Add Member Email to Group Metadata
  async function addEmailToGroup(e) {
    e.preventDefault();
    if (!memberEmail.trim() || !activeGroupId) return;
    setFormError("");

    try {
      const groupRef = doc(db, "groups", activeGroupId);
      await updateDoc(groupRef, {
        members: arrayUnion(memberEmail.trim().toLowerCase()),
      });
      setMemberEmail("");
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    }
  }

  // --- Firestore Writes Scoped to users/{activeGroupName}/... ---

  async function savePreferences(event) {
    event.preventDefault();
    if (!activeGroupName) return;
    setSavingPrefs(true);
    setFormError("");
    try {
      await setDoc(doc(db, "users", activeGroupName, "preferences", "current"), {
        startDay: Number(draft.startDay),
        endDay: Number(draft.endDay),
        monthlyAmount: Number(draft.monthlyAmount) || 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    } finally {
      setSavingPrefs(false);
    }
  }

  async function addQuickExpense(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0 || !activeGroupName) return;

    setSavingExpense(true);
    setFormError("");
    try {
      await addDoc(collection(db, "users", activeGroupName, "expenses"), {
        amount: value,
        note: note.trim(),
        type: type || "Other",
        date: toDateString(new Date()),
        createdBy: user.email,
        createdAt: serverTimestamp(),
      });
      setAmount("");
      setNote("");
      setType("Other");
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    } finally {
      setSavingExpense(false);
    }
  }

  async function addManualExpense({ amount, note, date, type }) {
    if (!activeGroupName) return;
    setSavingExpense(true);
    setFormError("");
    try {
      await addDoc(collection(db, "users", activeGroupName, "expenses"), {
        amount: Number(amount),
        note: note.trim(),
        type: type || "Other",
        date: date || toDateString(new Date()),
        createdBy: user.email,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
      throw error;
    } finally {
      setSavingExpense(false);
    }
  }

  async function updateExpenseType(id, newType) {
    if (!activeGroupName) return;
    try {
      await updateDoc(doc(db, "users", activeGroupName, "expenses", id), {
        type: newType || "Other",
      });
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    }
  }

  async function removeExpense(id) {
    if (!activeGroupName) return;
    try {
      await deleteDoc(doc(db, "users", activeGroupName, "expenses", id));
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    }
  }

  async function addCategory(categoryName) {
    if (!categoryName.trim() || !activeGroupName) return;
    try {
      await addDoc(collection(db, "users", activeGroupName, "categories"), {
        name: categoryName.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    }
  }

  async function removeCategory(id) {
    if (!activeGroupName) return;
    try {
      await deleteDoc(doc(db, "users", activeGroupName, "categories", id));
    } catch (error) {
      setFormError(getFriendlyErrorMessage(error));
    }
  }

  if (!isFirebaseConfigured()) return <SetupBanner />;

  if (loadingAuth) {
    return (
      <div className="setup">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="setup">
        <h1>Monthly Expenses</h1>
        <p>Sign in with your account to access your expenses and budget.</p>

        {authError && (
          <div className="error-card">
            <strong>Authentication Error</strong>
            <p>{authError}</p>
          </div>
        )}

        <button type="button" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="setup">
        <h1>Could not connect to Firestore</h1>
        <p>{bootError}</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="setup">
        <p>Connecting to Group Data…</p>
      </div>
    );
  }

  const todayStr = toDateString(new Date());
  const todaysList = expenses.filter((expense) => expense.date === todayStr);
  const prefsReady = Number(preferences.monthlyAmount) > 0;

  return (
    <div className="page">
      <NavBar user={user} onLogout={handleLogout} />

      {formError && (
        <div className="error-banner">
          <span>{formError}</span>
          <button
            type="button"
            onClick={() => setFormError("")}
            className="link"
            style={{ cursor: "pointer", border: "none", background: "none" }}
          >
            Dismiss
          </button>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              budget={budget}
              prefsReady={prefsReady}
              amount={amount}
              setAmount={setAmount}
              note={note}
              setNote={setNote}
              type={type}
              setType={setType}
              savingExpense={savingExpense}
              addExpense={addQuickExpense}
              todaysList={todaysList}
              removeExpense={removeExpense}
              categories={categories}
              updateExpenseType={updateExpenseType}
            />
          }
        />
        <Route
          path="/add"
          element={
            <AddExpense
              categories={categories}
              addManualExpense={addManualExpense}
              savingExpense={savingExpense}
            />
          }
        />
        <Route
          path="/metrics"
          element={<Metrics expenses={expenses} categories={categories} />}
        />
        <Route
          path="/admin"
          element={
            <Admin
              budget={budget}
              preferences={preferences}
              prefsReady={prefsReady}
              draft={draft}
              setDraft={setDraft}
              savingPrefs={savingPrefs}
              savePreferences={savePreferences}
              expenses={expenses}
              removeExpense={removeExpense}
              categories={categories}
              addCategory={addCategory}
              removeCategory={removeCategory}
              updateExpenseType={updateExpenseType}
              // Group Management Props
              activeGroupName={activeGroupName}
              activeGroupData={activeGroupData}
              memberEmail={memberEmail}
              setMemberEmail={setMemberEmail}
              addEmailToGroup={addEmailToGroup}
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;