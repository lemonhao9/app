import { NavBar } from '../components/ui/NavBar';

export function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <NavBar dark/>
      <h1>About Page</h1>
      <p>This is the About page of HomeCycl'Home.</p>
    </div>
  );
}