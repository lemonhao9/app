import { NavBar } from '../components/ui/NavBar';

export function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <NavBar dark/>
      <h1>Login Page</h1>
      <p>This is the Login page of HomeCycl'Home.</p>
    </div>
  );
}