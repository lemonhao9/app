import { NavBar } from '@/components/ui/NavBar';

export function Signup() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <NavBar dark/>
      <h1>Signup Page</h1>
      <p>This is the Signup page of HomeCycl'Home.</p>
    </div>
  );
}