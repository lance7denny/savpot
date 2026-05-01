import dynamic from "next/dynamic";

// Disable SSR for the entire app since it uses localStorage and browser APIs
const SavPotApp = dynamic(() => import("@/SavPotApp"), { ssr: false });

export default function App() {
  return <SavPotApp />;
}
