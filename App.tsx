import {AuthProvider} from "./src/app/providers/AuthProvider";
import {Navigation} from "./src/app/navigation";
import { I18nextProvider } from "react-i18next";
import i18n from './src/localization/i18n';

export default function App() {
  return (
      <AuthProvider>
        <I18nextProvider i18n={i18n}>
            <Navigation/>
        </I18nextProvider>
      </AuthProvider>
  );
}
