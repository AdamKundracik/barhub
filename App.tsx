import {AuthProvider} from "./src/app/providers/AuthProvider";
import {Navigation} from "./src/app/navigation";


export default function App() {
  return (
      <AuthProvider>
          <Navigation/>
      </AuthProvider>
  );
}
