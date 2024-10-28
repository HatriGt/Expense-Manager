import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {!session ? <AuthForm /> : <Dashboard />}
    </div>
  );
}

export default App;