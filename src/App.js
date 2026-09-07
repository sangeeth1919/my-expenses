import { useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured, USER_ID } from "./firebase";
import { computeBudget, toDateString } from "./lib/budget";
import NavBar from "./components/NavBar";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
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
        Add your Firebase web app keys to <code>.env</code>, then restart
        the app.
      </p>
      <pre>{`REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=`}</pre>
      <p className="hint">
        Enable Firestore and publish the rules from <code>firestore.rules</code>.
      </p>
    </div>
  );
}

function App() {
  const [connected, setConnected] = useState(false);
  const [bootError, setBootError] = useState("");
  const [preferences, setPreferences] = useState(emptyPreferences);
  const [draft, setDraft] = useState(emptyPreferences);
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [formError, setFormError] = useState("");

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

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      return undefined;
    }

    let cancelled = false;
    const prefsRef = doc(db, "users", USER_ID, "preferences", "current");
    const expensesQuery = query(
      collection(db, "users", USER_ID, "expenses"),
      orderBy("date", "desc")
    );

    const unsubPrefs = onSnapshot(
      prefsRef,
      (snapshot) => {
        setConnected(true);
        if (!snapshot.exists()) {
          return;
        }
        const data = snapshot.data();
        const next = {
          startDay: data.startDay ?? 1,
          endDay: data.endDay ?? 31,
          monthlyAmount: data.monthlyAmount ?? "",
        };
        setPreferences(next);
        setDraft(next);
      },
      (error) => {
        if (!cancelled) {
          setBootError(error.message);
        }
      }
    );

    const unsubExpenses = onSnapshot(
      expensesQuery,
      (snapshot) => {
        setConnected(true);
        setExpenses(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          }))
        );
      },
      (error) => {
        if (!cancelled) {
          setBootError(error.message);
        }
      }
    );

    return () => {
      cancelled = true;
      unsubPrefs();
      unsubExpenses();
    };
  }, []);

  if (!isFirebaseConfigured()) {
    return <SetupBanner />;
  }

  if (bootError) {
    return (
      <div className="setup">
        <h1>Could not connect to Firebase</h1>
        <p>{bootError}</p>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="setup">
        <p>Connecting to Firestore…</p>
      </div>
    );
  }

  async function savePreferences(event) {
    event.preventDefault();
    setSavingPrefs(true);
    setFormError("");
    try {
      await setDoc(doc(db, "users", USER_ID, "preferences", "current"), {
        startDay: Number(draft.startDay),
        endDay: Number(draft.endDay),
        monthlyAmount: Number(draft.monthlyAmount) || 0,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function addExpense(event) {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) {
      return;
    }
    setSavingExpense(true);
    setFormError("");
    try {
      await addDoc(collection(db, "users", USER_ID, "expenses"), {
        amount: value,
        note: note.trim(),
        date: toDateString(new Date()),
        createdAt: serverTimestamp(),
      });
      setAmount("");
      setNote("");
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSavingExpense(false);
    }
  }

  async function removeExpense(id) {
    await deleteDoc(doc(db, "users", USER_ID, "expenses", id));
  }

  const todayStr = toDateString(new Date());
  const todaysList = expenses.filter((expense) => expense.date === todayStr);
  const prefsReady = Number(preferences.monthlyAmount) > 0;

  return (
    <div className="page">
      <NavBar />
      {formError ? <p className="error">{formError}</p> : null}
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
              savingExpense={savingExpense}
              addExpense={addExpense}
              todaysList={todaysList}
              removeExpense={removeExpense}
            />
          }
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
            />
          }
        />
      </Routes>
    </div>
  );
}

export default App;
